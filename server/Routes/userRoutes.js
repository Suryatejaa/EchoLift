const express = require('express');
const router = express.Router();
const UserController = require('../Controller/userController');
const authenticate = require('../Middleware/authenticate');
const validateRequest = require('../Middleware/validateRequest');
const validateLogin = require('../Middleware/validatelogin');
const ProfileController = require('../Apis/Profile.api');
// const authRoutes = require('../Middleware/refreshToken');


router.post('/register', validateRequest, UserController.register);
router.post('/login', validateLogin, UserController.login);
router.get('/me', authenticate, UserController.getUser);
router.patch('/me', validateRequest, authenticate, UserController.updateUser);
router.post('/otp/send', validateRequest, authenticate, UserController.sendOtp);
router.post('/otp/verify', UserController.verifyOtp);

router.post('/forgot-password-request', UserController.forgotPasswordRequest);
router.post('/forgot-password-verify-otp', UserController.forgotPasswordVerifyOtp);
router.post('/forgot-password-reset', UserController.forgotPasswordReset);
router.patch('/password-reset', authenticate, UserController.passwordResetUser);

router.post('/logout', authenticate, UserController.logout);

router.get('/test-auth', authenticate, (req, res) => {
    res.send(`Hello, ${req.user.name}! Authentication successful.` +
        `User Object: ${JSON.stringify(req.user)}`
    );
});


router.post('/check-username', UserController.checkUsernameAvailability);


router.put('/profile/update-profile/:id', authenticate, ProfileController.updateProfile);

module.exports = router;
