const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { register, login, profile, updateProfile, updateProfilePicture } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { checkCache } = require('../middlewares/redisMiddleware');
const dynamicUpload = require('../middlewares/uploadMiddleware');

// Centralized key factory
const profileKey = (req) => `user:profile:${req.userId}`;
const publicProfileKey = (req) => `user:profile:${req.params.userId}`;
// Public Routes
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:userId', checkCache(publicProfileKey), profile);
router.get('/verify-token', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        

        res.json({ 
            valid: true, 
            userId: decoded.id
        });

    } catch (err) {
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});


// Private Routes (Protected by JWT)
router.use(authenticate);

// The updated route
router.put('/update-profile',  updateProfile);
router.put('/update-profile-picture', dynamicUpload('profilePicture', 1), updateProfilePicture);

module.exports = router;