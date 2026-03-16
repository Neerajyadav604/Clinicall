const Notification = require("../models/Notification");

const sendNotification = async ({ recipient, type, title, message }) => {
  if (!recipient || !type || !title || !message) return null;
  return Notification.create({ recipient, type, title, message });
};

module.exports = { sendNotification };
