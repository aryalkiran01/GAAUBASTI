export {};
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: { notification } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, data: { modifiedCount: result.modifiedCount || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead
};
