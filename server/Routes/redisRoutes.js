const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../Middleware/cacheMiddleware');

router..get('/foryou', cacheMiddleware, async (req, res) => {
    try {
        const posts = await Post.find().lean();
        await redisClient.set(req.originalUrl, JSON.stringify(posts), { EX: 600 }); // Cache for 10 minutes
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
