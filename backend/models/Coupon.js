const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 20,
    },
    description: { type: String, trim: true, maxlength: 200 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 1 },
    maxDiscountAmount: { type: Number, min: 0, default: null },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    usageLimit: { type: Number, min: 1, default: null },
    usedCount: { type: Number, min: 0, default: 0 },
    perUserLimit: { type: Number, min: 1, default: 1 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ["admin", "provider"],
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.index({ createdBy: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = this.discountValue;
  }

  if (discount > orderAmount) discount = orderAmount;
  return Math.round(discount * 100) / 100;
};

couponSchema.methods.availabilityError = function (orderAmount) {
  const now = new Date();

  if (!this.isActive) return "This coupon is no longer active.";
  if (this.validFrom > now) return "This coupon is not valid yet.";
  if (this.validUntil < now) return "This coupon has expired.";
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return "This coupon has reached its usage limit.";
  }
  if (orderAmount < this.minOrderAmount) {
    return `This coupon needs a minimum order of ${this.minOrderAmount}.`;
  }
  return null;
};

couponSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Coupon", couponSchema);
