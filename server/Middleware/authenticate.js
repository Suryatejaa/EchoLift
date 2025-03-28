const jwt = require('jsonwebtoken');
const User = require('../Models/userSchema');
const cookieHelper = require('../utils/cookieHelper');

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token or user not found' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', error: error.message });
        }
        res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
};

module.exports = authMiddleware;
