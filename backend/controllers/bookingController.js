const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const { notify } = require("./notificationController");

// Determine refund % based on booking status and how close the job is
function calculateRefundPercent(booking) {
  if (booking.status === "Booked") return 100;

  const jobDateTime = new Date(`${booking.date} ${booking.time}`);
  const now = new Date();
  const hoursRemaining = (jobDateTime - now) / (1000 * 60 * 60);

  if (hoursRemaining >= 24) return 50;
  return 0;
}

// Loyalty penalty rule:
// - If the provider hadn't confirmed yet (status still "Booked") -> no penalty at all.
// - If the provider had confirmed -> penalty = 3 points per day that passed
//   since confirmation, up to the moment of cancellation.
function calculateLoyaltyPenalty(booking) {
  const wasAfterConfirmation = booking.status !== "Booked" && booking.confirmedAt;
  if (!wasAfterConfirmation) return 0;

  const now = new Date();
  const msSinceConfirm = now - new Date(booking.confirmedAt);
  const daysSinceConfirm = Math.max(1, Math.ceil(msSinceConfirm / (1000 * 60 * 60 * 24)));

  return daysSinceConfirm * 3;
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

    const refundPercent = calculateRefundPercent(booking);
    const pointsPenalty = calculateLoyaltyPenalty(booking);

    booking.status = "Cancelled";
    booking.cancelReason = reason || "";
    booking.cancelledBy = "customer";
    booking.cancelledAt = new Date();
    booking.refundPercent = refundPercent;
    booking.loyaltyPointsDeducted = pointsPenalty;
    booking.paymentStatus = refundPercent > 0 ? "Refunded" : booking.paymentStatus;
    await booking.save();

    const customer = await User.findById(req.user.id);
    const newBalance = Math.max(0, (customer.loyaltyPoints || 0) - pointsPenalty);
    customer.loyaltyPoints = newBalance;
    await customer.save();

    await notify(
      booking.providerId,
      `${customer?.name || 'Customer'} cancelled the ${booking.service} booking (${refundPercent}% refund).`,
      "booking_cancelled"
    );
    await notify(
      req.user.id,
      `You cancelled ${booking.service}. Refund: ${refundPercent}%.${pointsPenalty > 0 ? ` ${pointsPenalty} loyalty points deducted.` : ""}`,
      "booking_cancelled"
    );

    return res.status(200).json({
      message: `Booking cancelled. Refund: ${refundPercent}%.`,
      booking,
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
    booking.paymentStatus = "Refunded";
    await booking.save();

    await notify(
      booking.customerId,
      `Your provider cancelled ${booking.service}. You've been refunded 100%.`,
      "booking_cancelled"
    );
    await notify(req.user.id, `You cancelled ${booking.service}.`, "booking_cancelled");

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