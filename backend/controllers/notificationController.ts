import Notification from '../models/Notification.js';


const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: { notifications, unreadCount: notifications.filter((notification) => !notification.read).length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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

export { getNotifications, markNotificationRead };