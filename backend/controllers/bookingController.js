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

// --- LOYALTY FEATURE DISABLED ---
// Loyalty penalty helper (FR-21.4) — DISABLED
// async function calculateLoyaltyPenalty(customerId, wasAfterAcceptance) {
//   if (!wasAfterAcceptance) return 0;
//
//   const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
//   const recentCancelCount = await Booking.countDocuments({
//     customerId,
//     status: "Cancelled",
//     cancelledBy: "customer",
//     cancelledAt: { $gte: ninetyDaysAgo },
//   });
//   const cancelNumber = recentCancelCount + 1;
//   return Math.min(30, cancelNumber * 10);
// }

// Simplified version: always returns 0
async function calculateLoyaltyPenalty(customerId, wasAfterAcceptance) {
  return 0; // Loyalty feature disabled
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

    // --- LOYALTY FEATURE DISABLED ---
    // Loyalty points: DISABLED - always 0
    // const priorBookingCount = await Booking.countDocuments({ customerId: req.user.id });
    // const bookingNumber = priorBookingCount + 1;
    // const pointsAwarded = bookingNumber * 5;

    // Loyalty reward: DISABLED - no discount
    // const LOYALTY_REWARD_THRESHOLD = 100000;
    // const loyaltyDiscountApplied = customer.loyaltyPoints >= LOYALTY_REWARD_THRESHOLD;
    // const originalAmount = service.price;
    // const finalAmount = loyaltyDiscountApplied
    //   ? Math.round(originalAmount * 0.5)
    //   : originalAmount;

    // --- SIMPLIFIED: No loyalty, full price always ---
    const pointsAwarded = 0;
    const loyaltyDiscountApplied = false;
    const originalAmount = service.price;
    const finalAmount = service.price;

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

    // --- LOYALTY FEATURE DISABLED ---
    // Net point change: DISABLED - no points update
    // const pointsChange = pointsAwarded - (loyaltyDiscountApplied ? LOYALTY_REWARD_THRESHOLD : 0);
    // await User.findByIdAndUpdate(req.user.id, { $inc: { loyaltyPoints: pointsChange } });

    await notify(
      service.provider._id,
      `New booking request: ${service.title} on ${date} at ${time}.`,
      "booking_created"
    );
    await notify(
      req.user.id,
      // --- LOYALTY FEATURE DISABLED: Simplified notification ---
      // loyaltyDiscountApplied
      //   ? `Booking confirmed for ${service.title} — your 100,000 loyalty points unlocked 50% off (৳${originalAmount} → ৳${finalAmount}). You earned ${pointsAwarded} new points.`
      //   : `Booking confirmed for ${service.title}. You earned ${pointsAwarded} loyalty points.`,
      `Booking confirmed for ${service.title}.`,
      "booking_created"
    );

    return res.status(201).json({ message: "Booking confirmed.", booking });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Server error while creating booking." });
  }
};

// @desc  Simulate paying for a booking (mock SSLCommerz/Stripe success callback —
//        no real gateway credentials are wired up yet, this just flips paymentStatus)
// @route PUT /api/bookings/:id/pay
// @access Private (customer)
exports.payNow = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only pay for your own bookings." });
    }
    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ message: "This booking is already paid." });
    }
    if (booking.status !== "Completed") {
      return res.status(400).json({ message: "Booking not completed" });
    }
    // TODO: replace with a real SSLCommerz/Stripe session + IPN/webhook verification (Feature 12)
    booking.paymentStatus = "Paid";
    await booking.save();
    await notify(req.user.id, `Payment of ৳${booking.amount} for ${booking.service} was successful.`, "general");
    await notify(booking.providerId, `You've been paid ৳${booking.amount} for ${booking.service}.`, "general");
    return res.status(200).json({ message: "Payment successful (simulated).", booking });
  } catch (err) {
    console.error("payNow error:", err);
    return res.status(500).json({ message: "Server error while processing payment." });
  }
};

