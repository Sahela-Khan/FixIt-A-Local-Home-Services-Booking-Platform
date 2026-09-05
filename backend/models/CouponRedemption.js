const mongoose = require("mongoose");

const couponRedemptionSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderAmount: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ coupon: 1, user: 1 });

couponRedemptionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("CouponRedemption", couponRedemptionSchema);
