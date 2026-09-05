const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.warn("Email configuration missing – email sending disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

async function sendInvoiceEmail(to, subject, text, pdfBuffer) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Email service not configured. Skipping email send.");
    return;
  }

  const from = process.env.EMAIL_FROM || "noreply@fixit.com";

  const mailOptions = {
    from,
    to,
    subject,
    text,
    attachments: [
      {
        filename: `invoice-${Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send invoice email:", err.message);
    throw err;
  }
}

async function sendEmail({ to, subject, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Email service not configured. Skipping email send.");
    return;
  }

  const from = process.env.EMAIL_FROM || "noreply@fixit.com";

  const mailOptions = { from, to, subject, text };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send email:", err.message);
    throw err;
  }
}

module.exports = { sendEmail, sendInvoiceEmail };