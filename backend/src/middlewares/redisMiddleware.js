const { redisClient } = require('../config/redis');
const { PostLike } = require('../models');
/**
 * MIDDLEWARE: Checks if data exists in Redis.
 * If found, returns the response immediately with dataSource: 'Cache'.
 */
exports.checkCache = (keyFactory) => {
  return async (req, res, next) => {
    try {
      const key = keyFactory(req);
      req.cacheKey = key; // Attach key for controller use

      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json({
          ...JSON.parse(cachedData),
          dataSource: 'Cache'
        });
      }
      next();
    } catch (err) {
      console.error("Redis Check Error:", err);
      next();
    }
  };
};



exports.checkPostCache = (cacheKeyPrefix) => {
  return async (req, res, next) => {
    try {
      const page = req.query.page || 1;
      // Ensure this logic in your middleware is capturing the specific user's feed list
    const listKey = cacheKeyPrefix === 'feed:following' 
  ? `${cacheKeyPrefix}:${req.userId}:p${page}` // Unique key per user for following feed
  : `${cacheKeyPrefix}:${req.params.userId || 'global'}:p${page}`;
      const cachedIds = await redisClient.get(listKey);
      if (!cachedIds) return next();

      const postIds = JSON.parse(cachedIds);

      // 1. Fetch Static Content & Dynamic Engagement separately
      const posts = await Promise.all(postIds.map(async (id) => {
        const [content, engagement] = await Promise.all([
          redisClient.get(`post:content:${id}`),
          redisClient.get(`post:engagement:${id}`)
        ]);
        
        if (!content) return null; // Fallback if content expired
        return { id, ...JSON.parse(content), ...JSON.parse(engagement) };
      }));

      // Filter out any nulls if cache expired partially
      const validPosts = posts.filter(p => p !== null);

      // 2. Personalization: Real-time isLiked check
      const userLikes = await PostLike.findAll({
        where: { userId: req.userId, postId: postIds },
        attributes: ['postId']
      });
      const likedSet = new Set(userLikes.map(l => l.postId));

      const finalized = validPosts.map(p => ({
        ...p,
        isLiked: likedSet.has(p.id)
      }));

      return res.json({ dataSource: 'Cache', posts: finalized });
    } catch (err) {
      next();
    }
  };
};

exports.checkCommentCache = async (req, res, next) => {
  try {
    const { targetId } = req.params;
    const { type = 'post', page = 1 } = req.query;
    const cacheKey = `comments:${type}:${targetId}:p${page}`;

    // Look for the list of UUIDs in Redis
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      req.cachedCommentIds = JSON.parse(cachedData);
      req.isCacheHit = true;
    } else {
      req.isCacheHit = false;
    }
    next();
  } catch (error) {
    console.error("Redis Cache Middleware Error:", error);
    req.isCacheHit = false; // Fallback to DB on error
    next();
  }
};


// Add this to your existing redisMiddleware.js exports
exports.checkSinglePostCache = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch Content and Engagement from Redis in parallel
    const [content, engagement] = await Promise.all([
      redisClient.get(`post:content:${id}`),
      redisClient.get(`post:engagement:${id}`)
    ]);

    // If static content is missing or expired, fallback to the database controller
    if (!content) return next();

    const parsedContent = JSON.parse(content);
    
    // Engagement has a shorter TTL. Fallback to 0 if it expired before content.
    const parsedEngagement = engagement ? JSON.parse(engagement) : { likesCount: 0, commentsCount: 0 };

    // Personalization: Check real-time if the user liked it
    const userLike = await PostLike.findOne({
      where: { userId: req.userId, postId: id }
    });

    const finalizedPost = {
      id,
      ...parsedContent,
      ...parsedEngagement,
      isLiked: !!userLike
    };

    return res.json({ dataSource: 'Cache', post: finalizedPost });
  } catch (err) {
    console.error("Single Post Cache Middleware Error:", err);
    next(); // Fallback to DB on error
  }
};