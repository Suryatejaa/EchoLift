const NotificationApi = require('../Apis/Notification.api');
const NotificationController = {};

NotificationController.getNotifications = async (req, res, next) => {
    await NotificationApi.getNotifications(req, res);
}

NotificationController.markNotificationAsRead = async (req, res, next) => {
    await NotificationApi.markAsRead(req, res);
}

NotificationController.deleteNotification = async (req, res, next) => {
    await NotificationApi.deleteNotification(req, res);
}

NotificationController.createNotification = async (req, res, next) => {
    await NotificationApi.createNotification(req, res);
}

NotificationController.emitNewNotification = async (req, res, next) => {
    await NotificationApi.emitNewNotification(req, res);
}

NotificationController.getUnreadNotificationsCount = async (req, res, next) => {
    await NotificationApi.getUnreadNotificationsCount(req, res);
}

module.exports = NotificationController;

