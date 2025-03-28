const express = require('express');
const router = express.Router();
const NotificationController = require('../Controller/notificationController');
const authMiddleware = require('../Middleware/authenticate');
const authRoutes = require('../Middleware/refreshToken');


router.use(authMiddleware);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadNotificationsCount);
router.put('/:id', NotificationController.markNotificationAsRead);
router.post('/', NotificationController.createNotification);
router.delete('/:id', NotificationController.deleteNotification);
router.get('/emit', NotificationController.emitNewNotification);
router.use('/auth', authRoutes);

module.exports = router;
