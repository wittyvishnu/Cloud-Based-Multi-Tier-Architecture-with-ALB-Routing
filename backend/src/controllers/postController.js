const { Post, PostLike, Comment, Follow, User } = require('../models');
const { redisClient } = require('../config/redis');
const { uploadToS3 } = require('../config/s3');
const { getChannel } = require('../config/rabbitmq');

/**
 * HELPER: Deconstructed Caching
 * Splits post into Static Content and Dynamic Engagement.
 */
const cachePostData = async (post, likesCount, commentsCount) => {
  const content = {
    userId: post.userId,
    text: post.text,
    imageUrls: post.imageUrls,
    author: post.author,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
  
  const engagement = {
    likesCount: likesCount || 0,
    commentsCount: commentsCount || 0
  };

  // Content (10 mins) | Engagement (1 min)
  await Promise.all([
    redisClient.setEx(`post:content:${post.id}`, 600, JSON.stringify(content)),
    redisClient.setEx(`post:engagement:${post.id}`, 60, JSON.stringify(engagement))
  ]);
};

/**
 * HELPER: Finalize Posts (RDS to Hybrid Object)
 * Hydrates raw DB results with counts and personalization.
 */
const finalizePostsForResponse = async (posts, currentUserId) => {
  return await Promise.all(posts.map(async (p) => {
    // Real-time counts from the unified Comment table
    const [likes, comments, userLiked] = await Promise.all([
      PostLike.count({ where: { postId: p.id } }),
      // Update: Filter by targetId and targetType 'post'
      Comment.count({ where: { targetId: p.id, targetType: 'post' } }), 
      PostLike.findOne({ where: { postId: p.id, userId: currentUserId } })
    ]);

    const postData = {
      id: p.id,
      userId: p.userId,
      text: p.text,
      imageUrls: p.imageUrls,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.author,
      likesCount: likes,
      commentsCount: comments,
      isLiked: !!userLiked 
    };

    await cachePostData(postData, likes, comments);
    return postData;
  }));
};

// --- 1. Get For-You Posts (Global Feed) ---
exports.getForYouPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    
    const posts = await Post.findAll({
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['name', 'profilePic'] }]
    });

    const finalized = await finalizePostsForResponse(posts, req.userId);

    // Cache the List IDs for the checkPostCache middleware
    await redisClient.setEx(`feed:foryou:global:p${page}`, 120, JSON.stringify(finalized.map(p => p.id)));

    res.json({ dataSource: 'Database', posts: finalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. Get Following Posts (Network Feed) ---
exports.getFollowingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    // Find who the user follows
    const following = await Follow.findAll({
      where: { followerId: req.userId },
      attributes: ['leaderId']
    });
    const leaderIds = following.map(f => f.leaderId);

    const posts = await Post.findAll({
      where: { userId: leaderIds },
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['name', 'profilePic'] }]
    });

    const finalized = await finalizePostsForResponse(posts, req.userId);

    // Cache IDs for this specific user's following list
    await redisClient.setEx(`feed:following:${req.userId}:p${page}`, 60, JSON.stringify(finalized.map(p => p.id)));

    res.json({ dataSource: 'Database', posts: finalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. Get Specific User Posts (Profile Feed) ---
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;

    const posts = await Post.findAll({
      where: { userId },
      limit: 5,
      offset: (page - 1) * 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['name', 'profilePic'] }]
    });

    const finalized = await finalizePostsForResponse(posts, req.userId);

    // Cache IDs for the specific profile being viewed
    await redisClient.setEx(`feed:user:${userId}:p${page}`, 120, JSON.stringify(finalized.map(p => p.id)));

    res.json({ dataSource: 'Database', posts: finalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. Create Post (Multipart + S3) ---
exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Parallel upload to S3
      const uploads = req.files.map(file => 
        uploadToS3(file.buffer, file.mimetype, file.originalname, req.userId)
      );
      imageUrls = await Promise.all(uploads);
    }

    const post = await Post.create({ userId: req.userId, text, imageUrls });

    // Invalidate the first page of the global feed so new post appears
    await redisClient.del(`feed:foryou:global:p1`);

    res.status(201).json({ message: "Post created", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. Update Post ---
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, existingImages } = req.body; // existingImages is the list of URLs to KEEP

    const post = await Post.findOne({ where: { id, userId: req.userId } });
    if (!post) return res.status(404).json({ error: "Post not found or unauthorized" });

    // 1. Handle Existing Images
    // If existingImages is empty/null, this becomes an empty array (removing all previous images)
    let finalImageUrls = [];
    if (existingImages) {
      finalImageUrls = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    // 2. Handle New Image Uploads
    if (req.files && req.files.length > 0) {
      // Check total limit (max 4)
      if (finalImageUrls.length + req.files.length > 4) {
        return res.status(400).json({ error: "Total images cannot exceed 4" });
      }

      const newUploads = req.files.map(file => 
        uploadToS3(file.buffer, file.mimetype, file.originalname, req.userId)
      );
      const newlyUploadedUrls = await Promise.all(newUploads);
      
      // Merge new uploads with preserved images
      finalImageUrls = [...finalImageUrls, ...newlyUploadedUrls];
    }

    // 3. Update Database
    await post.update({ 
      text: text || post.text, 
      imageUrls: finalImageUrls 
    });

    // 4. Invalidate Cache
    // We only need to delete the Static Content cache; engagement stays the same
    await redisClient.del(`post:content:${post.id}`);

    res.json({ message: "Post updated successfully", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. Delete Post ---
exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.destroy({ where: { id: req.params.id, userId: req.userId } });
    if (!deleted) return res.status(404).json({ error: "Post not found or unauthorized" });

    // Full cache cleanup
    await Promise.all([
      redisClient.del(`post:content:${req.params.id}`),
      redisClient.del(`post:engagement:${req.params.id}`)
    ]);
    
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From authenticate middleware

    // 1. Check if like exists
    const existingLike = await PostLike.findOne({
      where: { postId, userId }
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike logic: Remove from RDS
      await existingLike.destroy();
      isLiked = false;

    } else {
      // Like logic: Create in RDS
      await PostLike.create({ postId, userId });
      isLiked = true;
      const channel = getChannel();
      if (channel) {
        const payload = { targetId: postId, actorId: userId, type: 'like_post' };
        channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(payload)), { persistent: true });
      }
    }

    // 2. Notify Post-Worker via RabbitMQ to recalculate counts
    const channel = getChannel();
    const queue = 'post_interaction_sync';
    const message = JSON.stringify({ postId });
    
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

    // 3. Invalidate Engagement Cache
    // This forces the next fetch to see the updated numbers from the worker
    await redisClient.del(`post:engagement:${postId}`);

    res.json({ 
      message: isLiked ? "Post liked" : "Post unliked", 
      isLiked 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 7. Get Single Post by ID ---


exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch from Database (Cache Missed)
    const post = await Post.findOne({
      where: { id },
      include: [{ model: User, as: 'author', attributes: ['name', 'profilePic'] }]
    });

    // 2. Handle "Not Found" properly
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // 3. Hydrate data and UPDATE REDIS CACHE
    // Note: finalizePostsForResponse calls cachePostData() under the hood, 
    // so Redis is instantly updated with this fresh DB data!
    const finalized = await finalizePostsForResponse([post], req.userId);

    res.json({ dataSource: 'Database', post: finalized[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};