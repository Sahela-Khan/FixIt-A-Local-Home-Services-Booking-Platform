const mongoose = require("mongoose");
const Dispute = require("../models/Dispute");
const User = require("../models/User");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const POPULATE = [
  { path: "customer", select: "name email role" },
  { path: "againstProvider", select: "name email role" },
  { path: "handledBy", select: "name email role" },
];

exports.listProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: "provider" })
      .select("name email")
      .sort({ name: 1 });
    return res.json({ providers });
  } catch (err) {
    console.error("List providers error:", err);
    return res.status(500).json({ message: "Failed to load providers." });
  }
};

exports.createDispute = async (req, res) => {
  try {
    const { subject, category, description, againstProvider, serviceName } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "A short subject is required." });
    }
    if (!description || description.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Please describe the problem in at least 20 characters." });
    }
    if (!Dispute.CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Please choose a valid category." });
    }

    let provider = null;
    if (againstProvider) {
      if (!isValidId(againstProvider)) {
        return res.status(400).json({ message: "Invalid provider selected." });
      }
      const found = await User.findById(againstProvider).select("role");
      if (!found || found.role !== "provider") {
        return res.status(400).json({ message: "That user is not a service provider." });
      }
      provider = found._id;
    }

    const openCount = await Dispute.countDocuments({
      customer: req.user.id,
      status: { $in: ["open", "under review"] },
    });
    if (openCount >= 5) {
      return res.status(409).json({
        message: "You already have 5 unresolved complaints. Please wait for those to be reviewed.",
      });
    }

    const dispute = await Dispute.create({
      customer: req.user.id,
      againstProvider: provider,
      serviceName: typeof serviceName === "string" ? serviceName.trim() : "",
      subject: subject.trim(),
      category,
      description: description.trim(),
    });

    const populated = await dispute.populate(POPULATE);
    return res.status(201).json({ dispute: populated });
  } catch (err) {
    if (err.name === "ValidationError") {
      const first = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: first });
    }
    console.error("Create dispute error:", err);
    return res.status(500).json({ message: "Failed to submit your complaint." });
  }
};

exports.listMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ customer: req.user.id })
      .sort({ createdAt: -1 })
      .populate(POPULATE);
    return res.json({ disputes });
  } catch (err) {
    console.error("List my disputes error:", err);
    return res.status(500).json({ message: "Failed to load your complaints." });
  }
};

exports.listAgainstMe = async (req, res) => {
  try {
    const disputes = await Dispute.find({ againstProvider: req.user.id })
      .sort({ createdAt: -1 })
      .populate(POPULATE);
    return res.json({ disputes });
  } catch (err) {
    console.error("List disputes against provider error:", err);
    return res.status(500).json({ message: "Failed to load complaints." });
  }
};

exports.disputeStats = async (req, res) => {
  try {
    const [open, underReview, resolved, rejected, total] = await Promise.all([
      Dispute.countDocuments({ status: "open" }),
      Dispute.countDocuments({ status: "under review" }),
      Dispute.countDocuments({ status: "resolved" }),
      Dispute.countDocuments({ status: "rejected" }),
      Dispute.countDocuments(),
    ]);
    return res.json({ open, underReview, resolved, rejected, total });
  } catch (err) {
    console.error("Dispute stats error:", err);
    return res.status(500).json({ message: "Failed to load complaint statistics." });
  }
};

exports.listAllDisputes = async (req, res) => {
  try {
    const { status = "", category = "", page = 1, limit = 10 } = req.query;

    const query = {};
    if (Dispute.STATUSES.includes(status)) query.status = status;
    if (Dispute.CATEGORIES.includes(category)) query.category = category;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .populate(POPULATE),
      Dispute.countDocuments(query),
    ]);

    return res.json({
      disputes,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (err) {
    console.error("List all disputes error:", err);
    return res.status(500).json({ message: "Failed to load complaints." });
  }
};

exports.getDispute = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid complaint id." });
    }
    const dispute = await Dispute.findById(req.params.id).populate(POPULATE);
    if (!dispute) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    if (req.user.role !== "admin") {
      const customerId = dispute.customer?._id || dispute.customer;
      const providerId = dispute.againstProvider?._id || dispute.againstProvider;
      const mine =
        (customerId && customerId.toString() === req.user.id) ||
        (providerId && providerId.toString() === req.user.id);
      if (!mine) {
        return res
          .status(403)
          .json({ message: "You are not part of this complaint." });
      }
    }
    return res.json({ dispute });
  } catch (err) {
    console.error("Get dispute error:", err);
    return res.status(500).json({ message: "Failed to load this complaint." });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid complaint id." });
    }

    const { status, resolution } = req.body;
    if (!["under review", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be under review, resolved or rejected.",
      });
    }
    if (
      (status === "resolved" || status === "rejected") &&
      (!resolution || !resolution.trim())
    ) {
      return res
        .status(400)
        .json({ message: "Please write a note explaining the decision." });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Complaint not found." });
    }
    if (dispute.isClosed()) {
      return res.status(409).json({
        message: `This complaint has already been ${dispute.status}.`,
      });
    }

    dispute.status = status;
    if (typeof resolution === "string") dispute.resolution = resolution.trim();
    dispute.handledBy = req.user.id;
    dispute.resolvedAt =
      status === "resolved" || status === "rejected" ? new Date() : null;

    await dispute.save();
    const populated = await dispute.populate(POPULATE);
    return res.json({ dispute: populated });
  } catch (err) {
    console.error("Resolve dispute error:", err);
    return res.status(500).json({ message: "Failed to update this complaint." });
  }
};
