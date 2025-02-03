const express = require('express');
const router = express.Router();
const profileController = require('../Apis/Profile.api');
const authMiddleware = require('../Middleware/authenticate');
const multer = require('multer');
const authRoutes = require('../Middleware/refreshToken');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.use(authMiddleware);

// Define routes with params
router.get('/get-profile/:id', authMiddleware, profileController.getProfile);
router.post('/follow/:id',  profileController.followUser);
router.post('/unfollow/:id',  profileController.unfollowUser);
router.put('/update-profile/:id', authMiddleware, upload.single('profilePicture'), profileController.updateProfile);
router.use('/auth', authRoutes);

module.exports = router;