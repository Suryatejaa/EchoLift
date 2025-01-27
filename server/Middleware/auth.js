const jwt = require('jsonwebtoken');
const User = require('../Models/userSchema');
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        next();
    } catch (error) {
        res.status(401).send({ message: 'Authentication failed' });
    }
};
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        next();
    };
};
module.exports = { authenticate, authorizeRoles };
