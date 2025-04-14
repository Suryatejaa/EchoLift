const Post = require('../Models/Posts');
const User = require('../Models/userSchema');
const { generateUniqueId } = require('../utils/generateUniqueId'); // Import the utility function
const mongoose = require('mongoose');

// Create Post
const createPost = async (req, res) => {
    try {
        const {
            content,
            title,
            detailedDescription,
            followersRange,
            category,
            instructions,
            campaignType,
            budget,
            payStructure,
            deadline,
            platform,
        } = req.body;

        const userId = req.user._id;

        if (!['product', 'platform', 'roi'].includes(campaignType)) {
            return res.status(400).json({ error: 'Invalid Bounty' });
        }

        if (instructions && (instructions.length > 5 || instructions.some(instr => instr.length > 250))) {
            return res.status(400).json({ error: 'Instructions must not exceed 5 items and each item must be less than 250 characters.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }
        if (!budget || !deadline || !platform) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        if (!payStructure || typeof payStructure !== 'object' || Object.keys(payStructure).length === 0) {
            return res.status(400).json({ error: 'Invalid payStructure' });
        }


        if (user.role !== 'brand') {
            return res.status(403).json({ error: 'Only brands can create posts' });
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
            campaignType,
            uniqueId,
            budget,
            payStructure,
            deadline,
            platform,
            couponCodes: {}
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
        console.log(('get posts'));
        const { id: postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid postId' });
        }

        const post = await Post.findById(postId).populate('userId', 'username').lean();
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userId = req.user._id;

        if (post.userId._id.toString() === userId) {
            post.trendingScore = calculateTrendingScore(post);
            return res.status(200).json(post);
        }

        const user = await User.findById(userId).select("region gender role niche").lean();

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const trendingScore = calculateTrendingScore(post);

        // Update the trending score in the database
        await Post.findByIdAndUpdate(postId, { $set: { trendingScore } });

        // Add the recalculated trending score to the response
        post.trendingScore = trendingScore;

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
        console.log(post);
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
        const userId = req.user._id;
        const { id: postId } = req.params;
        const { title, detailedDescription, followersRange, category, instructions, payStructure, budget, deadline } = req.body;

        if (instructions.length > 5 || instructions.some(instr => instr.length > 250)) {
            return res.status(400).json({ error: 'Instructions must not exceed 5 items and each item must be less than 250 characters.' });
        }

        const post = await Post.findById(postId);

        console.log(post.userId);

        if (post.userId.toString() !== userId.toString()) {
            return res.status(400).json({ error: 'Only owners can edit the post' });
        }

        const updatedPost = await Post.findByIdAndUpdate(postId, {
            title,
            detailedDescription,
            followersRange,
            category,
            instructions,
            payStructure,
            budget,
            deadline
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

const updateDeliveryAddress = async (req, res) => {
    try {
        const { id: postId } = req.params; // Post ID
        const userId = req.user._id; // User ID from authenticated request
        const { address } = req.body; // Address details from the request body

        // Validate the address
        if (!address || !address.line1 || !address.city || !address.state || !address.zipCode || !address.country) {
            return res.status(400).json({ error: 'Invalid address. Please provide all required fields.' });
        }

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user has applied for the post
        const applicantIndex = post.applicants.findIndex(applicant => applicant.creatorId.toString() === userId.toString());
        if (applicantIndex === -1) {
            return res.status(400).json({ error: 'You have not applied for this promotion.' });
        }

        // Update the delivery address in the post schema
        post.applicants[applicantIndex].address = address;
        await post.save();

        // Update the saved address in the user schema
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add the address to the user's saved addresses if it doesn't already exist
        const existingAddress = user.deliverAdresses.find(savedAddress =>
            savedAddress.line1 === address.line1 &&
            savedAddress.city === address.city &&
            savedAddress.state === address.state &&
            savedAddress.zipCode === address.zipCode &&
            savedAddress.country === address.country
        );

        if (!existingAddress) {
            user.deliverAdresses.push(address);
            await user.save();
        }

        res.status(200).json({ message: 'Delivery address updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDeliveryAddressInternal = async (postId, userId, address) => {
    try {
        // Validate the address
        if (!address || !address.line1 || !address.city || !address.state || !address.zipCode || !address.country) {
            return { status: 400, message: 'Invalid address. Please provide all required fields.' };
        }

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return { status: 404, message: 'Post not found' };
        }

        // Check if the user has applied for the post
        const applicantIndex = post.applicants.findIndex(applicant => applicant.creatorId.toString() === userId.toString());
        // if (applicantIndex === -1) {
        //     return { status: 400, message: 'You have not applied for this promotion.' };
        // }

        // Update the delivery address in the post schema
        // post.applicants[applicantIndex].address = address;
        await post.save();

        // Update the saved address in the user schema
        const user = await User.findById(userId);
        if (!user) {
            return { status: 404, message: 'User not found' };
        }

        // Add the address to the user's saved addresses if it doesn't already exist
        const existingAddress = user.deliverAdresses.find(savedAddress =>
            savedAddress.line1 === address.line1 &&
            savedAddress.city === address.city &&
            savedAddress.state === address.state &&
            savedAddress.zipCode === address.zipCode &&
            savedAddress.country === address.country
        );

        if (!existingAddress) {
            user.deliverAdresses.push(address);
            await user.save();
        }

        return { status: 200, message: 'Delivery address updated successfully.' };
    } catch (error) {
        return { status: 500, message: error };
    }
};
// Apply to Promotion
const applyToPromotion = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;
        const { address } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Campaign not found" });

        if (post.budgetOver) {
            return res.status(400).json({ message: "Applications are closed, budget is fully allocated" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        if (user.role !== 'creator') {
            return res.status(403).json({ error: 'Only creators can apply to promotions' });
        }

        // const alreadyApplied = post.applicants.some(applicant => applicant.creatorId.toString() === userId.toString());
        const appliedAlready = post.analytics.appliedUsers.includes(userId);
        if (appliedAlready) {
            return res.status(400).json({ error: 'You have already applied to this promotion' });
        }

        if (!user.niche.map(n => n.toLowerCase().trim()).includes(post.category.toLowerCase().trim())) {
            return res.status(400).json({ error: 'This post is not your niche' });
        }

        // if (user.followersRange !== post.followersRange) {
        //     return res.status(400).json({ error: 'User profile does not match post requirements' });
        // }

        const payoutAmount = post.payStructure.get(user.followers.length.toString()) || 0;
        // if (payoutAmount === 0) {
        //     return res.status(400).json({ message: "No payout defined for your follower range" });
        // }

        if (post.lockedBudget + payoutAmount > post.budget) {
            return res.status(400).json({ message: "Not enough budget available" });
        }

        if (post.campaignType === 'product' && !address) {

            return res.status(400).json({
                'message': 'Since it is a product based bounty, so please add an address to recive the product'
            });

        }

        const budgetWillBeOver = post.lockedBudget + payoutAmount >= post.budget;

        const update = {
            $inc: {
                'analytics.appliedCount': 1,
                lockedBudget: payoutAmount
            },
            $addToSet: { 'analytics.appliedUsers': userId },
            $push: {
                applicants: {
                    creatorId: userId,
                    requestedPay: payoutAmount,
                    status: 'applied',
                }
            },
            $set: {
                lastEngagement: new Date(),
                budgetOver: budgetWillBeOver
            }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.campaignType === 'product') {

            try {
                const existingAddress = user.deliverAdresses.find(savedAddress =>
                    savedAddress.line1 === address.line1 &&
                    savedAddress.city === address.city &&
                    savedAddress.state === address.state &&
                    savedAddress.zipCode === address.zipCode &&
                    savedAddress.country === address.country
                );

                if (!existingAddress) {
                    await User.findOneAndUpdate(
                        { _id: userId },
                        { $push: { deliverAdresses: address } },
                        { new: true }
                    );
                }

                const update = {
                    $set: {
                        'applicants.$[elem].address': address // Update the address field for the matched applicant
                    }
                };

                const options = {
                    new: true, // Return the updated document
                    arrayFilters: [{ 'elem.creatorId': userId }] // Match the specific applicant by creatorId
                };

                const updatedPost = await Post.findByIdAndUpdate(postId, update, options).lean();
                if (!updatedPost) {
                    return res.status(404).json({ error: 'Post not found' });
                }

                return res.status(200).json({ message: 'Applied to promotion successfully' });

            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        }

        res.status(200).json({ message: 'Applied to promotion successfully' });
    } catch (error) {
        res.status(500).json(error);
    }
};



function getPayoutAmount(payStructureMap, followerCount) {
    for (let [range, amount] of payStructureMap.entries()) {
        const [min, max] = range.split('-').map(Number);
        if (followerCount >= min && followerCount <= max) {
            return amount;
        }
    }
    return 0;
}

// Approve Application
const approveApplication = async (req, res) => {
    try {
        const owner = req.user._id;
        const { id: postId } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.userId.toString() !== owner) {
            return res.status(403).json({ error: 'Only the post creator can approve applications' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(400).json({ error: 'Invalid userId' });

        if (!post.analytics.appliedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User has not applied to this promotion' });
        }

        if (post.analytics.approvedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User has already been approved' });
        }

        // Access payout correctly (assuming Map stored as JSON or plain object)
        // const payoutAmount = post.payStructure?.[user.followers.length] || 0;

        const payoutAmount = getPayoutAmount(post.payStructure, user.followers?.length || 0);

        if (post.lockedBudget + payoutAmount > post.budget) {
            return res.status(400).json({ error: 'Budget limit exceeded' });
        }

        const update = {
            $inc: { lockedBudget: payoutAmount },
            $addToSet: { 'analytics.approvedUsers': userId },
            $set: { lastEngagement: new Date() },
            $set: { 'applicants.$[elem].status': 'approved' }

        };

        const options = {
            new: true,
            arrayFilters: [{ "elem.creatorId": userId }]
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, options).lean();
        if (!updatedPost) return res.status(404).json({ error: 'Post not found after update' });

        res.status(200).json({ message: 'Application approved successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const approveSubmission = async (req, res) => {
    try {
        const { postId, userId } = req.params;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Campaign not found" });

        const submission = post.submissions?.find(sub => sub.userId.toString() === userId);
        if (!submission) {
            return res.status(400).json({ message: "No promotion submission found" });
        }

        const loggedInUserId = req.user.id;
        if (post.userId.toString() !== loggedInUserId) {
            return res.status(403).json({ error: 'Only the post creator can accept submissions' });
        }

        const user = await User.findById(userId);
        const payoutAmount = post.payStructure[user.followers] || 0;

        user.purse = (user.purse || 0) + payoutAmount;
        await user.save();

        // Remove from locked budget
        post.lockedBudget -= payoutAmount;
        post.noOfPaid += 1;

        await post.save();
        res.status(200).json({ message: "Payment released to creator!" });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const withdrawApplication = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post.analytics.appliedUsers.includes(userId)) {
            return res.status(404).json({ error: "You were not applied to this post" });
        }

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
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.analytics.bookmarkedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User has already saved this post' });
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
        const  userId = req.user._id;
        console.log('unbookmark tried for ', postId);

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.log(userId)
        console.log(post.analytics.bookmarkedUsers.includes(userId))
        if (!post.analytics.bookmarkedUsers.includes(userId)) {
            return res.status(400).json({ error: 'User has not saved this post' });
        }

        const update = {
            $inc: { 'analytics.bookmarks': -1 },
            $pull: { 'analytics.bookmarkedUsers': userId },
            $set: { lastEngagement: new Date() }
        };

        const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true }).lean();
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.log('Success ', updatedPost.uniqueId);
        res.status(200).json({ message: 'Post unbookmarked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Like Post
const likePost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { _id: userId } = req.user;

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

const removeLikeFromPost = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { _id: userId } = req.user;

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

const likedPosts = async (req, res) => {
    console.log('likedPosts');
    try {
        const userId = req.user._id;

        const posts = await Post.find({ likes: userId }).lean();

        res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

const bookmarkedPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const posts = await Post.find({ 'analytics.bookmarkedUsers': userId }).lean();

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const appliedPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const posts = await Post.find({ 'analytics.appliedUsers': userId }).lean();

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const submittedPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const posts = await Post.find({ 'submissions.creatorId': userId }).lean();

        res.status(200).json(posts);
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
    removeLikeFromPost,
    approveApplication,
    approveSubmission,
    updateDeliveryAddress,
    likedPosts,
    bookmarkedPosts,
    appliedPosts,
    submittedPosts
};