const express = require('express');
const User = require('../Models/userSchema');

const generateRefreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || req.header('Refresh-Token');
    console.log('from refresh token api ',refreshToken)
    if (!refreshToken) return res.status(401).send({ message: 'Refresh token not provided' });

    try {
        const user = await User.verifyRefreshToken(refreshToken);

        const newAuthToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();

        await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

        res.cookie('token', newAuthToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.setHeader('Authorization', `Bearer ${newAuthToken}`);
        res.setHeader('Refresh-Token', newRefreshToken);

        res.status(200).json({
            message: 'Token refreshed successfully',
            authToken: newAuthToken
        });

    } catch (error) {
        res.status(401).send({
            message: 'Invalid refresh token',
            error: error.message
        });
    }
};

module.exports = generateRefreshToken;