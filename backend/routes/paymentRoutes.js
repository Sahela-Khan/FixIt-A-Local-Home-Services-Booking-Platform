const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { auth, role } = require("../middleware/auth");

// Customer-initiated — starts the SSLCommerz session.
router.post("/init/:bookingId", auth, role("customer"), paymentController.initiatePayment);

// Called directly by SSLCommerz (redirects the customer's browser, or a
// server-to-server IPN call) — these are NOT behind our own auth middleware,
// since the request comes from SSLCommerz's servers, not a logged-in user.
router.post("/success/:tranId", paymentController.paymentSuccess);
router.post("/fail/:tranId", paymentController.paymentFail);
router.post("/cancel/:tranId", paymentController.paymentCancel);
router.post("/ipn", paymentController.paymentIPN);

module.exports = router;
