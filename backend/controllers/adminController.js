const mongoose = require("mongoose");
const User = require("../models/User");
const Service = require("../models/Service");
const { notify } = require("./notificationController");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.analytics = async (req, res) => {
  try {
    const [
      totalUsers,
      customers,
      providers,
      admins,
      totalServices,
      approvedServices,
      pendingServices,
      rejectedServices,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "provider" }),
      User.countDocuments({ role: "admin" }),
      Service.countDocuments(),
      Service.countDocuments({ approvalStatus: "approved" }),
      Service.countDocuments({ approvalStatus: "pending" }),
      Service.countDocuments({ approvalStatus: "rejected" }),
      User.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      totalUsers,
      customers,
      providers,
      admins,
      totalServices,
      approvedServices,
      pendingServices,
      rejectedServices,
      recentUsers,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return res.status(500).json({ message: "Failed to load analytics." });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 10 } = req.query;

    const query = {};
    if (search.trim()) {
      const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
      ];
    }
    if (["customer", "provider", "admin"].includes(role)) {
      query.role = role;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ message: "Failed to load users." });
  }
};

exports.getUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ message: "Failed to load user." });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    const isSelf = target._id.toString() === req.user.id;

    if (target.role === "admin" && !isSelf) {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be modified from the dashboard." });
    }

    const { name, phone, role } = req.body;

    if (typeof name === "string" && name.trim()) target.name = name.trim();
    if (typeof phone === "string" && phone.trim()) target.phone = phone.trim();

    if (role && role !== target.role) {
      if (isSelf) {
        return res
          .status(400)
          .json({ message: "You cannot change your own role." });
      }
      if (!["customer", "provider", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
      }
      target.role = role;
    }

    await target.save();
    return res.json({ user: target });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ message: "Failed to update user." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    if (target._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }
    if (target.role === "admin") {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be deleted from the dashboard." });
    }

    await Service.deleteMany({ provider: target._id });
    await target.deleteOne();

    return res.json({ message: "User deleted.", id: req.params.id });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Failed to delete user." });
  }
};

exports.listPendingServices = async (req, res) => {
  try {
    const services = await Service.find({ approvalStatus: "pending" })
      .sort({ createdAt: 1 })
      .populate("provider", "name email");
    return res.json({ services });
  } catch (err) {
    console.error("Pending services error:", err);
    return res.status(500).json({ message: "Failed to load pending services." });
  }
};

const reviewService = (decision) => async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid service id." });
    }
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found." });
    if (service.approvalStatus !== "pending") {
      return res
        .status(409)
        .json({ message: `This service has already been ${service.approvalStatus}.` });
    }
    service.approvalStatus = decision;
    await service.save();
    return res.json({ service });
  } catch (err) {
    console.error("Review service error:", err);
    return res.status(500).json({ message: "Failed to update service." });
  }
};

exports.approveService = reviewService("approved");
exports.rejectService = reviewService("rejected");

// ---------- PROVIDER VERIFICATION ----------

// @desc  Read-only list of providers who have an NID on file, for the admin
//        to view. There is no approve/reject step — uploading an NID does
//        not gate search visibility or anything else; this is for the admin
//        to be able to look at what's on file if needed.
// @route GET /api/admin/providers/nids
exports.listProviderNids = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
      "providerProfile.nidPhotoUrl": { $ne: "" },
    })
      .select("name email providerProfile.nidPhotoUrl providerProfile.suspended providerProfile.suspensionReason")
      .sort({ updatedAt: -1 });
    return res.json({ providers });
  } catch (err) {
    console.error("List provider NIDs error:", err);
    return res.status(500).json({ message: "Failed to load provider NIDs." });
  }
};

// @desc  Suspend/unsuspend a provider after the fact (e.g. their NID looks
//        fake on review). This is not a pre-approval step — providers are
//        searchable by default from signup; suspension is how an admin
//        pulls someone out of search and blocks their login once there's a
//        concrete reason to.
// @route PUT /api/admin/providers/:id/suspend
// @route PUT /api/admin/providers/:id/unsuspend
const setSuspension = (suspended) => async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid provider id." });
    }
    const provider = await User.findOne({ _id: req.params.id, role: "provider" });
    if (!provider) return res.status(404).json({ message: "Provider not found." });

    provider.providerProfile.suspended = suspended;
    provider.providerProfile.suspensionReason = suspended ? (req.body?.reason || "") : "";
    await provider.save();

    await notify(
      provider._id,
      suspended
        ? `Your provider account has been suspended by the admin.${req.body?.reason ? ` Reason: ${req.body.reason}` : ""}`
        : "Your provider account has been reinstated by the admin.",
      "general"
    );

    return res.json({ provider });
  } catch (err) {
    console.error("Set suspension error:", err);
    return res.status(500).json({ message: "Failed to update suspension status." });
  }
};

exports.suspendProvider = setSuspension(true);
exports.unsuspendProvider = setSuspension(false);
