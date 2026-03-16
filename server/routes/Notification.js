const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
} = require("../Controllers/Notification");

router.get("/notifications", authenticateUser, getNotifications);
router.patch("/notifications/mark-all-read", authenticateUser, markAllRead);
router.patch("/notifications/:id/mark-read", authenticateUser, markOneRead);
router.delete("/notifications/:id", authenticateUser, deleteNotification);

module.exports = router;
