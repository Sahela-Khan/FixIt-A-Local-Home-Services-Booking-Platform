const EmailLog = require("../models/EmailLog");

// Sends an email. No SMTP provider is configured in this project yet
// (Feature 17), so this simulates delivery: it logs the email to the
// console and records it in EmailLog, the same way payNow() simulates a
// payment gateway. Swap the body of this function for a real
// nodemailer/SES/SendGrid call once Feature 17 wires up real credentials —
// every caller (like the refund flow below) stays the same.
exports.sendEmail = async (to, subject, body) => {
  try {
    if (!to) return null;
    console.log(`[simulated email] To: ${to} | Subject: ${subject}`);
    return await EmailLog.create({ to, subject, body, status: "simulated" });
  } catch (err) {
    console.error("Failed to log simulated email:", err.message);
    return null;
  }
};
