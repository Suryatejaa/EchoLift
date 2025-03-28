const express = require('express');
const User = require('../Models/userSchema'); // Assuming you have a User model
const multer = require('multer');
const { body, validationResult } = require('express-validator');

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
    try {
        const profile = await User.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profile = await User.findById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        console.log('Received data:', req.body);
        if (req.file) {
            console.log('Received file:', req.file);
        }

        const updateData = {
            name: req.body.name,
            username: req.body.username,
            bio: req.body.bio,
            gender: req.body.gender,
            profilePicture: req.file
                ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
                : profile.profilePicture
        };
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        console.log(updateData.name, updateData.username, updateData.bio, updateData.gender);
        res.status(200).json(updatedUser);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id); // Assuming req.user contains the authenticated user        
        console.log("Current: ", currentUser, "User to follow: ", userToFollow);


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
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id); // Assuming req.user contains the authenticated user
        console.log("Current: ", currentUser, "User to Unfollow: ", userToUnfollow);

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