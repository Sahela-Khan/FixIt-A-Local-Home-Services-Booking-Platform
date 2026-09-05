const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const RefundRequest = require("../models/RefundRequest");
const PlatformSettings = require("../models/PlatformSettings");
const { notify } = require("./notificationController");
const { sendEmail } = require("./mailer");

// Outcome for a customer-initiated cancellation. One of:
//  - { kind: "auto", refundPercent: 100 | <configurable %> }   -> FR-20.1 / FR-20.2
//  - { kind: "flagged" }                                        -> FR-20.3 (admin must decide)
async function resolveCancellationOutcome(booking) {
  // FR-20.1 — Provider has not accepted yet -> auto-approve a 100% refund, no admin needed.
  if (booking.status === "Booked") {
    return { kind: "auto", refundPercent: 100 };
  }

  // Provider has accepted (Confirmed / En Route / In Progress) -> check time remaining
  const jobDateTime = new Date(`${booking.date} ${booking.time}`);
  const now = new Date();
  const hoursRemaining = (jobDateTime - now) / (1000 * 60 * 60);

  // FR-20.2 — 24+ hours out -> partial refund at the admin-configured percentage.
  if (hoursRemaining >= 24) {
    const settings = await PlatformSettings.getSettings();
    return { kind: "auto", refundPercent: settings.partialRefundPercent };
  }

  // FR-20.3 — within 24 hours -> do NOT auto-refund. Flag for admin review instead.
  return { kind: "flagged" };
}

// Loyalty penalty helper (FR-21.4)
// Penalty-free if the provider hadn't accepted yet. Otherwise: escalating
// penalty based on how many times the customer has cancelled an
// already-accepted booking in the last 90 days — 10 points the 1st time,
// 20 the 2nd, 30 the 3rd and every time after (capped at 30).
async function calculateLoyaltyPenalty(customerId, wasAfterAcceptance) {
  if (!wasAfterAcceptance) return 0;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentCancelCount = await Booking.countDocuments({
    customerId,
    status: "Cancelled",
    cancelledBy: "customer",
    cancelledAt: { $gte: ninetyDaysAgo },
  });
  const cancelNumber = recentCancelCount + 1;
  return Math.min(30, cancelNumber * 10);
}

// @desc  Create a booking for the logged-in customer
// @route POST /api/bookings
// @access Private (customer)
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, date, time, address, notes } = req.body;

    if (!serviceId || !date || !time) {
      return res.status(400).json({ message: "serviceId, date and time are required." });
    }

    const service = await Service.findById(serviceId).populate("provider", "name providerProfile");
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (service.provider?.providerProfile?.availability === "busy") {
      return res.status(400).json({ message: "This provider is currently busy and cannot accept new bookings." });
    }

    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Default to the customer's registered address unless they typed a different one
    const finalAddress = (address && address.trim()) || customer.address || "";
    if (!finalAddress) {
      return res.status(400).json({
        message: "No address on file. Please provide a service address.",
      });
    }

    // Loyalty points: customer earns 5 points per booking, scaling with how
    // many bookings they've made (1st = 5, 2nd = 10, 3rd = 15, ...)
    const priorBookingCount = await Booking.countDocuments({ customerId: req.user.id });
    const bookingNumber = priorBookingCount + 1;
    const pointsAwarded = bookingNumber * 5;

    // FR-18.3: reaching 100,000 points auto-applies 50% off this booking and
    // spends 100,000 points from the balance (see the loyalty rules panel in
    // PaymentsRewardsCancellation.jsx for the customer-facing description).
    const LOYALTY_DISCOUNT_THRESHOLD = 100000;
    const LOYALTY_DISCOUNT_COST = 100000;
    const loyaltyDiscountApplied = customer.loyaltyPoints >= LOYALTY_DISCOUNT_THRESHOLD;
    const originalAmount = service.price;
    const finalAmount = loyaltyDiscountApplied ? Math.round(service.price * 0.5) : service.price;
    const pointsSpent = loyaltyDiscountApplied ? LOYALTY_DISCOUNT_COST : 0;

    const booking = await Booking.create({
      customerId: req.user.id,
      providerId: service.provider._id,
      serviceId: service._id,
      service: service.title,
      provider: service.provider.name,
      date,
      time,
      address: finalAddress,
      notes: notes || "",
      amount: finalAmount,
      originalAmount,
      loyaltyDiscountApplied,
      loyaltyPointsAwarded: pointsAwarded,
    });

    // Net change: points earned from this booking minus any points spent on
    // the auto-applied discount. pointsAwarded is always positive and
    // loyaltyDiscountApplied was only set when the balance already covered
    // the cost, so the resulting balance can never go negative here.
    await User.findByIdAndUpdate(req.user.id, { $inc: { loyaltyPoints: pointsAwarded - pointsSpent } });

    await notify(
      service.provider._id,
      `New booking request: ${service.title} on ${date} at ${time}.`,
      "booking_created"
    );
    await notify(
      req.user.id,
      loyaltyDiscountApplied
        ? `Booking confirmed for ${service.title}. Your 100,000 loyalty points unlocked 50% off (৳${originalAmount} → ৳${finalAmount}). You earned ${pointsAwarded} new points.`
        : `Booking confirmed for ${service.title}. You earned ${pointsAwarded} loyalty points.`,
      "booking_created"
    );

    const updatedCustomer = await User.findById(req.user.id);
    return res.status(201).json({
      message: "Booking confirmed.",
      booking,
      loyaltyPoints: updatedCustomer.loyaltyPoints,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Server error while creating booking." });
  }
};

