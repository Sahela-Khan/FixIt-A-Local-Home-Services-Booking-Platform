const express = require("express");
const router = express.Router();
const providerController = require("../controllers/providerController");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("provider"));

router.post("/services", providerController.createListing);
router.get("/services", providerController.getMyListings);
router.put("/services/:id", providerController.updateListing);
router.delete("/services/:id", providerController.deleteListing);

router.put("/availability", providerController.setAvailability);
router.put("/profile", providerController.setupProfile);

router.get("/bookings/incoming", providerController.getIncomingBookings);
router.get("/bookings/schedule", providerController.getSchedule);
router.put("/bookings/:id/respond", providerController.respondToBooking);
router.put("/bookings/:id/status", providerController.updateBookingStatus);
router.put("/bookings/:id/cash-received", providerController.markCashReceived);

router.get("/earnings", providerController.getEarnings);
router.get("/bookings/history", providerController.getServiceHistory);

module.exports = router;
