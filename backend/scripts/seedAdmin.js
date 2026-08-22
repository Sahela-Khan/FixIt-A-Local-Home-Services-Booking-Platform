

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || "admin@fixit.com").toLowerCase();
    const name = process.env.ADMIN_NAME || "FixIt Admin";
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.error("Set ADMIN_PASSWORD in .env before seeding.");
      process.exit(1);
    }

    let admin = await User.findOne({ email });
    if (admin) {
      console.log("Admin already exists:", email);
    } else {
      admin = await User.create({
        name,
        email,
        phone: "0000000000",
        passwordHash: password,
        role: "admin",
      });
      console.log("Admin created:", email);
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
