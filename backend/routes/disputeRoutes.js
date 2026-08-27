const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/disputeController");
const { auth, role } = require("../middleware/auth");

router.use(auth);

router.get("/providers", role("customer"), disputeController.listProviders);
router.get("/mine", role("customer"), disputeController.listMyDisputes);
router.get("/against-me", role("provider"), disputeController.listAgainstMe);
router.get("/stats", role("admin"), disputeController.disputeStats);

router.post("/", role("customer"), disputeController.createDispute);
router.get("/", role("admin"), disputeController.listAllDisputes);

router.get("/:id", role("customer", "provider", "admin"), disputeController.getDispute);
router.put("/:id/resolve", role("admin"), disputeController.resolveDispute);

module.exports = router;
