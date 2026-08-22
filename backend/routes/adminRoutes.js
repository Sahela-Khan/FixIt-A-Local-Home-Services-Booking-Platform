const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

router.get("/analytics", adminController.analytics);
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUser);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.get("/services/pending", adminController.listPendingServices);
router.put("/services/:id/approve", adminController.approveService);
router.put("/services/:id/reject", adminController.rejectService);

module.exports = router;
