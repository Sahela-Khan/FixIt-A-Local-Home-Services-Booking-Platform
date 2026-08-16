const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { auth, role } = require("../middleware/auth");

router.use(auth);

router.get("/active", role("customer"), couponController.listActiveCoupons);
router.post("/validate", role("customer"), couponController.validateCoupon);
router.post("/redeem", role("customer"), couponController.redeemCoupon);

router.get("/", role("admin", "provider"), couponController.listCoupons);
router.post("/", role("admin", "provider"), couponController.createCoupon);
router.put("/:id", role("admin", "provider"), couponController.updateCoupon);
router.delete("/:id", role("admin", "provider"), couponController.deleteCoupon);

module.exports = router;
