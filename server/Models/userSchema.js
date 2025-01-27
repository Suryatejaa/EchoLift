const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'] },
        username: { type: String, unique: true, required: [true, 'Username is required'] },
        email: {
            type: String,
            unique: true,
            required: [true, 'Email is required'],
            match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        },
        phoneNumber: {
            type: String,
            unique: true,
            required: [true, 'Phone Number is required'],
            match: /^\d{10}$/,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Gender is required'],
        },
        role: {
            type: String,
            enum: ['creator', 'brand'],
            required: [true, 'Role is required'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 8,
            match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        },
        passwordResetToken: { type: String },
        otp: { type: String },
        isVerified: { type: Boolean, default: false },

        // New fields for profile
        bio: { type: String, maxlength: 150, default: '' },
        profilePicture: { type: String, default: '' }, // URL for profile image
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }], // Reference to Post model

        // Social Media Links
        socialMedia: {
            youtube: { type: String },
            instagram: { type: String },
            facebook: { type: String },
        },

        // New fields for analytics
        currentLocation: { type: String, default: '' },
        niche: { type: String, default: '' },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate Auth Token
userSchema.methods.generateAuthToken = function () {
    const user = this;
    const payload = { _id: user._id.toString(), name: user.name };
    console.log('Token Payload:', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
    return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
