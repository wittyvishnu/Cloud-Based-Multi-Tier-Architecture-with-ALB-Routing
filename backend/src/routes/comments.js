const express = require('express');
const router = express.Router();
const { addComment, getComments, updateComment, deleteComment, toggleCommentLike } = require('../controllers/commentController');
const { checkCommentCache } = require('../middlewares/redisMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const parseMultipart = require('../middlewares/uploadMiddleware');

// Standardized unified endpoints
router.post('/', authenticate, parseMultipart('images', 4), addComment);
router.get('/:targetId', authenticate, checkCommentCache, getComments);
router.put('/:id', authenticate, parseMultipart('images', 4), updateComment);
router.delete('/:id', authenticate, deleteComment);
router.post('/:id/toggle-like', authenticate, toggleCommentLike);

module.exports = router;