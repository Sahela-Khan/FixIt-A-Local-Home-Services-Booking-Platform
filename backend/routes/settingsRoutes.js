const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { auth, role } = require("../middleware/auth");

// Any authenticated user can read the current partial-refund rate (used to show
// an accurate cancellation-refund hint to customers); only admins can change it.
router.get("/refund", auth, settingsController.getRefundSettings);
router.put("/refund", auth, role("admin"), settingsController.updateRefundSettings);

module.exports = router;
