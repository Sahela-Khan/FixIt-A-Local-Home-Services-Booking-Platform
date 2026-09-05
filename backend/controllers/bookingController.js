const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const { notify } = require("./notificationController");
const { generateInvoiceBuffer } = require("../utils/invoiceGenerator");
const { sendInvoiceEmail } = require("../services/emailService");

function calculateRefundPercent(booking) {
  if (booking.status === "Booked") return 100;
  const jobDateTime = new Date(`${booking.date} ${booking.time}`);
  const now = new Date();
  const hoursRemaining = (jobDateTime - now) / (1000 * 60 * 60);
  if (hoursRemaining >= 24) return 50;
  return 0;
}

function generateInvoiceNumber() {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${random}`;
}

async function generateInvoiceForBooking(booking) {
  try {
    // If invoice already generated, skip
    if (booking.invoiceGeneratedAt) {
      console.log(`Invoice already generated for booking ${booking._id}`);
      return;
    }

    // Generate invoice number and save immediately (even if email fails)
    const invoiceNumber = generateInvoiceNumber();
    booking.invoiceNumber = invoiceNumber;
    booking.invoiceGeneratedAt = new Date();
    booking.invoiceStatus = "generated";
    await booking.save(); // persist invoice data before attempting email

    // Fetch related data
    const customer = await User.findById(booking.customerId);
    const provider = await User.findById(booking.providerId);
    const service = await Service.findById(booking.serviceId);

    if (!customer || !provider) {
      throw new Error("Missing customer or provider data for invoice");
    }

    // Generate PDF
    const pdfBuffer = await generateInvoiceBuffer(booking, customer, provider, service);

    // Send email with attachment
    const subject = `Invoice ${invoiceNumber} for ${booking.service}`;
    const text = `Dear ${customer.name},\n\nThank you for your booking. Please find your invoice attached.\n\nInvoice: ${invoiceNumber}\nService: ${booking.service}\nAmount: ৳${booking.amount}\n\nFixIt Team`;
    await sendInvoiceEmail(customer.email, subject, text, pdfBuffer);

    console.log(`Invoice ${invoiceNumber} generated and emailed for booking ${booking._id}`);
  } catch (err) {
    console.error("Error generating invoice:", err.message);
    // Do not re‑throw – we do not want to fail the payment operation
  }
}

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

    const priorBookingCount = await Booking.countDocuments({ customerId: req.user.id });
    const bookingNumber = priorBookingCount + 1;
    const pointsAwarded = bookingNumber * 5;

    const LOYALTY_REWARD_THRESHOLD = 100000;
    const loyaltyDiscountApplied = customer.loyaltyPoints >= LOYALTY_REWARD_THRESHOLD;
    const originalAmount = service.price;
    const finalAmount = loyaltyDiscountApplied
      ? Math.round(originalAmount * 0.5)
      : originalAmount;

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

    const pointsChange = pointsAwarded - (loyaltyDiscountApplied ? LOYALTY_REWARD_THRESHOLD : 0);
    await User.findByIdAndUpdate(req.user.id, { $inc: { loyaltyPoints: pointsChange } });

    await notify(
      service.provider._id,
      `New booking request: ${service.title} on ${date} at ${time}.`,
      "booking_created",
      { email: true, emailSubject: "New Booking Request" }
    );
    await notify(
      req.user.id,
      loyaltyDiscountApplied
        ? `Booking confirmed for ${service.title} — your 100,000 loyalty points unlocked 50% off (৳${originalAmount} → ৳${finalAmount}). You earned ${pointsAwarded} new points.`
        : `Booking confirmed for ${service.title}. You earned ${pointsAwarded} loyalty points.`,
      "booking_created",
      { email: true, emailSubject: "Booking Confirmed" }
    );

    return res.status(201).json({ message: "Booking confirmed.", booking });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Server error while creating booking." });
  }
};

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

    // Mark as paid
    booking.paymentStatus = "Paid";
    booking.paidAt = new Date();
    booking.paymentMethod = "Online Payment";

    await booking.save();

    // Generate invoice (fire‑and‑forget – errors are logged but do not fail the payment)
    generateInvoiceForBooking(booking).catch(err =>
      console.error("Background invoice generation failed:", err)
    );

    // Send payment notifications (with email)
    await notify(req.user.id, `Payment of ৳${booking.amount} for ${booking.service} was successful.`, "general", { email: true, emailSubject: "Payment Receipt" });
    await notify(booking.providerId, `You've been paid ৳${booking.amount} for ${booking.service}.`, "general", { email: true, emailSubject: "Payment Received" });

    return res.status(200).json({ message: "Payment successful (simulated).", booking });
  } catch (err) {
    console.error("payNow error:", err);
    return res.status(500).json({ message: "Server error while processing payment." });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Server error while fetching bookings." });
  }
};

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

    const priorCancelCount = await Booking.countDocuments({
      customerId: req.user.id,
      status: "Cancelled",
    });
    const cancelNumber = priorCancelCount + 1;
    const pointsPenalty = cancelNumber * 10;

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
      `${customer.name} cancelled the ${booking.service} booking (${refundPercent}% refund).`,
      "booking_cancelled",
      { email: true, emailSubject: "Booking Cancelled" }
    );
    await notify(
      req.user.id,
      `You cancelled ${booking.service}. Refund: ${refundPercent}%. ${pointsPenalty} loyalty points deducted.`,
      "booking_cancelled",
      { email: true, emailSubject: "Booking Cancelled" }
    );

    return res.status(200).json({
      message: `Booking cancelled. Refund: ${refundPercent}%.`,
      booking,
      loyaltyPointsDeducted: pointsPenalty,
    });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ message: "Server error while cancelling booking." });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (booking.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Invoice only available for paid bookings." });
    }

    const customer = await User.findById(booking.customerId);
    const provider = await User.findById(booking.providerId);
    const service = await Service.findById(booking.serviceId);

    if (!customer || !provider) {
      return res.status(500).json({ message: "Missing customer or provider data." });
    }

    const pdfBuffer = await generateInvoiceBuffer(booking, customer, provider, service);

    const filename = `invoice-${booking.invoiceNumber || booking._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("getInvoice error:", err);
    return res.status(500).json({ message: "Failed to generate invoice." });
  }
};