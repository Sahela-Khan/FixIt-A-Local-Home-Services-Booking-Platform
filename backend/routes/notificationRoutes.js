const express = require("express");
const router = express.Router();
const { auth, role } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

router.get("/", auth, notificationController.getNotifications);
router.patch("/:id/read", auth, notificationController.markAsRead);
router.patch("/read-all", auth, notificationController.markAllAsRead);
router.post("/broadcast", auth, role("admin"), notificationController.broadcast);

module.exports = router;