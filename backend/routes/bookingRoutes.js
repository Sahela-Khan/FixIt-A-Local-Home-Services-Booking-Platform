const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { auth, role } = require("../middleware/auth");

// Customer routes
router.get("/mine", auth, role("customer"), bookingController.getMyBookings);
router.post("/", auth, role("customer"), bookingController.createBooking);
router.put("/:id/cancel", auth, role("customer"), bookingController.cancelBooking);
router.put("/:id/payment-method", auth, role("customer"), bookingController.setPaymentMethod);

// Provider routes (FR-21.2)
router.put("/:id/provider-cancel", auth, role("provider"), bookingController.providerCancelBooking);

// Shared — either party on the booking (FR-21.3)
router.put("/:id/flag-no-show", auth, bookingController.flagNoShow);

module.exports = router;
