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

const calculatePostScore = (post, userId) => {
    const now = new Date();
    const postTimestamp = new Date(post.timestamp);
    const lastEngagement = new Date(post.lastEngagement);

    // Check if the user has liked or viewed the post
    const isLiked = post.likes.some((like) => like.toString() === userId.toString());
    const isViewed = post.analytics.viewedUsers.some((view) => view.toString() === userId.toString());

    // Calculate recency score (newer posts get higher scores)
    const recencyScore = Math.max(0, 1 / ((now - postTimestamp) / (1000 * 60 * 60 * 24))); // Days since post

    // Engagement score (penalize liked or viewed posts)
    const engagementScore = (isLiked ? -10 : 0) + (isViewed ? -5 : 0);

    // Trending score
    const trendingScore = post.trendingScore || 0;

    // Final score
    return recencyScore + engagementScore + trendingScore;
};

// Function to fetch global posts sorted by timestamp in descending order
const getForYouFeed = async (req, res) => {
    console.log("for you called");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const { _id: userId } = req.user;
        const posts = await Post.find()
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username') // Populate user info
            .lean(); // Use lean() for better performance
        const scoredPosts = posts.map((post) => {
            const score = calculatePostScore(post, userId);
            return { ...post, score };
        });

        // Sort posts by score in descending order
        scoredPosts.sort((a, b) => b.score - a.score);

        res.json(scoredPosts);
    } catch (err) {
        console.error('Error fetching For You feed:', err);
        res.status(500).json({ message: err.message });
    }
};

// Function to fetch posts only from users or brands the current user follows
const getFollowingFeed = async (req, res) => {
    console.log("following called");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const {_id: userId} = req.user;
        const user = await User.findById(userId).populate('following');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followingIds = user.following.map(follow => follow._id);
        console.log('Following IDs:', followingIds);
        const posts = await Post.find({ userId: { $in: followingIds } })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username') // Populate user info
            .lean(); // Use lean() for better performance

        // Calculate scores for each post
        const scoredPosts = posts.map((post) => {
            const score = calculatePostScore(post, userId);
            return { ...post, score };
        });

        // Sort posts by score in descending order
        scoredPosts.sort((a, b) => b.score - a.score);

        res.json(scoredPosts);
    } catch (err) {
        console.error('Error fetching Following feed:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /feed/foryou - Fetch global posts sorted by timestamp in descending order

module.exports = { getForYouFeed, getFollowingFeed, authenticateJWT };