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
    // The service's normal price before any loyalty discount was applied
    originalAmount: { type: Number },
    // True if this booking got the 50%-off loyalty reward (100,000+ points)
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
    // How the customer chose to pay — unset until they pick one. "Cash"
    // stays "Pending" (paymentStatus) until the provider confirms they've
    // actually received it; "Online" goes through SSLCommerz as normal.
    paymentMethod: {
      type: String,
      enum: ["Online", "Cash", null],
      default: null,
    },
    // SSLCommerz transaction id for the most recent payment attempt on this
    // booking (Feature 11). Used to validate the gateway's success/fail/
    // cancel callback and to look the booking back up from it.
    transactionId: { type: String },
    // Loyalty points awarded to the customer when this booking was placed
    loyaltyPointsAwarded: { type: Number, default: 0 },
    // Loyalty points deducted from the customer if this booking was cancelled
    loyaltyPointsDeducted: { type: Number, default: 0 },
    // What % of the amount was refunded on cancellation (0, 50, or 100)
    refundPercent: { type: Number, default: null },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ["customer", "provider", null], default: null },
    cancelledAt: { type: Date },
    // Set when one party raises a no-show claim; resolution logic lives in
    // bookingController.flagNoShow (FR-21.3)
    noShowFlaggedBy: { type: String, enum: ["customer", "provider", null], default: null },
    noShowConfirmed: { type: Boolean, default: false },
    // Whether the customer chose to save this provider after job completion
    providerSavedPrompted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);