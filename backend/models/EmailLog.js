const mongoose = require("mongoose");

// Records emails the app "sends". There's no SMTP provider configured yet
// (that's Feature 17 — Email Notifications), so sendEmail() in
// controllers/mailer.js simulates delivery the same way payNow() simulates a
// payment gateway callback: it does the real work of composing and logging
// the email so the notify-both-parties requirement (FR-20.4) is structurally
// satisfied now, and swapping in a real provider later is a one-file change.
const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ["simulated", "sent", "failed"], default: "simulated" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailLog", emailLogSchema);
