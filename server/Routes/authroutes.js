const AuthController = require('../controllers/authcontroller');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/auth');


router.post('/refresh-token', authMiddleware, AuthController.getNewAccessToken);

module.exports = router;