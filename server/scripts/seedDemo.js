require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Service = require("../models/Service");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let provider = await User.findOne({ email: "demo.provider@fixit.com" });
    if (!provider) {
      provider = await User.create({
        name: "Demo Provider",
        email: "demo.provider@fixit.com",
        phone: "01700000000",
        passwordHash: "demo123456",
        role: "provider",
      });
      console.log("Demo provider created (demo.provider@fixit.com / demo123456)");
    } else {
      console.log("Demo provider already exists.");
    }

    const existing = await Service.countDocuments({ provider: provider._id });
    if (existing === 0) {
      await Service.create([
        {
          provider: provider._id,
          title: "AC Servicing (1 Ton)",
          category: "AC Repair",
          price: 1200,
          estDurationMins: 60,
          description: "Full split AC cleaning with gas pressure check.",
        },
        {
          provider: provider._id,
          title: "Ceiling Fan Installation",
          category: "Electrician",
          price: 400,
          estDurationMins: 45,
          description: "Install and test one ceiling fan, wiring included.",
        },
        {
          provider: provider._id,
          title: "Full Home Deep Clean",
          category: "Cleaning",
          price: 3500,
          estDurationMins: 240,
          description: "Two-person team, all rooms, kitchen and bathrooms.",
        },
      ]);
      console.log("3 pending demo services created.");
    } else {
      console.log("Demo services already exist.");
    }
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
