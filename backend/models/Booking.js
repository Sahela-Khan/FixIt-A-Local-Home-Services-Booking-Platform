const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    service: { type: String, required: true },
    provider: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true },
    notes: { type: String },
    amount: { type: Number, required: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);