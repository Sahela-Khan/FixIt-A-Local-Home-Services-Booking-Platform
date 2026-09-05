/**
 * Seeds Services + Bookings + Reviews + Notifications using ALREADY-EXISTING
 * providers/customers in the database (does NOT touch the Users collection).
 * Use this after you've manually inserted your 20 providers + 20 customers
 * into MongoDB Atlas via the Data Explorer.
 *
 * NOTE: providers show up in customer Search & Book as soon as one of
 * their services is admin-approved — identity/NID upload does not gate
 * search visibility.
 *
 * Run from the backend/ folder:
 *   node scripts/seedServicesBookings.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Notification = require("../models/Notification");

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

const TIME_SLOTS = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

function fmtDate(d) { return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function createBookingWithPoints({ customer, provider, service, date, time, status, isCancelled, cancelIndexForCustomer, bookingIndexForCustomer }) {
  const pointsAwarded = 10; // flat +10 loyalty points per booking

  const booking = await Booking.create({
    customerId: customer._id,
    providerId: provider._id,
    serviceId: service._id,
    service: service.title,
    provider: provider.name,
    date,
    time,
    address: customer.address,
    notes: "",
    amount: service.price,
    status,
    paymentStatus: status === "Completed" ? "Paid" : isCancelled ? "Refunded" : "Pending",
    loyaltyPointsAwarded: pointsAwarded,
  });

  customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsAwarded;

  if (isCancelled) {
    const penalty = 20; // flat -20 loyalty points per cancellation
    booking.loyaltyPointsDeducted = penalty;
    booking.refundPercent = 100;
    booking.cancelledBy = "customer";
    booking.cancelledAt = new Date();
    booking.cancelReason = "Change of plans";
    await booking.save();
    customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - penalty);
  }

  await Notification.create({
    userId: provider._id,
    message: `New booking request: ${service.title} on ${date} at ${time}.`,
    type: "booking_created",
  });
  await Notification.create({
    userId: customer._id,
    message: `Booking confirmed for ${service.title}. You earned ${pointsAwarded} loyalty points.`,
    type: "booking_created",
  });

  return booking;
}

async function run() {
  await connectDB();

  const providers = await User.find({ role: "provider" }).sort({ createdAt: 1 });
  const customers = await User.find({ role: "customer" }).sort({ createdAt: 1 });

  if (providers.length === 0 || customers.length === 0) {
    console.error("No providers or customers found. Insert your 40 users first, then run this script.");
    process.exit(1);
  }
  console.log(`Found ${providers.length} providers and ${customers.length} customers.`);

  console.log("Clearing old Services/Bookings/Reviews/Notifications (Users are untouched)...");
  await Promise.all([
    Service.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Creating service listings for each provider...");
  const services = [];
  for (const provider of providers) {
    const listingCount = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...SERVICE_TEMPLATES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < listingCount; i++) {
      const tpl = shuffled[i];
      const listing = await Service.create({
        provider: provider._id,
        title: tpl.title,
        description: `${tpl.title} by ${provider.name}, serving ${provider.providerProfile?.serviceArea || "Dhaka"}.`,
        category: tpl.category,
        price: tpl.price,
        estDurationMins: tpl.estDurationMins,
        approvalStatus: "approved",
        isActive: true,
      });
      services.push(listing);
    }
  }
  console.log(`Created ${services.length} services.`);

  console.log("Creating bookings for each customer...");
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const provider = providers[i % providers.length];
    const providerServices = services.filter((s) => s.provider.toString() === provider._id.toString());
    if (providerServices.length === 0) continue;

    let bookingIndex = 0;
    let cancelIndex = 0;

    for (let c = 0; c < 2; c++) {
      bookingIndex++;
      await createBookingWithPoints({
        customer, provider, service: pick(providerServices),
        date: fmtDate(daysFromNow(-(5 + c * 7))), time: pick(TIME_SLOTS),
        status: "Completed", isCancelled: false, bookingIndexForCustomer: bookingIndex,
      });
    }

    bookingIndex++;
    await createBookingWithPoints({
      customer, provider, service: pick(providerServices),
      date: fmtDate(daysFromNow(1)), time: pick(TIME_SLOTS),
      status: pick(["Confirmed", "En Route", "In Progress"]),
      isCancelled: false, bookingIndexForCustomer: bookingIndex,
    });

    bookingIndex++;
    const upcomingStatus = i % 3 === 0 ? "Booked" : "Confirmed";
    await createBookingWithPoints({
      customer, provider, service: pick(providerServices),
      date: fmtDate(daysFromNow(4 + (i % 5))), time: pick(TIME_SLOTS),
      status: upcomingStatus, isCancelled: false, bookingIndexForCustomer: bookingIndex,
    });

    if (i % 4 === 0) {
      bookingIndex++;
      cancelIndex++;
      await createBookingWithPoints({
        customer, provider, service: pick(providerServices),
        date: fmtDate(daysFromNow(-2)), time: pick(TIME_SLOTS),
        status: "Cancelled", isCancelled: true,
        bookingIndexForCustomer: bookingIndex, cancelIndexForCustomer: cancelIndex,
      });
    }

    await customer.save();
  }

  console.log("Adding sample reviews to completed bookings...");
  const completedBookings = await Booking.find({ status: "Completed" }).limit(15);
  const comments = [
    "Very professional and on time.",
    "Good work, would book again.",
    "Fixed the issue quickly, fair price.",
    "Friendly and explained everything clearly.",
    "Satisfied with the service overall.",
  ];
  for (const b of completedBookings) {
    const exists = await Review.findOne({ bookingId: b._id });
    if (exists) continue;
    await Review.create({
      bookingId: b._id, customerId: b.customerId, providerId: b.providerId,
      rating: 3 + Math.floor(Math.random() * 3), comment: pick(comments),
    });
    // Loyalty points: flat +5 every time a review is left
    await User.findByIdAndUpdate(b.customerId, { $inc: { loyaltyPoints: 5 } });
  }

  console.log("\nDone! Services + Bookings + Reviews + Notifications created for your existing 40 users.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});