// (Payment now lives in controllers/paymentController.js — the real
// SSLCommerz integration for Feature 11.)

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Server error while fetching bookings." });
  }
};

// @desc  Cancel a booking belonging to the logged-in customer
// @route PUT /api/bookings/:id/cancel
// @access Private (customer)
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own bookings." });
    }
    if (["Completed", "Cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: `This booking is already ${booking.status.toLowerCase()}.` });
    }

    const outcome = await resolveCancellationOutcome(booking);

    // FR-21.4: penalty-free if the provider hadn't accepted yet; capped and
    // decaying (90-day window) otherwise.
    const wasAfterAcceptance = booking.status !== "Booked";
    const pointsPenalty = await calculateLoyaltyPenalty(req.user.id, wasAfterAcceptance);

    booking.status = "Cancelled";
    booking.cancelReason = reason || "";
    booking.cancelledBy = "customer";
    booking.cancelledAt = new Date();
    booking.loyaltyPointsDeducted = pointsPenalty;

    const wasPaidBeforeCancel = booking.paymentStatus === "Paid";
    if (outcome.kind === "auto") {
      // FR-20.1 / FR-20.2 — approve automatically, no admin step.
      booking.refundPercent = outcome.refundPercent;
      booking.paymentStatus =
        outcome.refundPercent > 0 && wasPaidBeforeCancel ? "Refunded" : booking.paymentStatus;
    } else {
      // FR-20.3 — within 24 hours of the job: don't auto-refund. Leave
      // refundPercent unset (pending) and open a refund request the admin
      // can approve or reject from the dashboard.
      booking.refundPercent = null;
    }
    await booking.save();

    const customer = await User.findById(req.user.id);
    const newBalance = Math.max(0, (customer.loyaltyPoints || 0) - pointsPenalty);
    customer.loyaltyPoints = newBalance;
    await customer.save();

    if (outcome.kind === "auto") {
      const refundPercent = outcome.refundPercent;
      const refundLine = wasPaidBeforeCancel ? ` (${refundPercent}% refund)` : "";
      await notify(
        booking.providerId,
        `${customer?.name || 'Customer'} cancelled the ${booking.service} booking${refundLine}.`,
        "booking_cancelled"
      );
      await notify(
        req.user.id,
        `You cancelled ${booking.service}.${wasPaidBeforeCancel ? ` Refund: ${refundPercent}%.` : ""}${pointsPenalty > 0 ? ` ${pointsPenalty} loyalty points deducted.` : ""}`,
        "booking_cancelled"
      );

      return res.status(200).json({
        message: wasPaidBeforeCancel ? `Booking cancelled. Refund: ${refundPercent}%.` : "Booking cancelled.",
        booking,
        loyaltyPointsDeducted: pointsPenalty,
        loyaltyPoints: customer.loyaltyPoints,
      });
    }

    // FR-20.3 — flagged path: auto-open a refund request for the admin queue
    // instead of silently denying the refund.
    let refundRequest = null;
    try {
      refundRequest = await RefundRequest.create({
        bookingId: booking._id,
        customerId: req.user.id,
        reason: reason?.trim()
          ? `Cancelled within 24 hours of the scheduled job. Customer note: ${reason.trim()}`
          : "Cancelled within 24 hours of the scheduled job.",
        source: "auto_within_24h",
      });
    } catch (refundErr) {
      // A pending request may already exist for this booking (e.g. the
      // customer had already filed a dispute) — that's fine, don't fail
      // the cancellation itself.
      console.error("Could not auto-open refund request:", refundErr.message);
    }

    await notify(
      booking.providerId,
      `${customer?.name || 'Customer'} cancelled the ${booking.service} booking within 24 hours of the job. Refund is pending admin review.`,
      "booking_cancelled"
    );
    await notify(
      req.user.id,
      `You cancelled ${booking.service} within 24 hours of the job. Your refund has been flagged for admin review — you'll be notified once it's decided.${pointsPenalty > 0 ? ` ${pointsPenalty} loyalty points deducted.` : ""}`,
      "booking_cancelled"
    );

    return res.status(200).json({
      message: "Booking cancelled. This cancellation is within 24 hours of the job, so it has been flagged for admin review instead of an automatic refund.",
      booking,
      refundRequest,
      loyaltyPointsDeducted: pointsPenalty,
      loyaltyPoints: customer.loyaltyPoints,
    });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ message: "Server error while cancelling booking." });
  }
};

