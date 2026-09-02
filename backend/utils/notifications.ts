const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, content }) => {
  if (!userId) return null;

  return Notification.create({
    user: userId,
    type,
    content: content || {}
  });
};

const notifyUsers = async (userIds: Array<string | { toString(): string }> = [], type: string, content: Record<string, any> = {}) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
  if (uniqueUserIds.length === 0) return [];

  return Notification.insertMany(uniqueUserIds.map((userId) => ({
    user: userId,
    type,
    content
  })));
};

module.exports = {
  createNotification,
  notifyUsers
};
