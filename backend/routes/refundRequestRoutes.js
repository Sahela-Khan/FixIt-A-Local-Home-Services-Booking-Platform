const express = require("express");
const router = express.Router();
const refundRequestController = require("../controllers/refundRequestController");
const { auth, role } = require("../middleware/auth");

router.post("/", auth, role("customer"), refundRequestController.createRefundRequest);
router.get("/mine", auth, role("customer"), refundRequestController.getMyRefundRequests);

router.get("/", auth, role("admin"), refundRequestController.getRefundRequests);
router.put("/:id/resolve", auth, role("admin"), refundRequestController.resolveRefundRequest);

module.exports = router;
