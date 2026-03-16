const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};
