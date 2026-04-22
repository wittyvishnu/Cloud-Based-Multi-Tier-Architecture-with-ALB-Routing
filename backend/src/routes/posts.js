const express = require('express');
const router = express.Router();
// Use object destructuring to pull the specific function
const { checkPostCache, checkSinglePostCache } = require('../middlewares/redisMiddleware'); 
const { 
  getForYouPosts, 
  getFollowingPosts, 
  getUserPosts, 
  createPost, 
  updatePost, 
  deletePost, 
  toggleLike,
  getPostById
} = require('../controllers/postController');
const { authenticate } = require('../middlewares/authMiddleware');
const parseMultipart = require('../middlewares/uploadMiddleware');

// Feeds with Hybrid Caching
router.get('/for-you', authenticate, checkPostCache('feed:foryou'), getForYouPosts);
router.get('/following', authenticate, checkPostCache('feed:following'), getFollowingPosts);
router.get('/user/:userId', authenticate, checkPostCache('feed:user'), getUserPosts);

// ... rest of your routes
// Management Routes
router.use(authenticate); // All management routes require authentication
router.get('/:id', authenticate, checkSinglePostCache, getPostById);
router.post('/', parseMultipart('images', 4), createPost); 
router.put('/:id', parseMultipart('images', 4), updatePost);
router.delete('/:id', deletePost);
router.post('/:postId/toggle-like', authenticate, toggleLike);

module.exports = router;