/**
 * PART 1 — Curated showcase setup: 5 hand-picked providers with realistic
 * profiles, their services, 3 demo customers (Tahan, Nusrat, Tanvir) with
 * hand-crafted bookings (paid/unpaid/cancelled-at-different-refund-tiers)
 * and refund requests (pending/approved/rejected) — everything needed to
 * demo the core flows end-to-end with a small, understandable dataset.
 *
 * PART 2 — 100 additional RANDOM test providers (password: 123456, emails
 * like karim.hossain1@test.com) purely so a customer browsing Search &
 * Filter sees plenty of providers/services/ratings to sift through. These
 * don't interact with the curated Part 1 data at all — different email
 * domain (@test.com vs @fixit.test), so there's no collision.
 *
 * Safe to re-run: everything is matched by email/title first, so existing
 * records are skipped, not duplicated.
 *
 * Run from the backend/ folder:
 *   node scripts/seedShowcase.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const RefundRequest = require("../models/RefundRequest");

// Demo password for every curated (Part 1) account (bcrypt-hashed by the
// User model's pre-save hook, same as seedDemo.js).
const DEMO_PASSWORD = "demo123456";

// Password for the 100 random bulk-test providers (Part 2).
const BULK_PASSWORD = "123456";

async function upsertUser(data) {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = await User.create({ ...data, passwordHash: DEMO_PASSWORD });
    console.log(`Created ${data.role}: ${data.email}`);
  } else {
    console.log(`Already exists: ${data.email}`);
  }
  return user;
}

async function upsertService(data) {
  let service = await Service.findOne({ provider: data.provider, title: data.title });
  if (!service) {
    service = await Service.create(data);
    console.log(`Created service: ${data.title}`);
  }
  return service;
}

// ---------- Data pools for Part 2's 100 random bulk-test providers ----------
const BULK_FIRST_NAMES = [
  "Karim", "Rahim", "Salma", "Nasrin", "Habib", "Faruk", "Jamal", "Kamal", "Momtaz", "Shirin",
  "Anwar", "Iqbal", "Rafiq", "Sultana", "Nasima", "Abdul", "Mizan", "Rubel", "Shakil", "Parvin",
  "Delwar", "Selina", "Manik", "Rina", "Aziz", "Farid", "Rashed", "Tania", "Liton", "Meherun",
  "Sohel", "Nasir", "Yasin", "Rupa", "Alam", "Kabir", "Jasmin", "Bashir", "Shahin", "Roksana",
];
const BULK_LAST_NAMES = [
  "Hossain", "Islam", "Ahmed", "Akter", "Rahman", "Chowdhury", "Khan", "Miah", "Begum", "Sarkar",
  "Molla", "Talukder", "Sheikh", "Bhuiyan", "Mondol",
];
const BULK_LOCATIONS = ["Dhanmondi, Dhaka", "Uttara, Dhaka", "Mirpur, Dhaka", "Gulshan, Dhaka", "Mohammadpur, Dhaka", "Banani, Dhaka"];
const BULK_SERVICE_TEMPLATES = [
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
const BULK_AVAILABILITY = ["online", "online", "online", "busy", "offline"]; // weighted toward online
const BULK_TOTAL_PROVIDERS = 100;

function bulkPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function bulkRandomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // ================================================================
    // PART 1 — curated showcase providers, services, customers, bookings
    // ================================================================

    // ---------- Providers ----------
    const karim = await upsertUser({
      name: "Karim Hossain",
      email: "karim.provider@fixit.test",
      phone: "01711000001",
      role: "provider",
      address: "",
      providerProfile: {
        skills: ["Painting"],
        experienceYears: 5,
        serviceArea: "Dhanmondi, Dhaka",
        bio: "Wall touch-up and full painting jobs.",
        availability: "online",
        verificationStatus: "verified",
        avgRating: 4.0,
        reviewCount: 2,
      },
    });

    const habibur = await upsertUser({
      name: "Habibur Rahman",
      email: "habibur.provider@fixit.test",
      phone: "01711000002",
      role: "provider",
      address: "",
      providerProfile: {
        skills: ["Plumbing"],
        experienceYears: 7,
        serviceArea: "Uttara, Dhaka",
        bio: "Pipe installation and repair specialist.",
        availability: "online",
        verificationStatus: "verified",
        avgRating: 4.2,
        reviewCount: 5,
      },
    });

    const salma = await upsertUser({
      name: "Salma Akter",
      email: "salma.provider@fixit.test",
      phone: "01711000003",
      role: "provider",
      address: "",
      providerProfile: {
        skills: ["Plumbing", "Cleaning"],
        experienceYears: 4,
        serviceArea: "Mirpur, Dhaka",
        bio: "Deep cleaning and pipe work.",
        availability: "busy",
        verificationStatus: "verified",
        avgRating: 3.8,
        reviewCount: 3,
      },
    });

    const rafiqul = await upsertUser({
      name: "Rafiqul Islam",
      email: "rafiqul.provider@fixit.test",
      phone: "01711000004",
      role: "provider",
      address: "",
      providerProfile: {
        skills: ["Cleaning", "AC Repair"],
        experienceYears: 6,
        serviceArea: "Mohammadpur, Dhaka",
        bio: "Home cleaning and AC gas refill.",
        availability: "online",
        verificationStatus: "verified",
        avgRating: 4.5,
        reviewCount: 8,
      },
    });

    const mizanur = await upsertUser({
      name: "Mizanur Khan",
      email: "mizanur.provider@fixit.test",
      phone: "01711000005",
      role: "provider",
      address: "",
      providerProfile: {
        skills: ["AC Repair"],
        experienceYears: 8,
        serviceArea: "Uttara, Dhaka",
        bio: "AC servicing and gas refill specialist.",
        availability: "online",
        verificationStatus: "verified",
        avgRating: 4.9,
        reviewCount: 21,
      },
    });

    // ---------- Services ----------
    const wallTouchUp = await upsertService({
      provider: karim._id, title: "Wall Touch-up", category: "Painting",
      price: 1500, estDurationMins: 90, approvalStatus: "approved",
      description: "Touch-up painting for scuffed or damaged walls.",
    });
    const pipeInstall = await upsertService({
      provider: habibur._id, title: "Pipe Installation", category: "Plumbing",
      price: 2500, estDurationMins: 120, approvalStatus: "approved",
      description: "New pipe installation and leak fixing.",
    });
    const deepCleanSalma = await upsertService({
      provider: salma._id, title: "Deep Cleaning", category: "Cleaning",
      price: 2200, estDurationMins: 180, approvalStatus: "approved",
      description: "Full apartment deep clean, two-person team.",
    });
    const deepCleanRafiqul = await upsertService({
      provider: rafiqul._id, title: "Home Cleaning", category: "Cleaning",
      price: 1200, estDurationMins: 120, approvalStatus: "approved",
      description: "Standard home cleaning service.",
    });
    const acGasRefillRafiqul = await upsertService({
      provider: rafiqul._id, title: "AC Gas Refill", category: "AC Repair",
      price: 1800, estDurationMins: 60, approvalStatus: "approved",
      description: "AC gas refill and cooling check.",
    });
    const acGasRefillMizanur = await upsertService({
      provider: mizanur._id, title: "AC Gas Refill", category: "AC Repair",
      price: 1800, estDurationMins: 60, approvalStatus: "approved",
      description: "AC servicing and gas refill, 8 years experience.",
    });

    // ---------- Customers ----------
    const tahan = await upsertUser({
      name: "Tahan",
      email: "tahan@wmail.com",
      phone: "01611000001",
      role: "customer",
      address: "House 10, Road 2, Dhanmondi, Dhaka",
      loyaltyPoints: 20,
    });

    const nusrat = await upsertUser({
      name: "Nusrat Jahan",
      email: "nusrat@wmail.com",
      phone: "01611000002",
      role: "customer",
      address: "House 24, Road 7, Dhanmondi, Dhaka",
      loyaltyPoints: 15,
    });

    const tanvir = await upsertUser({
      name: "Tanvir Ahmed",
      email: "tanvir@wmail.com",
      phone: "01611000003",
      role: "customer",
      address: "Block C, Mirpur 10, Dhaka",
      loyaltyPoints: 45,
    });

    // ---------- Bookings (only seed once per customer) ----------
    const seedBookingsFor = async (customer, bookings) => {
      const already = await Booking.countDocuments({ customerId: customer._id });
      if (already > 0) {
        console.log(`${customer.name} already has bookings — skipping.`);
        return;
      }
      await Booking.create(bookings.map((b) => ({ ...b, customerId: customer._id })));
      console.log(`Created ${bookings.length} bookings for ${customer.name}`);
    };

    // Tahan: a paid completed job, an unpaid completed job (so "Pay now"
    // shows), a customer-cancelled job with a 50% refund, and an upcoming
    // booked-but-not-yet-accepted job.
    await seedBookingsFor(tahan, [
      {
        providerId: mizanur._id, serviceId: acGasRefillMizanur._id,
        service: "AC Gas Refill", provider: "Mizanur Khan",
        date: "2026-08-12", time: "1:00 PM", address: tahan.address,
        amount: 1800, status: "Completed", paymentStatus: "Paid",
        loyaltyPointsAwarded: 5,
      },
      {
        providerId: karim._id, serviceId: wallTouchUp._id,
        service: "Wall Touch-up", provider: "Karim Hossain",
        date: "2026-08-19", time: "11:00 AM", address: tahan.address,
        amount: 1500, status: "Completed", paymentStatus: "Pending",
        loyaltyPointsAwarded: 10,
      },
      {
        providerId: habibur._id, serviceId: pipeInstall._id,
        service: "Pipe Installation", provider: "Habibur Rahman",
        date: "2026-08-05", time: "10:00 AM", address: tahan.address,
        amount: 2500, status: "Cancelled", paymentStatus: "Refunded",
        cancelReason: "Found a cheaper local plumber.",
        cancelledBy: "customer", cancelledAt: new Date(),
        refundPercent: 50, loyaltyPointsAwarded: 15, loyaltyPointsDeducted: 6,
      },
      {
        providerId: rafiqul._id, serviceId: deepCleanRafiqul._id,
        service: "Home Cleaning", provider: "Rafiqul Islam",
        date: "2026-09-10", time: "3:00 PM", address: tahan.address,
        amount: 1200, status: "Booked", paymentStatus: "Pending",
        loyaltyPointsAwarded: 20,
      },
    ]);

    // Nusrat: a paid completed job and a within-24h cancellation with no refund.
    await seedBookingsFor(nusrat, [
      {
        providerId: rafiqul._id, serviceId: acGasRefillRafiqul._id,
        service: "AC Gas Refill", provider: "Rafiqul Islam",
        date: "2026-08-04", time: "10:00 AM", address: nusrat.address,
        amount: 1800, status: "Completed", paymentStatus: "Paid",
        loyaltyPointsAwarded: 5,
      },
      {
        providerId: salma._id, serviceId: deepCleanSalma._id,
        service: "Deep Cleaning", provider: "Salma Akter",
        date: "2026-08-13", time: "1:00 PM", address: nusrat.address,
        amount: 2200, status: "Cancelled", paymentStatus: "Pending",
        cancelReason: "No-show, cancelled last minute.",
        cancelledBy: "customer", cancelledAt: new Date(),
        refundPercent: 0, loyaltyPointsAwarded: 10, loyaltyPointsDeducted: 3,
      },
    ]);

    // Tanvir: two paid completed jobs, one of which he's disputing.
    const [tanvirBooking1, tanvirBooking2] = await (async () => {
      const already = await Booking.countDocuments({ customerId: tanvir._id });
      if (already > 0) {
        console.log("Tanvir already has bookings — skipping booking + refund-request seed.");
        return [null, null];
      }
      const created = await Booking.create([
        {
          customerId: tanvir._id, providerId: mizanur._id, serviceId: acGasRefillMizanur._id,
          service: "AC Gas Refill", provider: "Mizanur Khan",
          date: "2026-08-14", time: "9:00 AM", address: tanvir.address,
          amount: 1800, status: "Completed", paymentStatus: "Paid",
          loyaltyPointsAwarded: 5,
        },
        {
          customerId: tanvir._id, providerId: habibur._id, serviceId: pipeInstall._id,
          service: "Pipe Installation", provider: "Habibur Rahman",
          date: "2026-08-10", time: "3:00 PM", address: tanvir.address,
          amount: 2500, status: "Completed", paymentStatus: "Paid",
          loyaltyPointsAwarded: 10,
        },
      ]);
      console.log("Created 2 bookings for Tanvir Ahmed");
      return created;
    })();

    // Refund requests: one pending, one already approved, one already
    // rejected — so the admin queue and the customer's "my requests" list
    // both have something to show.
    if (tanvirBooking1) {
      await RefundRequest.create([
        {
          bookingId: tanvirBooking1._id, customerId: tanvir._id,
          reason: "AC still not cooling properly after the service.",
          status: "Pending",
        },
        {
          bookingId: tanvirBooking2._id, customerId: tanvir._id,
          reason: "Plumber left the work area messy and didn't fix the leak fully.",
          status: "Approved", adminRefundPercent: 40,
          adminNote: "Partial refund approved after reviewing photos.",
          resolvedAt: new Date(),
        },
      ]);
      console.log("Created 2 refund requests for Tanvir Ahmed (1 pending, 1 approved)");
    }

    console.log("\nDone with Part 1 (curated showcase). Login for these accounts: password = " + DEMO_PASSWORD);

    // ================================================================
    // PART 2 — 100 random bulk-test providers, password: 123456
    // (purely so Search & Filter has plenty of providers to browse)
    // ================================================================

    let bulkCreated = 0;
    let bulkSkipped = 0;
    let bulkServicesCreated = 0;

    for (let i = 0; i < BULK_TOTAL_PROVIDERS; i++) {
      const first = BULK_FIRST_NAMES[i % BULK_FIRST_NAMES.length];
      const last = BULK_LAST_NAMES[Math.floor(i / BULK_FIRST_NAMES.length) % BULK_LAST_NAMES.length];
      const bulkName = `${first} ${last}`;
      const bulkEmail = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@test.com`;
      const bulkPhone = `018${String(10000000 + i).slice(-8)}`;

      const bulkExisting = await User.findOne({ email: bulkEmail });
      if (bulkExisting) {
        bulkSkipped++;
        continue;
      }

      const avgRating = Math.round(bulkRandomBetween(3.5, 5.0) * 10) / 10;
      const reviewCount = Math.floor(bulkRandomBetween(5, 60));

      const bulkProvider = await User.create({
        name: bulkName,
        email: bulkEmail,
        phone: bulkPhone,
        address: bulkPick(BULK_LOCATIONS),
        passwordHash: BULK_PASSWORD, // hashed automatically by the User model's pre("save") hook
        role: "provider",
        providerProfile: {
          skills: [bulkPick(BULK_SERVICE_TEMPLATES).category],
          experienceYears: Math.floor(bulkRandomBetween(1, 15)),
          serviceArea: bulkPick(BULK_LOCATIONS),
          bio: `Experienced home service professional serving ${bulkPick(BULK_LOCATIONS)}.`,
          availability: bulkPick(BULK_AVAILABILITY),
          verificationStatus: "verified",
          nidNumber: `${1000000000 + i}`,
          nidPhotoUrl: "",
          avgRating,
          reviewCount,
        },
      });
      bulkCreated++;

      const listingCount = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...BULK_SERVICE_TEMPLATES].sort(() => Math.random() - 0.5);
      for (let j = 0; j < listingCount; j++) {
        const tpl = shuffled[j];
        await Service.create({
          provider: bulkProvider._id,
          title: tpl.title,
          description: `${tpl.title} by ${bulkProvider.name}, serving ${bulkProvider.providerProfile.serviceArea}.`,
          category: tpl.category,
          price: tpl.price,
          estDurationMins: tpl.estDurationMins,
          approvalStatus: "approved",
          isActive: true,
        });
        bulkServicesCreated++;
      }
    }

    console.log(`\nDone with Part 2 (bulk-test providers).`);
    console.log(`  Providers created: ${bulkCreated}`);
    console.log(`  Providers skipped (email already existed): ${bulkSkipped}`);
    console.log(`  Service listings created: ${bulkServicesCreated}`);
    console.log(`  All bulk-test providers use password: ${BULK_PASSWORD}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();