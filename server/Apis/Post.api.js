const Post = require('../Models/Posts');
const User = require('../Models/userSchema');
const { generateUniqueId } = require('../utils/generateUniqueId'); // Import the utility function
const mongoose = require('mongoose');

// Create Post
const createPost = async (req, res) => {
    try {
        const { userId, content, title, detailedDescription, followersRange, category, instructions, postType } = req.body;

        if (instructions && (instructions.length > 5 || instructions.some(instr => instr.length > 250))) {
            return res.status(400).json({ error: 'Instructions must not exceed 5 items and each item must be less than 250 characters.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        let uniqueId;
        let isUnique = false;

        while (!isUnique) {
            uniqueId = generateUniqueId();
            const existingPost = await Post.findOne({ uniqueId });
            if (!existingPost) {
                isUnique = true;
            }
        }

        const newPost = new Post({
            userId,
            content,
            title,
            detailedDescription,
            followersRange,
            category,
            instructions,
            postType,
            uniqueId
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Post
const getPost = async (req, res) => {
    try {
        const { id: postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }

        const post = await Post.findById(postId).populate('userId', 'username').lean();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userId = req.user.id;

        if (post.userId._id.toString() === userId) {
            post.trendingScore = calculateTrendingScore(post);
            return res.status(200).json(post);
        }

        const user = await User.findById(userId).select("region gender role niche").lean();

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!post.analytics) {
            post.analytics = {};
        }
        if (!post.analytics.viewedUsers) {
            post.analytics.viewedUsers = [];
        }

        if (post.analytics && !post.analytics.viewedUsers.includes(userId)) {
            const analyticsUpdate = {
                $inc: {
                    "analytics.views": 1,
                },
                $addToSet: { "analytics.viewedUsers": userId }, // Ensures unique userIds
                $set: { lastEngagement: new Date() }
            };
            if (user.region) analyticsUpdate.$inc[`analytics.regionWiseViews.${user.region}`] = 1;
            if (user.gender) analyticsUpdate.$inc[`analytics.genderWiseViews.${user.gender}`] = 1;
            if (user.role) analyticsUpdate.$inc[`analytics.roleWiseViews.${user.role}`] = 1;
            if (user.niche) analyticsUpdate.$inc[`analytics.nicheWiseViews.${user.niche}`] = 1;

            await Post.findByIdAndUpdate(postId, analyticsUpdate);
        }

        post.trendingScore = calculateTrendingScore(post);
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Calculate Trending Score
const calculateTrendingScore = (post) => {
    const views = post.analytics.views || 0;
    const likes = post.analytics.likes || 0;
    const bookmarks = post.analytics.bookmarks || 0;
    const lastEngagement = post.lastEngagement ? new Date(post.lastEngagement).getTime() : 0;
    const now = new Date().getTime();
    const recencyFactor = Math.max(1, (now - lastEngagement) / (1000 * 60 * 60 * 24)); // Recency in days

    return (views * 0.1) + (likes * 0.5) + (bookmarks * 0.4) / recencyFactor;
};

// Update Post
const updatePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { title, detailedDescription, followersRange, category, instructions } = req.body;

        if (instructions.length > 5 || instructions.some(instr => instr.length > 250)) {
            return res.status(400).json({ error: 'Instructions must not exceed 5 items and each item must be less than 250 characters.' });
        }

        const updatedPost = await Post.findByIdAndUpdate(postId, {
            title,
            detailedDescription,
            followersRange,
            category,
            instructions
        }, { new: true }).lean();

        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Post
const deletePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }

        const deletedPost = await Post.findByIdAndDelete(postId).lean();

        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Apply to Promotion
const applyToPromotion = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const update = {
            $inc: { 'analytics.appliedCount': 1 },
            $addToSet: { 'analytics.appliedUsers': userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Applied to promotion successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Withdraw Application
const withdrawApplication = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const update = {
            $inc: { 'analytics.appliedCount': -1 },
            $pull: { 'analytics.appliedUsers': userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bookmark Post
const bookmarkPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const update = {
            $inc: { 'analytics.bookmarks': 1 },
            $addToSet: { 'analytics.bookmarkedUsers': userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Post bookmarked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unbookmark Post
const unbookmarkPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const update = {
            $inc: { 'analytics.bookmarks': -1 },
            $pull: { 'analytics.bookmarkedUsers': userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Post unbookmarked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Like Post
const likePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.likes.includes(userId)) {
            return res.status(400).json({ error: 'User has already liked this post' });
        }

        const update = {
            $inc: { 'analytics.likes': 1 },
            $addToSet: { likes: userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove Like from Post
const removeLikeFromPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!post.likes.includes(userId)) {
            return res.status(400).json({ error: 'User has not liked this post' });
        }

        const update = {
            $inc: { 'analytics.likes': -1 },
            $pull: { likes: userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.status(200).json({ message: 'Like removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPost,
    getPost,
    updatePost,
    deletePost,
    applyToPromotion,
    withdrawApplication,
    bookmarkPost,
    unbookmarkPost,
    likePost,
    removeLikeFromPost
};