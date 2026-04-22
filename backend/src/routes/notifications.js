const express = require('express');
const { getNotifications, getUnreadNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/notifications?page=1 (Gets ALL notifications)
router.get('/', authenticate, getNotifications);

// GET /api/notifications/unread?page=1 (Gets ONLY UNREAD)
router.get('/unread', authenticate, getUnreadNotifications);

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, markAsRead);

module.exports = router;