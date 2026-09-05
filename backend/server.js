require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const providerRoutes = require("./routes/providerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/categories", categoryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      message: "That upload is too large. Please use a smaller photo (under 2MB).",
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request body." });
  }
  res.status(500).json({ message: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`FixIt API running on http://localhost:${PORT}`));
});