const { Comment, CommentLike, User, sequelize } = require('../models');
const { redisClient } = require('../config/redis');
const { uploadToS3 } = require('../config/s3');
const { getChannel } = require('../config/rabbitmq');

/**
 * HELPER: Hydrate IDs with Content & Personalization
 */
async function hydrateComments(items, userId) {
  return await Promise.all(items.map(async (item) => {
    // If 'item' is an ID string (from Cache), fetch the record
    const id = typeof item === 'string' ? item : item.id;
    
    const base = await Comment.findByPk(id, {
       include: [{ model: User, as: 'user', attributes: ['name', 'profilePic'] }]
    });

    if (!base) return null;

    // Fetch real-time engagement counts and user-specific status
    const [likes, replies, liked] = await Promise.all([
      CommentLike.count({ where: { commentId: id } }),
      Comment.count({ where: { targetId: id, targetType: 'comment' } }),
      CommentLike.findOne({ where: { commentId: id, userId } })
    ]);

    return { 
      ...base.toJSON(), 
      totalLikes: likes, 
      totalReplies: replies, 
      isLiked: !!liked 
    };
  })).then(results => results.filter(c => c !== null));
}

// --- Add Comment or Reply ---
exports.addComment = async (req, res) => {
  try {
    const { postId, commentId, comment } = req.body;
    const targetId = commentId || postId;
    const targetType = commentId ? 'comment' : 'post';

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = req.files.map(f => uploadToS3(f.buffer, f.mimetype, f.originalname, req.userId));
      imageUrls = await Promise.all(uploads);
    }

    const newComment = await Comment.create({ targetId, targetType, userId: req.userId, comment, imageUrls });

    // PUSH TO QUEUE: Notify the owner of the post or parent comment
    const channel = getChannel();
    if (channel) {
      const payload = {
        targetId: targetId,
        actorId: req.userId,
        type: targetType === 'post' ? 'comment_post' : 'comment_comment'
      };
      channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(payload)), { persistent: true });
    }
    // Invalidate Page 1 cache for this target
    await redisClient.del(`comments:${targetType}:${targetId}:p1`);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Get Comments (Hybrid) ---
exports.getComments = async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type = 'post', page = 1 } = req.query;
    const limit = 5;
    const cacheKey = `comments:${type}:${targetId}:p${page}`;

    let commentIds;
    let dataSource = 'Cache';

    if (!req.isCacheHit) {
      dataSource = 'Database';
      const results = await Comment.findAll({
        where: { targetId, targetType: type },
        limit,
        offset: (page - 1) * limit,
        attributes: ['id'],
        // Complex sort by likes
        order: [[sequelize.literal(`(SELECT COUNT(*) FROM "CommentLikes" WHERE "CommentLikes"."commentId" = "Comment"."id")`), 'DESC']]
      });

      commentIds = results.map(c => c.id);
      if (commentIds.length > 0) {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(commentIds));
      }
    } else {
      commentIds = req.cachedCommentIds;
    }

    const finalized = await hydrateComments(commentIds, req.userId);
    res.json({ dataSource, page: parseInt(page), comments: finalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Toggle Like ---
exports.toggleCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await CommentLike.findOne({ where: { commentId: id, userId: req.userId } });

    if (existing) await existing.destroy();
    else {
      await CommentLike.create({ commentId: id, userId: req.userId });
      // PUSH TO QUEUE: Notify comment owner of the new like
      const channel = getChannel();
      if (channel) {
        const payload = { targetId: id, actorId: req.userId, type: 'like_comment' };
        channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(payload)), { persistent: true });
      }
    }

    // Background worker update
    getChannel().sendToQueue('post_interaction_sync', Buffer.from(JSON.stringify({ targetId: id, type: 'comment' })));
    res.json({ isLiked: !existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Update ---
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, existingImages } = req.body;
    const entry = await Comment.findOne({ where: { id, userId: req.userId } });
    if (!entry) return res.status(404).json({ error: "Unauthorized" });

    let finalImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
    if (req.files && req.files.length > 0) {
      const uploads = req.files.map(f => uploadToS3(f.buffer, f.mimetype, f.originalname, req.userId));
      finalImages = [...finalImages, ...await Promise.all(uploads)];
    }

    await entry.update({ comment: text || entry.comment, imageUrls: finalImages });
    await redisClient.del(`comments:${entry.targetType}:${entry.targetId}:p1`);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Delete ---
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Comment.findOne({ where: { id, userId: req.userId } });
    if (!entry) return res.status(404).json({ error: "Unauthorized" });

    await redisClient.del(`comments:${entry.targetType}:${entry.targetId}:p1`);
    await entry.destroy();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};