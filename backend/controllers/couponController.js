const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const toNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const loadOwnCoupon = async (req, res) => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: "Invalid coupon id." });
    return null;
  }
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404).json({ message: "Coupon not found." });
    return null;
  }
  if (req.user.role !== "admin" && coupon.createdBy.toString() !== req.user.id) {
    res.status(403).json({ message: "You can only manage coupons you created." });
    return null;
  }
  return coupon;
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      validFrom,
      validUntil,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(normalized)) {
      return res.status(400).json({
        message: "Code must be 3 to 20 characters using letters and numbers only.",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res
        .status(400)
        .json({ message: "Discount type must be percentage or fixed." });
    }

    const value = toNumber(discountValue);
    if (value === null || value <= 0) {
      return res
        .status(400)
        .json({ message: "Discount value must be greater than zero." });
    }
    if (discountType === "percentage" && value > 100) {
      return res
        .status(400)
        .json({ message: "A percentage discount cannot be more than 100." });
    }

    if (!validUntil) {
      return res.status(400).json({ message: "An expiry date is required." });
    }
    const until = new Date(validUntil);
    if (Number.isNaN(until.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date." });
    }
    const from = validFrom ? new Date(validFrom) : new Date();
    if (Number.isNaN(from.getTime())) {
      return res.status(400).json({ message: "Invalid start date." });
    }
    if (until <= from) {
      return res
        .status(400)
        .json({ message: "The expiry date must be after the start date." });
    }

    const existing = await Coupon.findOne({ code: normalized });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A coupon with this code already exists." });
    }

    const minOrder = toNumber(minOrderAmount, 0);
    const limit = toNumber(usageLimit);
    const perUser = toNumber(perUserLimit, 1);

    const coupon = await Coupon.create({
      code: normalized,
      description: typeof description === "string" ? description.trim() : "",
      discountType,
      discountValue: value,
      maxDiscountAmount:
        discountType === "percentage" ? toNumber(maxDiscountAmount) : null,
      minOrderAmount: minOrder !== null && minOrder >= 0 ? minOrder : 0,
      usageLimit: limit !== null && limit >= 1 ? limit : null,
      perUserLimit: perUser !== null && perUser >= 1 ? perUser : 1,
      validFrom: from,
      validUntil: until,
      createdBy: req.user.id,
      creatorRole: req.user.role,
    });

    return res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "A coupon with this code already exists." });
    }
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: firstError });
    }
    console.error("Create coupon error:", err);
    return res.status(500).json({ message: "Failed to create coupon." });
  }
};

exports.listCoupons = async (req, res) => {
  try {
    const query =
      req.user.role === "admin" ? {} : { createdBy: req.user.id };

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    return res.json({ coupons });
  } catch (err) {
    console.error("List coupons error:", err);
    return res.status(500).json({ message: "Failed to load coupons." });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await loadOwnCoupon(req, res);
    if (!coupon) return;

    const {
      description,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      validUntil,
      isActive,
    } = req.body;

    if (typeof description === "string") {
      coupon.description = description.trim();
    }

    if (discountValue !== undefined) {
      const value = toNumber(discountValue);
      if (value === null || value <= 0) {
        return res
          .status(400)
          .json({ message: "Discount value must be greater than zero." });
      }
      if (coupon.discountType === "percentage" && value > 100) {
        return res
          .status(400)
          .json({ message: "A percentage discount cannot be more than 100." });
      }
      coupon.discountValue = value;
    }

    if (maxDiscountAmount !== undefined && coupon.discountType === "percentage") {
      coupon.maxDiscountAmount = toNumber(maxDiscountAmount);
    }

    if (minOrderAmount !== undefined) {
      const minOrder = toNumber(minOrderAmount, 0);
      coupon.minOrderAmount = minOrder !== null && minOrder >= 0 ? minOrder : 0;
    }

    if (usageLimit !== undefined) {
      const limit = toNumber(usageLimit);
      if (limit !== null && limit < coupon.usedCount) {
        return res.status(400).json({
          message: `This coupon has already been used ${coupon.usedCount} times.`,
        });
      }
      coupon.usageLimit = limit !== null && limit >= 1 ? limit : null;
    }

    if (perUserLimit !== undefined) {
      const perUser = toNumber(perUserLimit, 1);
      coupon.perUserLimit = perUser !== null && perUser >= 1 ? perUser : 1;
    }

    if (validUntil !== undefined) {
      const until = new Date(validUntil);
      if (Number.isNaN(until.getTime())) {
        return res.status(400).json({ message: "Invalid expiry date." });
      }
      if (until <= coupon.validFrom) {
        return res
          .status(400)
          .json({ message: "The expiry date must be after the start date." });
      }
      coupon.validUntil = until;
    }

    if (typeof isActive === "boolean") {
      coupon.isActive = isActive;
    }

    await coupon.save();
    return res.json({ coupon });
  } catch (err) {
    console.error("Update coupon error:", err);
    return res.status(500).json({ message: "Failed to update coupon." });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await loadOwnCoupon(req, res);
    if (!coupon) return;

    await CouponRedemption.deleteMany({ coupon: coupon._id });
    await coupon.deleteOne();

    return res.json({ message: "Coupon deleted.", id: req.params.id });
  } catch (err) {
    console.error("Delete coupon error:", err);
    return res.status(500).json({ message: "Failed to delete coupon." });
  }
};

