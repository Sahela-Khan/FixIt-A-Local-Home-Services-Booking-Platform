const Service = require("../models/Service");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { notify } = require("./notificationController");
const { sendEmail } = require("./mailer");

// ---------- SERVICE LISTINGS ----------

// @desc  Create a service listing
// @route POST /api/provider/services
exports.createListing = async (req, res) => {
  try {
    const { title, description, category, price, estDurationMins } = req.body;
    if (!title || !category || price === undefined) {
      return res.status(400).json({ message: "title, category and price are required." });
    }
    const listing = await Service.create({
      provider: req.user.id,
      title,
      description,
      category,
      price,
      estDurationMins,
    });
    return res.status(201).json({ listing });
  } catch (err) {
    console.error("createListing error:", err);
    return res.status(500).json({ message: "Server error while creating listing." });
  }
};

// @desc  Get the logged-in provider's own listings
// @route GET /api/provider/services
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Service.find({ provider: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ listings });
  } catch (err) {
    console.error("getMyListings error:", err);
    return res.status(500).json({ message: "Server error while fetching listings." });
  }
};

// @desc  Update / deactivate a listing owned by the logged-in provider
// @route PUT /api/provider/services/:id
exports.updateListing = async (req, res) => {
  try {
    const listing = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    const { title, description, category, price, estDurationMins, isActive } = req.body;
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (category !== undefined) listing.category = category;
    if (price !== undefined) listing.price = price;
    if (estDurationMins !== undefined) listing.estDurationMins = estDurationMins;
    if (isActive !== undefined) listing.isActive = isActive;

    // Any edit requires a fresh admin approval — otherwise an already-approved
    // listing could be silently changed into something that was never reviewed.
    listing.approvalStatus = "pending";

    await listing.save();
    return res.status(200).json({ listing });
  } catch (err) {
    console.error("updateListing error:", err);
    return res.status(500).json({ message: "Server error while updating listing." });
  }
};

// @desc  Delete a listing owned by the logged-in provider
// @route DELETE /api/provider/services/:id
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Service.findOne({ _id: req.params.id, provider: req.user.id });
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    await listing.deleteOne();
    return res.status(200).json({ message: "Listing deleted successfully." });
  } catch (err) {
    console.error("deleteListing error:", err);
    return res.status(500).json({ message: "Server error while deleting listing." });
  }
};

// ---------- PROFILE SETUP ----------

// @desc  Set up / edit the provider's public profile
// @route PUT /api/provider/profile
exports.setupProfile = async (req, res) => {
  try {
    const { skills, experienceYears, serviceArea, bio, photoUrl, nidPhotoUrl } = req.body;
    const update = {};
    if (skills !== undefined) update["providerProfile.skills"] = Array.isArray(skills) ? skills : String(skills).split(",").map((s) => s.trim()).filter(Boolean);
    if (experienceYears !== undefined) update["providerProfile.experienceYears"] = Number(experienceYears);
    if (serviceArea !== undefined) update["providerProfile.serviceArea"] = serviceArea;
    if (bio !== undefined) update["providerProfile.bio"] = bio;
    if (photoUrl !== undefined) update["providerProfile.photoUrl"] = photoUrl;
    if (nidPhotoUrl !== undefined) update["providerProfile.nidPhotoUrl"] = nidPhotoUrl;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    return res.status(200).json({ providerProfile: user.providerProfile });
  } catch (err) {
    console.error("setupProfile error:", err);
    return res.status(500).json({ message: "Server error while updating profile." });
  }
};

// ---------- AVAILABILITY ----------

// @desc  Set provider availability: online / offline / busy
// @route PUT /api/provider/availability
exports.setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    if (!["online", "offline", "busy"].includes(availability)) {
      return res.status(400).json({ message: "availability must be online, offline, or busy." });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { "providerProfile.availability": availability },
      { new: true }
    );
    return res.status(200).json({ availability: user.providerProfile.availability });
  } catch (err) {
    console.error("setAvailability error:", err);
    return res.status(500).json({ message: "Server error while updating availability." });
  }
};

// ---------- BOOKINGS (as a provider) ----------

// @desc  Get bookings awaiting this provider's response
// @route GET /api/provider/bookings/incoming
exports.getIncomingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id, status: "Booked" })
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("getIncomingBookings error:", err);
    return res.status(500).json({ message: "Server error while fetching incoming bookings." });
  }
};

