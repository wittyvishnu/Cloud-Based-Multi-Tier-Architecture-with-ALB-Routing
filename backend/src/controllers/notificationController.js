const { Notification, User, Post, Comment } = require('../models');

/**
 * HELPER: Hydrate Notification with specific Post/Comment data
 */
const hydrateNotification = async (notif) => {
  const data = notif.toJSON();
  const { type, targetId, actorId } = data;

  try {
    // Case 1: like_post or comment_post
    if (type === 'like_post' || type === 'comment_post') {
      data.post = await Post.findByPk(targetId, { attributes: ['text', 'imageUrls'] });
    }

    // Case 2: like_comment
    if (type === 'like_comment') {
      const comment = await Comment.findByPk(targetId, { attributes: ['comment', 'imageUrls', 'targetId'] });
      data.comment = comment;
      if (comment) {
        data.post = await Post.findByPk(comment.targetId, { attributes: ['text', 'imageUrls'] });
      }
    }

    // Case 3: comment_comment (Reply)
    if (type === 'comment_comment') {
      data.comment = await Comment.findByPk(targetId, { attributes: ['comment', 'imageUrls'] });
      data.sendercomment = await Comment.findOne({
        where: { targetId, userId: actorId },
        attributes: ['comment', 'imageUrls'],
        order: [['createdAt', 'DESC']]
      });
    }

    return data;
  } catch (err) {
    return data;
  }
};

// --- API: Get Notifications (Max 5 per page) ---
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 

    const notifications = await Notification.findAll({
      where: { userId: req.userId },
      include: [{ 
        model: User, 
        as: 'actor', // Matches the fixed alias in index.js
        attributes: ['id', 'name', 'profilePic'] 
      }],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']] 
    });

    const enriched = await Promise.all(notifications.map(hydrateNotification));
    
    res.json({
      page,
      count: enriched.length,
      notifications: enriched 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- API: Update Read Receipt ---
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ 
      where: { id, userId: req.userId } 
    });

    if (!notification) return res.status(404).json({ error: "Notification not found" });

    await notification.update({ isRead: true });
    res.json({ message: "Notification marked as read", id, isRead: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- API: Get Unread Notifications Only (Max 5 per page) ---
exports.getUnreadNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 

    const notifications = await Notification.findAll({
      where: { 
        userId: req.userId,
        isRead: false // STRICT FILTER: Only unread
      },
      include: [{ 
        model: User, 
        as: 'actor', 
        attributes: ['id', 'name', 'profilePic'] 
      }],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']] 
    });

    const enriched = await Promise.all(notifications.map(hydrateNotification));
    
    res.json({
      page,
      count: enriched.length,
      notifications: enriched 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};