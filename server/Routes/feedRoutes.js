const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const FeedController = require('../Controller/feedController');
const authMiddleware = require('../Middleware/authenticate');
const authRoutes = require('../Middleware/refreshToken');



router.get('/foryou', [
    check('page').optional().isInt({ min: 1 }),
    check('limit').optional().isInt({ min: 1 })
], authMiddleware, FeedController.getForYouFeed);

// GET /feed/following - Fetch posts only from users or brands the current user follows
router.get('/following', [
    check('page').optional().isInt({ min: 1 }),
    check('limit').optional().isInt({ min: 1 })
], authMiddleware, FeedController.getFollowingFeed);

router.get('/currentUser/:userId', authMiddleware, FeedController.getCurrentUserPosts);

router.use('/auth', authRoutes);

module.exports = router;
