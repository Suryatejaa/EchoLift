const { check, validationResult } = require('express-validator');
const User = require('../Models/userSchema');
const validateLogin = [
    check('credential', 'Credential is required').notEmpty(),
  
    check('password', 'Password is required').notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = validateLogin;
