const Notification = require('../Models/Notification');
const { io } = require('../app');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user._id
        }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const getUnreadNotificationsCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ userId: req.user._id, read: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createNotification = async (req, res) => {

    try {
        const userId = req.body.userId || req.user?._id;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const notification = new Notification({
            userId,
            content: req.body.content
        });
        await notification.save();
        emitNewNotification(notification,io);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const emitNewNotification = (notification,io) => {
    try {

        if (!notification) {
            console.log('Notification object is undefined or null.');
            return;
        }
        const userId = notification?.userId;
        console.log(userId);

        const userIdToString = userId.toString();
        console.log(userIdToString);

        if (!userId || !notification) {
            console.log('No user ID found in notification', notification);
            return;
        }
        console.log('Emitting notification to:', userIdToString);

        if (io && io.to) {
            io.to(userIdToString).emit('new_notification', notification);
        } else {
            console.log('Error: WebSocket io instance is not available.');
        }
    } catch (e) {
        console.log('Error in emitting notification ', e.message);

    }
};

const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = { getNotifications, markAsRead, createNotification, deleteNotification, emitNewNotification, getUnreadNotificationsCount };