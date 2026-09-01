const mongoose = require("mongoose");

// FR-21.5 / FR-21.6 — manual dispute / refund-request workflow (closes Feature 18 gap).
// A customer files this when the automatic time-based refund rule in bookingController.js
// doesn't apply (e.g. poor service quality, incomplete work, disputed no-show).
const refundRequestSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, required: true },
    // "customer_filed" = customer opened a dispute (poor quality, no-show, etc).
    // "auto_within_24h" = system auto-flagged this per FR-20.3 because the
    // customer cancelled within 24 hours of the scheduled job.
    source: {
      type: String,
      enum: ["customer_filed", "auto_within_24h"],
      default: "customer_filed",
    },
    // Path/URL to an uploaded proof file (photo, document). Optional.
    proofUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    // Set by admin on resolution. Independent of the automatic refundPercent
    // calculated in bookingController.calculateRefundPercent.
    adminRefundPercent: { type: Number, default: null },
    adminNote: { type: String, default: "" },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One open dispute per booking at a time.
refundRequestSchema.index(
  { bookingId: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);

refundRequestSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("RefundRequest", refundRequestSchema);
