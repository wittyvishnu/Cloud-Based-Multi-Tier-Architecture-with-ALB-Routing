const express = require('express');
const { getFeed, getFollowedFeed } = require('../controllers/feedController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getFeed);
router.get('/followed', authenticate, getFollowedFeed);

module.exports = router;