// @desc  Get all bookings for the logged-in customer
// @route GET /api/bookings/mine
// @access Private (customer)
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

    // --- LOYALTY FEATURE DISABLED ---
    // FR-21.4: penalty-free if the provider hadn't accepted yet; capped and
    // decaying (90-day window) otherwise.
    // const wasAfterAcceptance = booking.status !== "Booked";
    // const pointsPenalty = await calculateLoyaltyPenalty(req.user.id, wasAfterAcceptance);

    // --- SIMPLIFIED: No penalty ---
    const pointsPenalty = 0;

    booking.status = "Cancelled";
    booking.cancelReason = reason || "";
    booking.cancelledBy = "customer";
    booking.cancelledAt = new Date();
    booking.loyaltyPointsDeducted = pointsPenalty;

    if (outcome.kind === "auto") {
      // FR-20.1 / FR-20.2 — approve automatically, no admin step.
      booking.refundPercent = outcome.refundPercent;
      booking.paymentStatus = outcome.refundPercent > 0 ? "Refunded" : booking.paymentStatus;
    } else {
      // FR-20.3 — within 24 hours of the job: don't auto-refund. Leave
      // refundPercent unset (pending) and open a refund request the admin
      // can approve or reject from the dashboard.
      booking.refundPercent = null;
    }
    await booking.save();

    // --- LOYALTY FEATURE DISABLED ---
    // const customer = await User.findById(req.user.id);
    // const newBalance = Math.max(0, (customer.loyaltyPoints || 0) - pointsPenalty);
    // customer.loyaltyPoints = newBalance;
    // await customer.save();

    // Get customer name for notification
    const customer = await User.findById(req.user.id);

    if (outcome.kind === "auto") {
      const refundPercent = outcome.refundPercent;
      await notify(
        booking.providerId,
        `${customer?.name || 'Customer'} cancelled the ${booking.service} booking (${refundPercent}% refund).`,
        "booking_cancelled"
      );
      await notify(
        req.user.id,
        // --- LOYALTY FEATURE DISABLED: Simplified notification ---
        // `You cancelled ${booking.service}. Refund: ${refundPercent}%.${pointsPenalty > 0 ? ` ${pointsPenalty} loyalty points deducted.` : ""}`,
        `You cancelled ${booking.service}. Refund: ${refundPercent}%.`,
        "booking_cancelled"
      );

      return res.status(200).json({
        message: `Booking cancelled. Refund: ${refundPercent}%.`,
        booking,
        loyaltyPointsDeducted: 0,
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
      `You cancelled ${booking.service} within 24 hours of the job. Your refund has been flagged for admin review — you'll be notified once it's decided.`,
      "booking_cancelled"
    );

    return res.status(200).json({
      message: "Booking cancelled. This cancellation is within 24 hours of the job, so it has been flagged for admin review instead of an automatic refund.",
      booking,
      refundRequest,
      loyaltyPointsDeducted: 0,
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
    booking.paymentStatus = "Refunded";
    await booking.save();

    await notify(
      booking.customerId,
      `Your provider cancelled ${booking.service}. You've been refunded 100%.`,
      "booking_cancelled"
    );
    await notify(req.user.id, `You cancelled ${booking.service}.`, "booking_cancelled");

    // FR-20.4 — notify both parties via email as well as in-app.
    const [customer, provider] = await Promise.all([
      User.findById(booking.customerId),
      User.findById(req.user.id),
    ]);
    await sendEmail(
      customer?.email,
      `Your booking for ${booking.service} was cancelled — 100% refund issued`,
      `Hi ${customer?.name || "there"},\n\nYour provider cancelled your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. You've been refunded 100% of the amount paid.\n\n— FixIt`
    );
    await sendEmail(
      provider?.email,
      `You cancelled a booking for ${booking.service}`,
      `Hi ${provider?.name || "there"},\n\nThis confirms you cancelled the ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. The customer has been refunded 100%.\n\n— FixIt`
    );

    return res.status(200).json({ message: "Booking cancelled. Customer refunded 100%.", booking });
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
      booking.paymentStatus = "Refunded";
      await booking.save();

      await notify(booking.customerId, `No-show confirmed for ${booking.service}. Refunded 100%.`, "booking_cancelled");
      await notify(booking.providerId, `No-show confirmed for ${booking.service}.`, "booking_cancelled");

      return res.status(200).json({ message: "No-show confirmed. Booking cancelled with 100% refund.", booking });
    }

    booking.noShowFlaggedBy = flaggerRole;
    await booking.save();
    return res.status(200).json({ message: "No-show flag recorded. Awaiting confirmation.", booking });
  } catch (err) {
    console.error("flagNoShow error:", err);
    return res.status(500).json({ message: "Server error while flagging no-show." });
  }
};