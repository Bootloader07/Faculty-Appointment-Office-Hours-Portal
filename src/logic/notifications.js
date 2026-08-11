const store = require('../data/store');

const triggerNotification = (userId, type, message) => {
  return store.create('notifications', {
    user_id: userId,
    type,
    message,
    is_read: false
  });
};

const getUnreadCount = (userId) => {
  const notifications = store.getNotificationsByUser(userId);
  return notifications.filter(n => !n.is_read).length;
};

module.exports = { triggerNotification, getUnreadCount };
