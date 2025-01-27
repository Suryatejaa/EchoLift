const express = require('express');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Post = require('../Models/Posts');
const User = require('../Models/userSchema'); // Assuming you have a User model
const router = express.Router();

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or incorrect format' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attaching the decoded user info to the request object
        next();  // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Function to fetch global posts sorted by timestamp in descending order
const getForYouFeed = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const posts = await Post.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username'); // Assuming you want to populate the user info

        res.json(posts);
    } catch (err) {
        console.error('Error fetching For You feed:', err);
        res.status(500).json({ message: err.message });
    }
};

// Function to fetch posts only from users or brands the current user follows
const getFollowingFeed = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const user = await User.findById(req.user.id).populate('following');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followingIds = user.following.map(follow => follow._id);
        console.log('Following IDs:', followingIds);
        const posts = await Post.find({ userId: { $in: followingIds } })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username'); // Assuming you want to populate the user info

        res.json(posts);
    } catch (err) {
        console.error('Error fetching Following feed:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /feed/foryou - Fetch global posts sorted by timestamp in descending order

module.exports = { getForYouFeed, getFollowingFeed, authenticateJWT };