const jwt = require('jsonwebtoken');
const User = require('../Models/userSchema');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // Problem: Token may not be set immediately after login, causing profile page API to fail.
    // Expected: Token should be stored in cookies/headers and available for API requests immediately after login.

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
        res.status(401).json({ message: 'Authentication failed', error });
    }
};

module.exports = authMiddleware;
