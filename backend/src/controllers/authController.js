const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Post, Follow, sequelize } = require('../models');
const { redisClient } = require('../config/redis');
const { getChannel } = require('../config/rabbitmq');
const { uploadToS3 } = require('../config/s3'); // Your helper function
/**
 * Internal Helper: Aggregates full user profile stats from RDS
 * Falls back across common column naming variants for existing DB schema.
 */
const countByColumnVariants = async (model, columnNames, value) => {
  for (const column of columnNames) {
    try {
      return await model.count({
        where: sequelize.where(sequelize.col(column), value),
      });
    } catch (error) {
      if (!/does not exist/i.test(error.message)) {
        throw error;
      }
    }
  }
  return 0;
};

const getFullUserDetails = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'bio', 'skills', 'profilePic'],
    });

    if (!user) return null;

    const [totalPostsCount, followers, following] = await Promise.all([
      countByColumnVariants(Post, ['userId', 'UserId', 'user_id', 'userid'], userId),
      countByColumnVariants(Follow, ['leaderId', 'leader_id', 'leaderid'], userId),
      countByColumnVariants(Follow, ['followerId', 'follower_id', 'followerid'], userId),
    ]);

    return {
      ...user.toJSON(),
      totalPostsCount: totalPostsCount || 0,
      followers: followers || 0,
      following: following || 0
    };
  } catch (error) {
    console.error("Aggregation Error:", error.message);
    throw error; // Propagate to catch block in controllers
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, skills: [] });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    /**
     * OFFLOAD TO WORKER
     * Instead of waiting for getFullUserDetails and Redis setEx,
     * we send a message to RabbitMQ and return a response immediately.
     */
    try {
      const channel = getChannel();
      const queueName = 'user_profile_sync';
      const message = JSON.stringify({ userId: user.id });
      
      channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    } catch (rabbitErr) {
      console.error("RabbitMQ Offload Error (Register):", rabbitErr.message);
    }

    // Return basic user data immediately
    res.status(201).json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePic: user.profilePic
      }, 
      dataSource: 'Database',
      message: 'Profile aggregation offloaded to background worker'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    /**
     * OFFLOAD TO WORKER
     * Sync the latest stats to Redis in the background.
     */
    try {
      const channel = getChannel();
      const queueName = 'user_profile_sync';
      const message = JSON.stringify({ userId: user.id });
      
      channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    } catch (rabbitErr) {
      console.error("RabbitMQ Offload Error (Login):", rabbitErr.message);
    }

    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePic: user.profilePic
      }, 
      dataSource: 'Database',
      message: 'Background cache update triggered'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const lookupUserId = req.params.userId || req.userId;
    const details = await getFullUserDetails(lookupUserId);
    if (!details) return res.status(404).json({ error: "User not found" });

    // Update Redis on cache miss
    if (req.cacheKey) {
      await redisClient.setEx(req.cacheKey, 300, JSON.stringify({ user: details }));
    }

    res.json({ user: details, dataSource: 'Database' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, skills } = req.body;
    
    // 1. Perform the primary update in RDS
    await User.update({ name, bio, skills }, { where: { id: req.userId } });

    // --- CACHE INVALIDATION ---
    // Delete the old cache immediately so next GET doesn't show old data
    try {
      await redisClient.del(`user:profile:${req.userId}`);
    } catch (redisErr) {
      console.error("Redis Delete Error (UpdateProfile):", redisErr.message);
    }

    // 2. Offload full aggregation (stats) to RabbitMQ
    try {
      const channel = getChannel();
      const queueName = 'user_profile_sync';
      const message = JSON.stringify({ userId: req.userId });
      
      channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    } catch (rabbitErr) {
      console.error("RabbitMQ Offload Error (UpdateProfile):", rabbitErr.message);
    }

    // 3. Return immediate response
    res.json({ 
      message: 'Profile updated', 
      user: { id: req.userId, name, bio, skills },
      status: 'Background sync triggered',
      dataSource: 'Database' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.updateProfilePicture = async (req, res) => {
  try {
    // 1. VALIDATION: Check if file exists in the request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // 2. UPLOAD: Manually trigger S3 upload now that we know we have a file
    const file = req.files[0];
    const profilePicUrl = await uploadToS3(file.buffer, file.mimetype, file.originalname);

    // 3. DATABASE: Update RDS
    await User.update({ profilePic: profilePicUrl }, { where: { id: req.userId } });

    // 4. CACHE & SYNC: Clear Redis and notify RabbitMQ
    try {
      await redisClient.del(`user:profile:${req.userId}`);
      const channel = getChannel();
      channel.sendToQueue('user_profile_sync', Buffer.from(JSON.stringify({ userId: req.userId })), { persistent: true });
    } catch (cacheErr) {
      console.error("Sync Error:", cacheErr.message);
    }

    res.json({ 
      message: 'Picture updated', 
      profilePic: profilePicUrl, 
      status: 'Background sync triggered',
      dataSource: 'Database' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};