exports.listActiveCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .sort({ validUntil: 1 })
      .select(
        "code description discountType discountValue maxDiscountAmount minOrderAmount validUntil usageLimit usedCount"
      );

    const available = coupons.filter(
      (c) => !c.usageLimit || c.usedCount < c.usageLimit
    );

    return res.json({ coupons: available });
  } catch (err) {
    console.error("List active coupons error:", err);
    return res.status(500).json({ message: "Failed to load coupons." });
  }
};

const resolveCoupon = async (req, res) => {
  const { code } = req.body;
  const orderAmount = toNumber(req.body.orderAmount);

  if (!code || !code.trim()) {
    res.status(400).json({ message: "Please enter a coupon code." });
    return null;
  }
  if (orderAmount === null || orderAmount <= 0) {
    res.status(400).json({ message: "Please enter a valid order amount." });
    return null;
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) {
    res.status(404).json({ message: "This coupon code does not exist." });
    return null;
  }

  const unavailable = coupon.availabilityError(orderAmount);
  if (unavailable) {
    res.status(409).json({ message: unavailable });
    return null;
  }

  const alreadyUsed = await CouponRedemption.countDocuments({
    coupon: coupon._id,
    user: req.user.id,
  });
  if (alreadyUsed >= coupon.perUserLimit) {
    res.status(409).json({
      message: "You have already used this coupon the maximum number of times.",
    });
    return null;
  }

  return { coupon, orderAmount };
};

exports.validateCoupon = async (req, res) => {
  try {
    const resolved = await resolveCoupon(req, res);
    if (!resolved) return;

    const { coupon, orderAmount } = resolved;
    const discount = coupon.calculateDiscount(orderAmount);

    return res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      orderAmount,
      discount,
      finalAmount: Math.round((orderAmount - discount) * 100) / 100,
    });
  } catch (err) {
    console.error("Validate coupon error:", err);
    return res.status(500).json({ message: "Failed to check this coupon." });
  }
};

exports.redeemCoupon = async (req, res) => {
  try {
    const resolved = await resolveCoupon(req, res);
    if (!resolved) return;

    const { coupon, orderAmount } = resolved;
    const discount = coupon.calculateDiscount(orderAmount);

    const filter = { _id: coupon._id, isActive: true };
    if (coupon.usageLimit) {
      filter.usedCount = { $lt: coupon.usageLimit };
    }

    const claimed = await Coupon.findOneAndUpdate(
      filter,
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!claimed) {
      return res
        .status(409)
        .json({ message: "This coupon has just reached its usage limit." });
    }

    const redemption = await CouponRedemption.create({
      coupon: coupon._id,
      user: req.user.id,
      orderAmount,
      discountApplied: discount,
    });

    return res.status(201).json({
      message: `Coupon ${coupon.code} applied.`,
      redemption,
      code: coupon.code,
      orderAmount,
      discount,
      finalAmount: Math.round((orderAmount - discount) * 100) / 100,
      remaining: claimed.usageLimit ? claimed.usageLimit - claimed.usedCount : null,
    });
  } catch (err) {
    console.error("Redeem coupon error:", err);
    return res.status(500).json({ message: "Failed to apply this coupon." });
  }
};
