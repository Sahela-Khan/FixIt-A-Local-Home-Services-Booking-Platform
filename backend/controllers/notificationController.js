const Notification = require("../models/Notification");

exports.notify = async (userId, message, type = "system") => {
  try {
    return await Notification.create({ userId, message, type });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const User = require("../models/User");
    const { message } = req.body;
    const users = await User.find({}, "_id");
    const notifications = users.map((u) => ({
      userId: u._id,
      message,
      type: "system",
    }));
    await Notification.insertMany(notifications);
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};