// @desc  Get this provider's upcoming (accepted, not yet completed) jobs
// @route GET /api/provider/bookings/schedule
exports.getSchedule = async (req, res) => {
  try {
    const bookings = await Booking.find({
      providerId: req.user.id,
      status: { $in: ["Confirmed", "En Route", "In Progress"] },
    })
      .populate('customerId', 'name phone')
      .sort({ date: 1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error("getSchedule error:", err);
    return res.status(500).json({ message: "Server error while fetching schedule." });
  }
};

// Fires both the in-app notification and a customer email for a booking
// update — FR-5.4 requires both channels, not just the in-app one.
const notifyCustomer = async (customerId, inAppMessage, notifyType, emailSubject, emailBody) => {
  await notify(customerId, inAppMessage, notifyType);
  try {
    const customer = await User.findById(customerId).select("email name");
    if (customer?.email) {
      await sendEmail(customer.email, emailSubject, emailBody);
    }
  } catch (err) {
    console.error("Failed to email customer about booking update:", err.message);
  }
};

// @desc  Accept or reject an incoming booking request
// @route PUT /api/provider/bookings/:id/respond
exports.respondToBooking = async (req, res) => {
  try {
    const { action } = req.body; // "accept" | "reject"
    const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "Booked") {
      return res.status(400).json({ message: "This booking has already been responded to." });
    }

    if (action === "accept") {
      booking.status = "Confirmed";
      await notifyCustomer(
        booking.customerId,
        `${booking.provider} accepted your ${booking.service} booking for ${booking.date} at ${booking.time}.`,
        "booking_status",
        `Your ${booking.service} booking was accepted`,
        `Good news! ${booking.provider} accepted your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}.\n\n— FixIt`
      );
    } else if (action === "reject") {
      booking.status = "Cancelled";
      booking.cancelledBy = "provider";
      booking.cancelledAt = new Date();
      booking.refundPercent = 100;
      booking.paymentStatus = "Refunded";
      await notifyCustomer(
        booking.customerId,
        `${booking.provider} declined your ${booking.service} booking. Full refund issued.`,
        "booking_cancelled",
        `Your ${booking.service} booking was declined`,
        `Hi,\n\n${booking.provider} declined your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. You've been refunded 100% of the amount paid.\n\n— FixIt`
      );
    } else {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'." });
    }

    await booking.save();
    return res.status(200).json({ booking });
  } catch (err) {
    console.error("respondToBooking error:", err);
    return res.status(500).json({ message: "Server error while responding to booking." });
  }
};

// @desc  Move a booking forward through its status steps, one step at a
//        time: Confirmed -> En Route -> In Progress -> Completed.
// @route PUT /api/provider/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["En Route", "In Progress", "Completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }
    const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    // FR-5.1 — enforce the fixed sequence; only the next step from the
    // booking's current status is a valid move. This also blocks jumping
    // straight to a later status from "Booked" (not yet accepted) or from
    // "Cancelled"/"Completed".
    const nextStep = {
      Confirmed: "En Route",
      "En Route": "In Progress",
      "In Progress": "Completed",
    };
    if (nextStep[booking.status] !== status) {
      return res.status(409).json({
        message: nextStep[booking.status]
          ? `This booking is at "${booking.status}" — the next allowed status is "${nextStep[booking.status]}", not "${status}".`
          : `This booking can't be advanced from its current status ("${booking.status}").`,
      });
    }

    booking.status = status;
    await booking.save();
    await notifyCustomer(
      booking.customerId,
      `Your ${booking.service} booking is now: ${status} (scheduled ${booking.date} at ${booking.time}).`,
      "booking_status",
      `Your ${booking.service} booking is now: ${status}`,
      `Hi,\n\nYour ${booking.service} booking scheduled for ${booking.date} at ${booking.time} is now: ${status}.\n\n— FixIt`
    );

    // FR-10.1 — prompt the customer to leave a rating/review now that the job is done.
    if (status === "Completed") {
      await notify(
        booking.customerId,
        `How did it go? Leave a rating and review for ${booking.service}.`,
        "review_prompt"
      );
    }

    return res.status(200).json({ booking });
  } catch (err) {
    console.error("updateBookingStatus error:", err);
    return res.status(500).json({ message: "Server error while updating booking status." });
  }
};

// @desc  Provider confirms they've received cash payment for a booking the
//        customer chose to pay in cash. There's no gateway to verify this
//        automatically, so it's a direct provider action.
// @route PUT /api/provider/bookings/:id/cash-received
exports.markCashReceived = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.paymentMethod !== "Cash") {
      return res.status(400).json({ message: "This booking isn't set to pay by cash." });
    }
    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ message: "This booking is already marked paid." });
    }

    booking.paymentStatus = "Paid";
    await booking.save();
    await notify(booking.customerId, `${booking.provider} confirmed receiving your cash payment for ${booking.service}.`, "general");

    return res.status(200).json({ booking });
  } catch (err) {
    console.error("markCashReceived error:", err);
    return res.status(500).json({ message: "Server error while confirming cash payment." });
  }
};

// @desc  Earnings summary (today / this week / this month) from completed+paid bookings
// @route GET /api/provider/earnings
exports.getEarnings = async (req, res) => {
  try {
    const completed = await Booking.find({
      providerId: req.user.id,
      status: "Completed",
      paymentStatus: "Paid",
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sum = (list) => list.reduce((s, b) => s + (b.amount || 0), 0);

    const today = completed.filter((b) => new Date(b.updatedAt) >= startOfToday);
    const week = completed.filter((b) => new Date(b.updatedAt) >= startOfWeek);
    const month = completed.filter((b) => new Date(b.updatedAt) >= startOfMonth);

    return res.status(200).json({
      today: sum(today),
      thisWeek: sum(week),
      thisMonth: sum(month),
      totalJobsCompleted: completed.length,
    });
  } catch (err) {
    console.error("getEarnings error:", err);
    return res.status(500).json({ message: "Server error while calculating earnings." });
  }
};

// @desc  Every booking this provider has ever had (for "My Service History")
// @route GET /api/provider/bookings/history
exports.getServiceHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.user.id }).sort({ createdAt: -1 });
    const totalRequests = bookings.length;
    const totalRejected = bookings.filter(
      (b) => b.status === "Cancelled" && b.cancelledBy === "provider"
    ).length;
    return res.status(200).json({ bookings, totalRequests, totalRejected });
  } catch (err) {
    console.error("getServiceHistory error:", err);
    return res.status(500).json({ message: "Server error while fetching service history." });
  }
};