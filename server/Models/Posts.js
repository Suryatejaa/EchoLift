const User = require('../Models/userSchema'); // Assuming you have a User model
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { generateUniqueId } = require('../utils/generateUniqueId'); // Import the utility function

const postSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 500
    },
    title: {
        type: String,
        required: true,
        maxlength: 150
    },
    detailedDescription: {
        type: String,
        required: true,
        maxlength: 999
    },
    followersRange: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    instructions: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length <= 5 && v.every(instr => instr.length <= 250);
            },
            message: 'Instructions must not exceed 5 items and each item must be less than 250 characters.'
        }
    },
    uniqueId: {
        type: String,
        unique: true,
        match: /^[A-Z]{3}[0-9]{4}[A-Z]$/
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    timestamp: {
        type: Date,
        default: Date.now
    },
    postType: {
        type: String,
        enum: ['Text', 'Image', 'Video', 'Link'],
        required: true
    },
    trendingScore: {
        type: Number,
        default: 0
    },
    lastEngagement: {
        type: Date,
        default: Date.now
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        regionWiseViews: {
            type: Map,
            of: Number,
            default: { General: 0 }
        },
        genderWiseViews: {
            type: Map,
            of: Number,
            default: { Unspecified: 0 }
        },
        roleWiseViews: {
            type: Map,
            of: Number,
            default: { Unspecified: 0 }
        },
        nicheWiseViews: {
            type: Map,
            of: Number,
            default: { General: 0 }
        },
        bookmarks: {
            type: Number,
            default: 0,
            min: 0
        },
        likes: {
            type: Number,
            default: 0,
            min: 0
        },
        appliedCount: {
            type: Number,
            default: 0,
            min: 0
        },
        appliedUsers: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        bookmarkedUsers: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        viewedUsers: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        approvedUsers: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        payAmount: {
            type: Number,
            default: 0
        }
    },
    platform: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true
    },
    lockedBudget: {
        type: Number,
        default: 0        
    },
    budgetOver:{
        type: Boolean,
        default: false
    },
    noOfPaid: {
        type: Number,
        default: 0
    },
    payStructure: {
        type: Map,
        of:Number,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'in-progress', 'completed'],
        default: 'open'
    },
    submissions: [{
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        proofUrl: {
            type: String,
            required: true
        },
        approved: {
            type: Boolean,
            default: false
        },
        payout: {
            type: Number,
            default: 0
        }
    }],
    payoutHistory: [{
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    totalApplicants: {
        type: Number,
        default: 0
    },
    rejectedApplicants: [{
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            required: true
        }
    }],
   
});

postSchema.pre('save', async function (next) {
    if (this.isNew) {
        let uniqueId;
        let isUnique = false;

        while (!isUnique) {
            uniqueId = generateUniqueId();
            const existingPost = await mongoose.models.Post.findOne({ uniqueId });
            if (!existingPost) {
                isUnique = true;
            }
        }

        this.uniqueId = uniqueId;
    }
    next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;