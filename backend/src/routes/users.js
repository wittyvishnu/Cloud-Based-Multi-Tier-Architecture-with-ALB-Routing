const express = require('express');
const router = express.Router();
const {
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowing
} = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

// All user interaction routes require a valid JWT
router.use(authenticate);

// Toggle: POST /api/users/:id/toggle-follow
router.post('/:id/toggle-follow', toggleFollow);

// Status: GET /api/users/:id/status
router.get('/:id/status', getFollowStatus);

// Lists: Publicly viewable by any authorized user
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;