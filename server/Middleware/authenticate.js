const jwt = require('jsonwebtoken');
const User = require('../Models/userSchema');
const cookieHelper = require('../utils/cookieHelper');

const authMiddleware = async (req, res, next) => {
    const tokenFromCookie = req.cookies.authToken || cookieHelper.getCookie(req, 'authToken');
    const token = req.cookies.token
    // console.log('tokenFromCookie', token);
    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', error: error.message });
        }
        res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
};

module.exports = authMiddleware;
