const express = require('express');
const User = require('../Models/userSchema');
const RecentSearch = require('../Models/RecentSearch');



const search = async (req, res) => {
    const { query, save } = req.query;
    const userId = req.user._id; // Assuming user ID is available in req.user

    if (!query || typeof query !== 'string' || query.length > 100) {
        return res.status(400).json({ message: 'Invalid query' });
    }
    try {
        let users = [];
        if (query.length === 1) {
            users = await User.find(
                { username: { $regex: `^${query}`, $options: 'i' } },
                { password: 0, phoneNumber: 0, email: 0 }
            );
        } else {
            users = await User.find(
                {
                    $or: [
                        { username: { $regex: `^${query}`, $options: 'i' } },
                        { username: { $regex: `\\b${query}\\b`, $options: 'i' } }
                    ]
                },
                { password: 0, phoneNumber: 0, email: 0 }
            );

        }

        if (save === 'true') {
            const recentSearch = new RecentSearch({ query, userId });
            await recentSearch.save();
        }

        const recentSearches = await RecentSearch.find({ userId }).sort({ createdAt: -1 }).limit(10);

        res.json({ users, recentSearches });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const getRecentSearches = async (req, res) => {
    const userId = req.user._id; // Assuming user ID is available in req.user

    try {
        const recentSearches = await RecentSearch.find({ userId }).sort({ createdAt: -1 }).limit(10);
        res.json({ recentSearches });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Clear recent searches
const clearRecentSearches = async (req, res) => {
    const userId = req.user._id; // Assuming user ID is available in req.user

    try {
        await RecentSearch.deleteMany({ userId });
        res.json({ message: 'Recent searches cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = { search, getRecentSearches, clearRecentSearches };
