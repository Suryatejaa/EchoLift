const User = require('../Models/userSchema');
const admin = require('firebase-admin');
const localStorage = require('localStorage');
const serviceAccount = require('../config/echolift-55215-987c2c1ef62c.json');
const otpStore = {};
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { setCookie } = require('../utils/cookieHelper');
const { setHeader } = require('../utils/headerHelper');
const jwt = require('jsonwebtoken');


// const otpGenerator = require('../utils/otpGenerator');
// const sendOtpEmail = require('../utils/sendOtpEmail');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const registerUser = async (req, res) => {
    try {

        const { name, username, email, phoneNumber, gender, role, password } = req.body;

        // Store user data temporarily
        userDetails = { name, username, email, phoneNumber, gender, role, password };

        try {
            const otpResponse = await axios.post('http://localhost:5000/api/users/otp/send', userDetails);
            // await sendOtp(email, userDetails);

            if (otpResponse.status === 200) {
                res.status(200).send({
                    message: 'OTP sent to your email. Verify OTP to complete registration.'
                });
            }
        }
        catch (error) {

            return res.status(400).send({
                message: 'Error send otp',
                error: error.response?.data?.message || error.message
            });
        }

    } catch (error) {
        res.status(400).send({
            message: 'Error registering user',
            error: error.message
        });
    }
};


const loginUser = async (req, res) => {
    try {
        const { credential, password } = req.body;
        const user = await User.findOne({
            $or: [
                { email: credential },
                { phoneNumber: credential },
                { username: credential }
            ]
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credential' });
        }
        const isValid = await user.comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        // Problem: Token may not be set immediately after login, causing profile page API to fail.
        // Expected: Token should be stored in cookies/headers and available for API requests immediately after login.

        const token = user.generateAuthToken();
        console.log('Token generated called');
        const cookieExpires = 3600000; // 1 hour in milliseconds
        setCookie(res, token, cookieExpires);
        setHeader(res, token);
        console.log(`token set ${token}`);
        res.send({
            message: 'Logged in successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: 'Error logging in user',
            error: error.message
        });
    }
};


const getUser = async (req, res) => {
    try {
        const token = req.header('Authorization').split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');
        res.send(user);
    } catch (error) {
        res.status(400).send({ message: 'Error getting user' });
    }
};


const updateUser = async (req, res) => {
    try {
        const token = req.header('Authorization').split(' ')[1];
        // Verify token logic will come here
        const userId = 'user ID from verified token'; // placeholder
        const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
        res.send(user);
    } catch (error) {
        res.status(400).send({ message: 'Error updating user' });
    }
};

const otpGenerator = require('../utils/otpGenerator');
const sendOtpEmail = require('../utils/sendOtpEmail');
const sendOtp = async (req, res) => {
    try {

        const userDetails = req.body;
        const email = userDetails.email;
        const otp = otpGenerator();
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, otpExpiry, ...userDetails };

        await sendOtpEmail(email, otp);
        res.status(200).send({ message: 'OTP sent to your email. Verify OTP to complete registration.' });


    } catch (error) {
        console.error('Error sending OTP: ', error.message);
        throw new Error('Failed to send OTP. Please try again later.');
    }
};
console.log("otpStrore: ", otpStore);

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userData = otpStore[email];

        if (!userData) {
            return res.status(400).send({ message: 'User data not found or OTP expired.' });
        }
        const otpString = otp.toString();
        if (userData.otp !== otpString) {
            return res.status(400).send({ message: 'Invalid OTP' });
        }

        if (Date.now() > userData.otpExpiry) {
            return res.status(400).send({ message: 'OTP expired. Request a new OTP.' });
        }

        const user = new User({
            name: userData.name,
            username: userData.username,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            gender: userData.gender,
            role: userData.role,
            password: userData.password, // Make sure to hash password before saving in production
            isVerified: true
        });
        await user.save();

        delete otpStore[email];
        const token = user.generateAuthToken();
        console.log('Token generated called');
        const cookieExpires = 3600000; // 1 hour in milliseconds
        setCookie(res, token, cookieExpires);
        setHeader(res, token);
        res.status(200).send({
            message: 'Registration successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error verifying OTP: ', error.message);

        res.status(500).send({ message: 'Error verifying OTP. Please try again.' });
    }
};



const forgotPasswordRequestUser = async (req, res) => {
    const { credential } = req.body;
    const email = (await User.findOne({
        $or: [
            { email: credential },
            { phoneNumber: credential },
            { username: credential }
        ]
    }).select('email').lean())?.email;

    if (!email) return res.status(404).send({ message: 'User not found' });

    const userDetails = { body: { email } };

    try {
        await sendOtp(userDetails, res);
    }
    catch (error) {

        return res.status(400).send({
            message: 'Error send otp',
            error: error.response?.data?.message || error.message
        });
    }
};

forgotPasswordVerifyOtp = async (req, res) => {
    const { otp, newPassword, confirmPassword } = req.body;
    // const email = otpStore[email];
    const otpString = otp.toString();
    console.log("otpstore: ", otpStore);
    for (const email in otpStore) {
        if (otpStore[email].otp === otpString) {
            if (Date.now() > otpStore[email].otpExpiry) {
                return res.status(400).send({ message: 'OTP expired. Request a new OTP.' });
            }
            req.body.email = email;
            return forgotPasswordResetUser({ body: { email, newPassword, confirmPassword } }, res);
            // return res.status(200).send({ message: 'OTP verified successfully' });
        }
    }
    return res.status(400).send({ message: 'Invalid OTP' });
};

const forgotPasswordResetUser = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
        return res.status(400).send({ message: `Passwords doesn't match` });
    }
    const user = await User.findOne({ email });

    if (!user) return res.status(401).send({ message: 'User not found' });
    delete otpStore[email];
    await user.updateOne({ password: await bcrypt.hash(newPassword, 12), otp: null });
    res.send({ message: 'Password reset successfully' });
};

const passwordResetUser = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;
    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) return res.status(401).send({ message: 'Invalid old password' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.send({ message: 'Password reset successfully' });
};

const checkUsernameAvailability = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        if (user) {
            return res.status(200).send({ available: false, message: 'Username is not available' });
        }
        res.status(200).send({ available: true, message: 'Username is available' });
    } catch (error) {
        res.status(500).send({ message: 'Error checking username availability', error: error.message });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    getUser, 
    updateUser, 
    sendOtp, 
    verifyOtp, 
    forgotPasswordRequestUser, 
    forgotPasswordVerifyOtp, 
    forgotPasswordResetUser, 
    passwordResetUser,
    checkUsernameAvailability // Add this line
};
