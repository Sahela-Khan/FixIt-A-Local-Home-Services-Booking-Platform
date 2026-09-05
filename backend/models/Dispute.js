const mongoose = require("mongoose");

const CATEGORIES = [
  "service quality",
  "payment",
  "provider behaviour",
  "provider did not arrive",
  "property damage",
  "other",
];

const STATUSES = ["open", "under review", "resolved", "rejected"];

const disputeSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    againstProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    serviceName: { type: String, trim: true, maxlength: 120, default: "" },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: STATUSES, default: "open" },
    resolution: { type: String, trim: true, maxlength: 2000, default: "" },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

disputeSchema.index({ customer: 1, createdAt: -1 });
disputeSchema.index({ againstProvider: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });

disputeSchema.statics.CATEGORIES = CATEGORIES;
disputeSchema.statics.STATUSES = STATUSES;

disputeSchema.methods.isClosed = function () {
  return this.status === "resolved" || this.status === "rejected";
};

disputeSchema.methods.involves = function (userId) {
  const id = userId.toString();
  if (this.customer && this.customer.toString() === id) return true;
  if (this.againstProvider && this.againstProvider.toString() === id) return true;
  return false;
};

disputeSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Dispute", disputeSchema);
