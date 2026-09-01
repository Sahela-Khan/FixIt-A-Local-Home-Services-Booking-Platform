const crypto = require("crypto");
const SSLCommerzPayment = require("sslcommerz-lts");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { notify } = require("./notificationController");

const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
const sslcz = new SSLCommerzPayment(
  process.env.SSLCOMMERZ_STORE_ID,
  process.env.SSLCOMMERZ_STORE_PASSWORD,
  isLive
);

const backendUrl = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

// A booking becomes payable once the provider has accepted it (FR-11.2: "after
// booking confirmation and before service commencement"), and stays payable
// through to completion — the spec describes when payment is normally
// initiated, not a hard cutoff that should block a late payment.
const PAYABLE_STATUSES = ["Confirmed", "En Route", "In Progress", "Completed"];

// @desc  Start a SSLCommerz payment session for a booking (FR-11.1, FR-11.2)
// @route POST /api/payment/init/:bookingId
// @access Private (customer)
exports.initiatePayment = async (req, res) => {
  try {
    if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
      return res.status(500).json({
        message:
          "Online payment isn't configured yet — SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD are missing from the server's .env. Sign up for a free sandbox account at https://developer.sslcommerz.com/registration/ and add your credentials.",
      });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only pay for your own bookings." });
    }
    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ message: "This booking is already paid." });
    }
    if (!PAYABLE_STATUSES.includes(booking.status)) {
      return res.status(400).json({
        message:
          booking.status === "Booked"
            ? "Payment opens once the provider accepts this booking."
            : "This booking can no longer be paid for.",
      });
    }

    const customer = await User.findById(req.user.id);
    const tran_id = `FIXIT_${booking._id}_${crypto.randomBytes(4).toString("hex")}`;

    const data = {
      total_amount: booking.amount,
      currency: "BDT",
      tran_id,
      success_url: `${backendUrl}/api/payment/success/${tran_id}`,
      fail_url: `${backendUrl}/api/payment/fail/${tran_id}`,
      cancel_url: `${backendUrl}/api/payment/cancel/${tran_id}`,
      ipn_url: `${backendUrl}/api/payment/ipn`,
      shipping_method: "N/A",
      product_name: booking.service,
      product_category: "Home Service",
      product_profile: "general",
      cus_name: customer?.name || "FixIt Customer",
      cus_email: customer?.email || "customer@fixit.com",
      cus_add1: booking.address || "Dhaka",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: customer?.phone || "01700000000",
    };

    const apiResponse = await sslcz.init(data);
    if (!apiResponse?.GatewayPageURL) {
      console.error("SSLCommerz init failed:", apiResponse);
      return res.status(502).json({
        message: apiResponse?.failedreason || "Could not start the payment session with SSLCommerz. Please try again.",
      });
    }

    booking.transactionId = tran_id;
    await booking.save();

    return res.status(200).json({ GatewayPageURL: apiResponse.GatewayPageURL });
  } catch (err) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ message: "Server error while starting payment." });
  }
};

// @desc  SSLCommerz redirects the customer's browser here after a successful
//        payment. We re-validate the transaction server-to-server before
//        trusting it (never trust the redirect body alone).
// @route POST /api/payment/success/:tranId
// @access Public (called by SSLCommerz)
exports.paymentSuccess = async (req, res) => {
  try {
    const booking = await Booking.findOne({ transactionId: req.params.tranId });
    if (!booking) return res.redirect(`${clientUrl}/payment/result?status=fail&reason=unknown_transaction`);

    const val_id = req.body.val_id || req.query.val_id;
    const validation = await sslcz.validate({ val_id });

    const isValid =
      validation?.status === "VALID" || validation?.status === "VALIDATED";
    const amountMatches = Number(validation?.amount) === Number(booking.amount);

    if (!isValid || !amountMatches) {
      console.error("SSLCommerz validation failed:", validation);
      return res.redirect(`${clientUrl}/payment/result?status=fail&reason=validation_failed&bookingId=${booking._id}`);
    }

    booking.paymentStatus = "Paid";
    await booking.save();

    await notify(booking.customerId, `Payment of ৳${booking.amount} for ${booking.service} was successful.`, "general");
    await notify(booking.providerId, `You've been paid ৳${booking.amount} for ${booking.service}.`, "general");

    return res.redirect(`${clientUrl}/payment/result?status=success&bookingId=${booking._id}`);
  } catch (err) {
    console.error("paymentSuccess error:", err);
    return res.redirect(`${clientUrl}/payment/result?status=fail&reason=server_error`);
  }
};

// @desc  SSLCommerz redirects here when the payment attempt fails (FR-11.4)
// @route POST /api/payment/fail/:tranId
// @access Public (called by SSLCommerz)
exports.paymentFail = async (req, res) => {
  try {
    const booking = await Booking.findOne({ transactionId: req.params.tranId });
    if (booking) {
      await notify(
        booking.customerId,
        `Your payment for ${booking.service} failed. You can try again from your dashboard.`,
        "general"
      );
    }
    return res.redirect(
      `${clientUrl}/payment/result?status=fail&reason=gateway_declined${booking ? `&bookingId=${booking._id}` : ""}`
    );
  } catch (err) {
    console.error("paymentFail error:", err);
    return res.redirect(`${clientUrl}/payment/result?status=fail&reason=server_error`);
  }
};

// @desc  SSLCommerz redirects here if the customer cancels/backs out of the
//        payment page (FR-11.4)
// @route POST /api/payment/cancel/:tranId
// @access Public (called by SSLCommerz)
exports.paymentCancel = async (req, res) => {
  try {
    const booking = await Booking.findOne({ transactionId: req.params.tranId });
    return res.redirect(
      `${clientUrl}/payment/result?status=cancelled${booking ? `&bookingId=${booking._id}` : ""}`
    );
  } catch (err) {
    console.error("paymentCancel error:", err);
    return res.redirect(`${clientUrl}/payment/result?status=fail&reason=server_error`);
  }
};

// @desc  SSLCommerz's server-to-server Instant Payment Notification. This is
//        a backup confirmation channel in case the customer's browser never
//        makes it back to success_url (closed tab, network drop, etc.) — it
//        does not redirect anywhere, just acknowledges receipt.
// @route POST /api/payment/ipn
// @access Public (called by SSLCommerz's servers)
exports.paymentIPN = async (req, res) => {
  try {
    const tran_id = req.body.tran_id;
    const val_id = req.body.val_id;
    if (!tran_id || !val_id) return res.status(400).send("Missing tran_id/val_id");

    const booking = await Booking.findOne({ transactionId: tran_id });
    if (!booking) return res.status(404).send("Unknown transaction");
    if (booking.paymentStatus === "Paid") return res.status(200).send("Already processed");

    const validation = await sslcz.validate({ val_id });
    const isValid = validation?.status === "VALID" || validation?.status === "VALIDATED";
    const amountMatches = Number(validation?.amount) === Number(booking.amount);

    if (isValid && amountMatches) {
      booking.paymentStatus = "Paid";
      await booking.save();
      await notify(booking.customerId, `Payment of ৳${booking.amount} for ${booking.service} was successful.`, "general");
      await notify(booking.providerId, `You've been paid ৳${booking.amount} for ${booking.service}.`, "general");
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("paymentIPN error:", err);
    return res.status(500).send("Server error");
  }
};
