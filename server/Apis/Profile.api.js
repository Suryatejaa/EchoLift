const express = require('express');
const User = require('../Models/userSchema'); // Assuming you have a User model
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { jwt } = require('jsonwebtoken');
const { use } = require('passport');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const getProfile = async (req, res) => {
    const id = req.params.id;
    try {
        const objectId = new mongoose.Types.ObjectId(id); // Convert to ObjectId
        const profile = await User.findById(objectId);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error',error: error.message });
    }
};

const updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user;
    try {

        if (req.file) {
            console.log('Received file:', req.file);
        }

        const updateData = {
            name: req.body.name,
            username: req.body.username,
            bio: req.body.bio,
            gender: req.body.gender,
            niche: req.body.niche
        };
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        res.status(200).json(updatedUser);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

const followUser = async (req, res) => {
    const userId = req.user
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(userId); // Assuming req.user contains the authenticated user        


        if (!userToFollow || !currentUser) {
            // console.log(res)
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToFollow._id.toString() === currentUser._id.toString()) {
            // console.log(res)
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        if (userToFollow.followers.includes(currentUser._id) && currentUser.following.includes(userToFollow._id)) {
            // console.log(res)
            return res.status(400).json({ message: 'You are already following this user' });
        }
        await User.updateOne(
            { _id: userToFollow._id },
            { $push: { followers: currentUser._id } }
        );
        await User.updateOne(
            { _id: currentUser._id },
            { $push: { following: userToFollow._id } }
        );

        res.json({ message: 'User followed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error);
    }
};

const unfollowUser = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(decoded._id); // Assuming req.user contains the authenticated user

        if (!userToUnfollow || !currentUser) {
            // console.log(res)
            return res.status(404).json({ message: 'User not found' });
        }
        if (userToUnfollow._id.toString() === currentUser._id.toString()) {
            // console.log(res)
            return res.status(400).json({ message: 'You cannot unfollow yourself' });
        }

        const followerIndex = userToUnfollow.followers.indexOf(currentUser._id);
        const followingIndex = currentUser.following.indexOf(userToUnfollow._id);

        if (followerIndex === -1 && followingIndex === -1) {
            // console.log(res)
            return res.status(400).json({ message: 'You are not following this user' });
        }
        await User.updateOne(
            { _id: userToUnfollow._id },
            { $pull: { followers: currentUser._id } }
        );

        await User.updateOne(
            { _id: currentUser._id },
            { $pull: { following: userToUnfollow._id } }
        );

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
        console.log(error);
    }
};

module.exports = { getProfile, updateProfile, followUser, unfollowUser };