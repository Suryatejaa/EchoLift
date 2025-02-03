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
            // match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        },
        refreshToken: {
            type: String,
            default: null
        },
        passwordResetToken: { type: String },
        otp: { type: String },
        isVerified: { type: Boolean, default: false },

        bio: { type: String, maxlength: 150, default: '' },
        profilePicture: { type: String, default: '' }, // URL for profile image
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }], // Reference to Post model

        socialMedia: {
            youtube: { type: String },
            instagram: { type: String },
            facebook: { type: String },
        },
        followersCount: {
            instagram: { type: Number, default: 0 },
            facebook: { type: Number, default: 0 },
        },
        subscribersCount: {
            youtube: { type: Number, default: 0 },
        },
        currentLocation: { type: String, default: '' },
        niche: { type: String, default: '' },
        purse: { type: Number, default: 0 },
    },
    { timestamps: true }
);
const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};
userSchema.pre('save', async function (next) {
    if (!validatePassword(this.password)) {
        return next(new Error("Password does not meet complexity requirements"));
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
    const user = this;
    const payload = { _id: user._id.toString(), name: user.name };
    console.log('Token Payload:', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
    return token;
};

userSchema.methods.generateRefreshToken = function () {
    const user = this;
    const payload = { _id: user._id.toString(), name: user.name };
    console.log('Refresh Token Payload:', payload);

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });
    return refreshToken;
};

userSchema.statics.verifyRefreshToken = async function (token) {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await this.findById(decoded._id);
        if (!user || user.refreshToken !== token) {
            throw new Error('Invalid refresh token');
        }
        return user;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
