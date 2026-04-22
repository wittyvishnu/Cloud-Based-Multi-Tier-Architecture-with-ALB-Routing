const { User, Follow } = require('../models');
const { redisClient } = require('../config/redis');
const { getChannel } = require('../config/rabbitmq');

// --- Toggle Follow/Unfollow ---
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id; // User to be followed
    const followerId = req.userId;  // Authenticated user from JWT

    if (targetId === followerId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if the follow relationship already exists
    const existingFollow = await Follow.findOne({
      where: { followerId, leaderId: targetId }
    });

    if (existingFollow) {
      await existingFollow.destroy(); // Unfollow
    } else {
      await Follow.create({ followerId, leaderId: targetId }); // Follow
      // PUSH TO QUEUE: Notify the leader they have a new follower
      const channel = getChannel();
      if (channel) {
        const payload = { targetId: targetId, actorId: followerId, type: 'follow' };
        channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(payload)), { persistent: true });
      }
    }

    // INVALIDATE CACHE: Both users' profile stats are now stale
    await redisClient.del(`user:profile:${followerId}`);
    await redisClient.del(`user:profile:${targetId}`);

    // RABBITMQ: Notify workers to recalculate counts
    try {
      const channel = getChannel();
      const ids = [followerId, targetId];
      ids.forEach(id => {
        channel.sendToQueue('user_profile_sync', Buffer.from(JSON.stringify({ userId: id })), { persistent: true });
      });
    } catch (rabbitErr) {
      console.error("RabbitMQ Sync Error:", rabbitErr.message);
    }

    res.json({ message: existingFollow ? 'Unfollowed' : 'Followed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Check Follow Status ---
exports.getFollowStatus = async (req, res) => {
  try {
    const record = await Follow.findOne({
      where: { followerId: req.userId, leaderId: req.params.id }
    });
    res.json({ isFollowing: !!record }); // Returns true or false
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Get Followers List ---
// --- Get Followers List (Paginated) ---
exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Max 5 per request
    const offset = (page - 1) * limit;

    const { count, rows } = await Follow.findAndCountAll({
      where: { leaderId: req.params.id },
      limit,
      offset,
      include: [{ 
        model: User, 
        as: 'follower', 
        attributes: ['id', 'name', 'profilePic'] 
      }],
      order: [['createdAt', 'DESC']] // Show newest followers first
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users: rows.map(f => f.follower)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Get Following List (Paginated) ---
exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Max 5 per request
    const offset = (page - 1) * limit;

    const { count, rows } = await Follow.findAndCountAll({
      where: { followerId: req.params.id },
      limit,
      offset,
      include: [{ 
        model: User, 
        as: 'leader', 
        attributes: ['id', 'name', 'profilePic'] 
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users: rows.map(f => f.leader)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};