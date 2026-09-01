/**
 * Seeds 100 TEST providers so you have plenty of data to click through while testing.
 *
 * - Every provider's password is: 123456
 * - Emails look like: karim.hossain1@test.com, salma.akter2@test.com, ...
 * - Each provider gets 1-3 approved service listings (so they show up in Search & Book).
 * - Each provider gets a random providerProfile.avgRating (3.5-5.0) and reviewCount (5-60)
 *   so customers can compare providers by rating right away.
 *
 *   NOTE: these ratings are written directly onto the provider's avgRating/reviewCount
 *   fields for quick testing — no real Review documents are created for them (that would
 *   require 100s of matching completed bookings + customer accounts first). If you later
 *   want the numbers to be backed by real reviews, use the "Ratings & Reviews" flow in the
 *   app itself (book -> mark Completed -> leave a review), which recalculates these same
 *   fields automatically (see models/Review.js).
 *
 * Safe to re-run: providers are matched by email, so existing ones are skipped, not duplicated.
 *
 * Run from the backend/ folder:
 *   node scripts/seedTestProviders.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Service = require("../models/Service");

const FIRST_NAMES = [
  "Karim", "Rahim", "Salma", "Nasrin", "Habib", "Faruk", "Jamal", "Kamal", "Momtaz", "Shirin",
  "Anwar", "Iqbal", "Rafiq", "Sultana", "Nasima", "Abdul", "Mizan", "Rubel", "Shakil", "Parvin",
  "Delwar", "Selina", "Manik", "Rina", "Aziz", "Farid", "Rashed", "Tania", "Liton", "Meherun",
  "Sohel", "Nasir", "Yasin", "Rupa", "Alam", "Kabir", "Jasmin", "Bashir", "Shahin", "Roksana",
];

const LAST_NAMES = [
  "Hossain", "Islam", "Ahmed", "Akter", "Rahman", "Chowdhury", "Khan", "Miah", "Begum", "Sarkar",
  "Molla", "Talukder", "Sheikh", "Bhuiyan", "Mondol",
];

const LOCATIONS = ["Dhanmondi, Dhaka", "Uttara, Dhaka", "Mirpur, Dhaka", "Gulshan, Dhaka", "Mohammadpur, Dhaka", "Banani, Dhaka"];

const SERVICE_TEMPLATES = [
  { title: "Home Cleaning", category: "Cleaning", price: 1200, estDurationMins: 120 },
  { title: "Deep Cleaning", category: "Cleaning", price: 2200, estDurationMins: 180 },
  { title: "Plumbing Repair", category: "Plumbing", price: 1500, estDurationMins: 90 },
  { title: "Pipe Installation", category: "Plumbing", price: 2500, estDurationMins: 150 },
  { title: "AC Repair Service", category: "AC Repair", price: 2500, estDurationMins: 90 },
  { title: "AC Gas Refill", category: "AC Repair", price: 1800, estDurationMins: 60 },
  { title: "Interior Painting", category: "Painting", price: 4000, estDurationMins: 240 },
  { title: "Wall Touch-up", category: "Painting", price: 1500, estDurationMins: 90 },
  { title: "Wiring Repair", category: "Electrical", price: 1800, estDurationMins: 90 },
  { title: "Electrical Fitting", category: "Electrical", price: 2000, estDurationMins: 120 },
];

const AVAILABILITY = ["online", "online", "online", "busy", "offline"]; // weighted toward online

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

const TOTAL_PROVIDERS = 100;

async function run() {
  await connectDB();

  let created = 0;
  let skipped = 0;
  let servicesCreated = 0;

  for (let i = 0; i < TOTAL_PROVIDERS; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@test.com`;
    const phone = `018${String(10000000 + i).slice(-8)}`;

    const existing = await User.findOne({ email });
    if (existing) {
      skipped++;
      continue;
    }

    const avgRating = Math.round(randomBetween(3.5, 5.0) * 10) / 10;
    const reviewCount = Math.floor(randomBetween(5, 60));

    const provider = await User.create({
      name,
      email,
      phone,
      address: pick(LOCATIONS),
      passwordHash: "123456", // hashed automatically by the User model's pre("save") hook
      role: "provider",
      providerProfile: {
        skills: [pick(SERVICE_TEMPLATES).category],
        experienceYears: Math.floor(randomBetween(1, 15)),
        serviceArea: pick(LOCATIONS),
        bio: `Experienced home service professional serving ${pick(LOCATIONS)}.`,
        availability: pick(AVAILABILITY),
        verificationStatus: "verified",
        nidNumber: `${1000000000 + i}`,
        nidPhotoUrl: "",
        avgRating,
        reviewCount,
      },
    });
    created++;

    const listingCount = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...SERVICE_TEMPLATES].sort(() => Math.random() - 0.5);
    for (let j = 0; j < listingCount; j++) {
      const tpl = shuffled[j];
      await Service.create({
        provider: provider._id,
        title: tpl.title,
        description: `${tpl.title} by ${provider.name}, serving ${provider.providerProfile.serviceArea}.`,
        category: tpl.category,
        price: tpl.price,
        estDurationMins: tpl.estDurationMins,
        approvalStatus: "approved",
        isActive: true,
      });
      servicesCreated++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Providers created: ${created}`);
  console.log(`  Providers skipped (email already existed): ${skipped}`);
  console.log(`  Service listings created: ${servicesCreated}`);
  console.log(`\nAll new providers use password: 123456`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
