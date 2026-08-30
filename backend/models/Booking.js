const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    service: { type: String, required: true },
    provider: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true },
    notes: { type: String },
    amount: { type: Number, required: true },
    originalAmount: { type: Number },
    loyaltyDiscountApplied: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Booked", "Confirmed", "En Route", "In Progress", "Completed", "Cancelled"],
      default: "Booked",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    loyaltyPointsAwarded: { type: Number, default: 0 },
    loyaltyPointsDeducted: { type: Number, default: 0 },
    refundPercent: { type: Number, default: null },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ["customer", "provider", null], default: null },
    cancelledAt: { type: Date },
    // Set automatically (see pre-save hook below) the first time status
    // moves away from "Booked" — i.e. the moment the provider accepts.
    // Used to calculate the day-based cancellation penalty.
    confirmedAt: { type: Date, default: null },
    noShowFlaggedBy: { type: String, enum: ["customer", "provider", null], default: null },
    noShowConfirmed: { type: Boolean, default: false },
    providerSavedPrompted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-stamp confirmedAt the first time the status leaves "Booked" —
// this works no matter which controller changes the status (provider
// accept flow, admin, etc.), since it's enforced at the model level.
bookingSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status !== "Booked" && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

bookingSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);