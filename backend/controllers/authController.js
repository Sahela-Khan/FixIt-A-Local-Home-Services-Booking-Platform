const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendAuthResponse = (res, statusCode, user) => {
  const token = signToken(user);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
    },
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, address, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, phone and password are required." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const allowedRoles = ["customer", "provider"];
    const safeRole = allowedRoles.includes(role) ? role : "customer";

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      phone,
      address: address || "",
      passwordHash: password,
      role: safeRole,
    });

    return sendAuthResponse(res, 201, user);
  } catch (err) {

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: firstError });
    }
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error during registration." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return sendAuthResponse(res, 200, user);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
};

exports.logout = (req, res) => {
  return res.status(200).json({ message: "Logged out successfully." });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// @desc  Update the logged-in user's own contact details
// @route PUT /api/auth/me
// @access Private (any logged-in user)
exports.updateMe = async (req, res) => {
  try {
    const { phone, address, email } = req.body;
    const update = {};

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({ message: "Phone number cannot be empty." });
      }
      update.phone = phone.trim();
    }
    if (address !== undefined) {
      update.address = address.trim();
    }
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        return res.status(400).json({ message: "Please provide a valid email." });
      }
      const existing = await User.findOne({ email: trimmedEmail, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(409).json({ message: "This email is already in use." });
      }
      update.email = trimmedEmail;
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({ message: "Profile updated.", user });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: firstError });
    }
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Server error while updating profile." });
  }
};