// @desc  Provider cancels a booking they previously accepted. Always a 100%
//        refund; the customer is never at fault, so no loyalty penalty applies.
// @route PUT /api/bookings/:id/provider-cancel
// @access Private (provider)
exports.providerCancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel bookings assigned to you." });
    }
    if (["Completed", "Cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: `This booking is already ${booking.status.toLowerCase()}.` });
    }

    booking.status = "Cancelled";
    booking.cancelReason = reason || "";
    booking.cancelledBy = "provider";
    booking.cancelledAt = new Date();
    booking.refundPercent = 100;
    booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : booking.paymentStatus;
    await booking.save();

    await notify(
      booking.customerId,
      booking.paymentStatus === "Refunded"
        ? `Your provider cancelled ${booking.service}. You've been refunded 100%.`
        : `Your provider cancelled ${booking.service}.`,
      "booking_cancelled"
    );
    await notify(req.user.id, `You cancelled ${booking.service}.`, "booking_cancelled");

    // FR-20.4 — notify both parties via email as well as in-app.
    const [customer, provider] = await Promise.all([
      User.findById(booking.customerId),
      User.findById(req.user.id),
    ]);
    const wasRefunded = booking.paymentStatus === "Refunded";
    await sendEmail(
      customer?.email,
      wasRefunded
        ? `Your booking for ${booking.service} was cancelled — 100% refund issued`
        : `Your booking for ${booking.service} was cancelled`,
      wasRefunded
        ? `Hi ${customer?.name || "there"},\n\nYour provider cancelled your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. You've been refunded 100% of the amount paid.\n\n— FixIt`
        : `Hi ${customer?.name || "there"},\n\nYour provider cancelled your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. No payment had been made yet, so there's nothing to refund.\n\n— FixIt`
    );
    await sendEmail(
      provider?.email,
      `You cancelled a booking for ${booking.service}`,
      wasRefunded
        ? `Hi ${provider?.name || "there"},\n\nThis confirms you cancelled the ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. The customer has been refunded 100%.\n\n— FixIt`
        : `Hi ${provider?.name || "there"},\n\nThis confirms you cancelled the ${booking.service} booking scheduled for ${booking.date} at ${booking.time}.\n\n— FixIt`
    );

    return res.status(200).json({
      message: wasRefunded ? "Booking cancelled. Customer refunded 100%." : "Booking cancelled.",
      booking,
    });
  } catch (err) {
    console.error("providerCancelBooking error:", err);
    return res.status(500).json({ message: "Server error while cancelling booking." });
  }
};

// @desc  Either party flags a booking as a no-show. Once the other party
//        confirms, it forces a 100% refund, overriding the 24h rule.
// @route PUT /api/bookings/:id/flag-no-show
// @access Private (customer or provider)
exports.flagNoShow = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const isCustomer = booking.customerId.toString() === req.user.id;
    const isProvider = booking.providerId.toString() === req.user.id;
    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: "You are not part of this booking." });
    }

    const flaggerRole = isCustomer ? "customer" : "provider";

    if (booking.noShowFlaggedBy && booking.noShowFlaggedBy !== flaggerRole) {
      booking.noShowConfirmed = true;
      booking.status = "Cancelled";
      booking.cancelledBy = flaggerRole;
      booking.cancelledAt = new Date();
      booking.refundPercent = 100;
      const wasPaid = booking.paymentStatus === "Paid";
      booking.paymentStatus = wasPaid ? "Refunded" : booking.paymentStatus;
      await booking.save();

      await notify(
        booking.customerId,
        wasPaid
          ? `No-show confirmed for ${booking.service}. Refunded 100%.`
          : `No-show confirmed for ${booking.service}.`,
        "booking_cancelled"
      );
      await notify(booking.providerId, `No-show confirmed for ${booking.service}.`, "booking_cancelled");

      return res.status(200).json({
        message: wasPaid ? "No-show confirmed. Booking cancelled with 100% refund." : "No-show confirmed. Booking cancelled.",
        booking,
      });
    }

    booking.noShowFlaggedBy = flaggerRole;
    await booking.save();
    return res.status(200).json({ message: "No-show flag recorded. Awaiting confirmation.", booking });
  } catch (err) {
    console.error("flagNoShow error:", err);
    return res.status(500).json({ message: "Server error while flagging no-show." });
  }
};

// A booking becomes payable once the provider accepts it — same window as
// online payment (paymentController.js's PAYABLE_STATUSES).
const PAYABLE_STATUSES = ["Confirmed", "En Route", "In Progress", "Completed"];

// @desc  Customer picks how they'll pay: "Online" (SSLCommerz, unchanged) or
//        "Cash" (paid to the provider in person; paymentStatus stays
//        "Pending" until the provider confirms they received it).
// @route PUT /api/bookings/:id/payment-method
// @access Private (customer)
exports.setPaymentMethod = async (req, res) => {
  try {
    const { method } = req.body;
    if (!["Online", "Cash"].includes(method)) {
      return res.status(400).json({ message: "method must be 'Online' or 'Cash'." });
    }
    const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
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

    booking.paymentMethod = method;
    await booking.save();
    return res.status(200).json({ booking });
  } catch (err) {
    console.error("setPaymentMethod error:", err);
    return res.status(500).json({ message: "Server error while setting payment method." });
  }
};
