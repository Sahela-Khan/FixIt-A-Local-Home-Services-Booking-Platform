const RefundRequest = require("../models/RefundRequest");
const Booking = require("../models/Booking");
const { notify } = require("./notificationController");

// @desc  Customer files a dispute/refund request against a booking
//        (FR-21.5 — closes the Feature 18 gap: PaymentsRewardsCancellation.jsx
//        already collects reason + proofUrl on the frontend, this is the missing backend)
// @route POST /api/refund-requests
// @access Private (customer)
exports.createRefundRequest = async (req, res) => {
  try {
    const { bookingId, reason, proofUrl } = req.body;

    if (!bookingId || !reason || !reason.trim()) {
      return res.status(400).json({ message: "bookingId and reason are required." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only dispute your own bookings." });
    }

    const existingOpen = await RefundRequest.findOne({ bookingId, status: "Pending" });
    if (existingOpen) {
      return res.status(400).json({ message: "This booking already has an open refund request." });
    }

    const refundRequest = await RefundRequest.create({
      bookingId,
      customerId: req.user.id,
      reason: reason.trim(),
      proofUrl: proofUrl || "",
    });

    return res.status(201).json({ message: "Refund request submitted for review.", refundRequest });
  } catch (err) {
    console.error("createRefundRequest error:", err);
    return res.status(500).json({ message: "Server error while submitting refund request." });
  }
};

// @desc  Customer views their own refund requests
// @route GET /api/refund-requests/mine
// @access Private (customer)
exports.getMyRefundRequests = async (req, res) => {
  try {
    const requests = await RefundRequest.find({ customerId: req.user.id })
      .populate("bookingId", "service amount date status")
      .sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (err) {
    console.error("getMyRefundRequests error:", err);
    return res.status(500).json({ message: "Server error while fetching your refund requests." });
  }
};

// @desc  Admin lists refund requests (defaults to pending queue)
// @route GET /api/refund-requests?status=Pending
// @access Private (admin)
exports.getRefundRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const requests = await RefundRequest.find(filter)
      .populate("bookingId", "service amount date status paymentStatus")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (err) {
    console.error("getRefundRequests error:", err);
    return res.status(500).json({ message: "Server error while fetching refund requests." });
  }
};

// @desc  Admin approves or rejects a refund request
//        (FR-21.6). Approval sets booking.paymentStatus = "Refunded" and notifies both parties.
// @route PUT /api/refund-requests/:id/resolve
// @access Private (admin)
exports.resolveRefundRequest = async (req, res) => {
  try {
    const { decision, refundPercent, note } = req.body; // decision: "Approved" | "Rejected"

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'Approved' or 'Rejected'." });
    }
    if (decision === "Approved" && (refundPercent === undefined || refundPercent < 0 || refundPercent > 100)) {
      return res.status(400).json({ message: "refundPercent (0-100) is required when approving." });
    }

    const refundRequest = await RefundRequest.findById(req.params.id);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund request not found." });
    }
    if (refundRequest.status !== "Pending") {
      return res.status(400).json({ message: `This request has already been ${refundRequest.status.toLowerCase()}.` });
    }

    refundRequest.status = decision;
    refundRequest.adminNote = note || "";
    refundRequest.resolvedBy = req.user.id;
    refundRequest.resolvedAt = new Date();
    if (decision === "Approved") {
      refundRequest.adminRefundPercent = refundPercent;
    }
    await refundRequest.save();

    const booking = await Booking.findById(refundRequest.bookingId);
    if (booking && decision === "Approved") {
      booking.paymentStatus = "Refunded";
      booking.refundPercent = refundPercent;
      await booking.save();
    }

    if (booking) {
      await notify(
        refundRequest.customerId,
        decision === "Approved"
          ? `Your refund request for ${booking.service} was approved (${refundPercent}%).`
          : `Your refund request for ${booking.service} was rejected.${note ? ` Reason: ${note}` : ""}`,
        "general"
      );
    }

    return res.status(200).json({ message: `Refund request ${decision.toLowerCase()}.`, refundRequest });
  } catch (err) {
    console.error("resolveRefundRequest error:", err);
    return res.status(500).json({ message: "Server error while resolving refund request." });
  }
};
