/**
 * Seeds ONE showcase customer (rifat.demo@fixit.test) whose bookings are
 * hand-picked to demonstrate every one of the 5 features (search/filter,
 * booking, dashboard, cancellation, loyalty) in a single login — including
 * LIVE, clickable proof of all 3 cancellation refund tiers, not just
 * pre-resolved records.
 *
 * ALSO seeds 10 additional customers (password: 123456) with deliberately
 * varied loyalty balances and booking histories, so you have a spread of
 * demo accounts to show:
 *  - some ABOVE the 100,000-point discount threshold (FR-18.3)
 *  - some right AT / just BELOW it
 *  - some very low / zero
 *  - a mix of Paid / "Pay now" (unpaid completed) / Cancelled (all 3 refund
 *    tiers) / still-active (Booked / Confirmed) bookings across them
 *
 * Loyalty math mirrors bookingController.js exactly (bookingNumber * 5 on
 * creation, 3 points/day-since-confirmation penalty on cancel) for the
 * rifat.demo account; the 10 extra customers have loyaltyPoints set
 * directly to hit exact demo-friendly numbers.
 *
 * ALSO seeds 50 additional random TEST customers (password: 123456, emails
 * like karim.hossain1@customer.test) purely for bulk UI-testing purposes —
 * random loyaltyPoints, random address, NO bookings attached. Useful for
 * admin user-table / customer-list screens that need realistic volume.
 * Safe to re-run: matched by email, existing ones are skipped not duplicated.
 *
 * Depends on seedShowcase.js having already run (uses its providers/services
 * by email — Karim, Habibur, Rafiqul, Mizanur). Adds one new provider
 * (Kamal Ahmed, Electrical) so every search category has at least one result.
 *
 * Run from the backend/ folder:
 *   node scripts/seedShowcaseCustomer.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const RefundRequest = require("../models/RefundRequest");

const PASSWORD = "password123456";
const PASSWORD_10 = "123456";
const TIME_SLOTS = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

// ---------- Data pools for the 50 random bulk-test customers (Part 3) ----------
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
// Weighted pool: mostly low/medium balances (realistic majority), but a
// handful of high values sprinkled in so that a few of the 50 randomly
// land AT or ABOVE the 100,000-point discount threshold (FR-18.3) — giving
// you real accounts to demo the 50% loyalty discount from this bulk batch
// too, not just the 10 hand-picked customers in Part 2.
const BULK_LOYALTY_POINT_OPTIONS = [
  0, 0, 0, 5, 10, 15, 20, 25, 30, 40, 50, 65, 80, 100, // low (14 options)
  150, 200, 300, 500, 800, 1200, 2000, 3000,            // low-medium (8 options)
  5000, 8000, 12000, 18000, 25000, 35000, 50000, 70000, // medium-high (8 options)
  100000, 120000, 150000, 180000, 220000, 300000,       // AT/ABOVE threshold (6 options)
];
const BULK_TOTAL_CUSTOMERS = 50;

function bulkPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function bulkRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------- 10 additional customer definitions ----------
const CUSTOMERS = [
  {
    name: "Ariful Islam", email: "ariful.demo@fixit.test", phone: "01911000101",
    address: "House 3, Road 2, Banani, Dhaka", loyaltyPoints: 150000, // ABOVE threshold
    bookings: [
      { svc: "acGas", date: daysAgo(30), status: "Completed", paymentStatus: "Paid" },
      { svc: "wall", date: daysAgo(15), status: "Completed", paymentStatus: "Paid" },
      { svc: "cleaning", date: daysAgo(2), status: "Completed", paymentStatus: "Paid" },
      { svc: "pipe", date: daysFromNow(6), status: "Cancelled", paymentStatus: "Refunded", refundPercent: 100, deducted: 0 },
      { svc: "acGas", date: daysFromNow(2), status: "Confirmed", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Nusrat Jahan", email: "nusrat.demo@fixit.test", phone: "01911000102",
    address: "House 8, Road 5, Gulshan, Dhaka", loyaltyPoints: 100000, // exactly AT threshold
    bookings: [
      { svc: "wall", date: daysAgo(25), status: "Completed", paymentStatus: "Paid" },
      { svc: "cleaning", date: daysAgo(10), status: "Completed", paymentStatus: "Pending" }, // "Pay now"
      { svc: "acGas", date: daysFromNow(4), status: "Confirmed", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Tanvir Ahmed", email: "tanvir.demo@fixit.test", phone: "01911000103",
    address: "House 12, Mirpur, Dhaka", loyaltyPoints: 95000, // just BELOW threshold
    bookings: [
      { svc: "pipe", date: daysAgo(18), status: "Completed", paymentStatus: "Paid" },
      { svc: "cleaning", date: daysFromNow(5), status: "Cancelled", paymentStatus: "Refunded", refundPercent: 50, deducted: 3 },
      { svc: "wall", date: daysFromNow(3), status: "Booked", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Farzana Akter", email: "farzana.demo@fixit.test", phone: "01911000104",
    address: "House 20, Dhanmondi, Dhaka", loyaltyPoints: 60000,
    bookings: [
      { svc: "acGas", date: daysAgo(9), status: "Completed", paymentStatus: "Pending" }, // "Pay now"
      { svc: "wall", date: daysAgo(4), status: "Completed", paymentStatus: "Paid" },
      { svc: "pipe", date: daysFromNow(1), status: "Confirmed", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Shakil Rana", email: "shakil.demo@fixit.test", phone: "01911000105",
    address: "House 6, Mohammadpur, Dhaka", loyaltyPoints: 30000,
    bookings: [
      { svc: "cleaning", date: daysFromNow(7), status: "Cancelled", paymentStatus: "Refunded", refundPercent: 50, deducted: 3 },
      { svc: "acGas", date: daysFromNow(0), status: "Cancelled", paymentStatus: "Pending", refundPercent: 0, deducted: 3 },
      { svc: "wall", date: daysFromNow(5), status: "Booked", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Mou Rahman", email: "mou.demo@fixit.test", phone: "01911000106",
    address: "House 14, Uttara, Dhaka", loyaltyPoints: 12000,
    bookings: [
      { svc: "pipe", date: daysFromNow(2), status: "Confirmed", paymentStatus: "Pending" },
      { svc: "cleaning", date: daysFromNow(6), status: "Booked", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Imran Kabir", email: "imran.demo@fixit.test", phone: "01911000107",
    address: "House 9, Bashundhara, Dhaka", loyaltyPoints: 500,
    bookings: [
      { svc: "acGas", date: daysAgo(3), status: "Completed", paymentStatus: "Paid" },
      { svc: "wall", date: daysFromNow(4), status: "Cancelled", paymentStatus: "Refunded", refundPercent: 100, deducted: 0 },
    ],
  },
  {
    name: "Sadia Islam", email: "sadia.demo@fixit.test", phone: "01911000108",
    address: "House 2, Badda, Dhaka", loyaltyPoints: 0, // brand new customer
    bookings: [
      { svc: "cleaning", date: daysFromNow(3), status: "Booked", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Rezaul Karim", email: "rezaul.demo@fixit.test", phone: "01911000109",
    address: "House 17, Baridhara, Dhaka", loyaltyPoints: 220000, // very high, well ABOVE threshold
    bookings: [
      { svc: "pipe", date: daysAgo(40), status: "Completed", paymentStatus: "Paid" },
      { svc: "acGas", date: daysAgo(22), status: "Completed", paymentStatus: "Paid" },
      { svc: "wall", date: daysAgo(6), status: "Completed", paymentStatus: "Pending" }, // "Pay now"
      { svc: "cleaning", date: daysFromNow(1), status: "Confirmed", paymentStatus: "Pending" },
    ],
  },
  {
    name: "Lamia Sultana", email: "lamia.demo@fixit.test", phone: "01911000110",
    address: "House 22, Khilgaon, Dhaka", loyaltyPoints: 75000,
    bookings: [
      { svc: "wall", date: daysAgo(8), status: "Completed", paymentStatus: "Pending" }, // "Pay now"
      { svc: "pipe", date: daysFromNow(6), status: "Cancelled", paymentStatus: "Refunded", refundPercent: 50, deducted: 3 },
      { svc: "acGas", date: daysFromNow(0), status: "Confirmed", paymentStatus: "Pending" },
    ],
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const mustFind = async (email, label) => {
      const u = await User.findOne({ email });
      if (!u) throw new Error(`${label} (${email}) not found — run seedShowcase.js first.`);
      return u;
    };
    const karim = await mustFind("karim.provider@fixit.test", "Karim");
    const habibur = await mustFind("habibur.provider@fixit.test", "Habibur");
    const rafiqul = await mustFind("rafiqul.provider@fixit.test", "Rafiqul");
    const mizanur = await mustFind("mizanur.provider@fixit.test", "Mizanur");

    const mustFindService = async (providerId, title) => {
      const s = await Service.findOne({ provider: providerId, title });
      if (!s) throw new Error(`Service "${title}" not found for provider — run seedShowcase.js first.`);
      return s;
    };
    const acGasMizanur = await mustFindService(mizanur._id, "AC Gas Refill");
    const wallTouchUp = await mustFindService(karim._id, "Wall Touch-up");
    const homeCleaning = await mustFindService(rafiqul._id, "Home Cleaning");
    const pipeInstall = await mustFindService(habibur._id, "Pipe Installation");

    // ================================================================
    // PART 1 — original showcase customer: rifat.demo@fixit.test
    // ================================================================

    // ---------- New provider: covers the "Electrical" category filter ----------
    let kamal = await User.findOne({ email: "kamal.provider@fixit.test" });
    if (!kamal) {
      kamal = await User.create({
        name: "Kamal Ahmed",
        email: "kamal.provider@fixit.test",
        phone: "01711000006",
        role: "provider",
        address: "",
        passwordHash: PASSWORD,
        providerProfile: {
          skills: ["Electrical"],
          experienceYears: 6,
          serviceArea: "Uttara, Dhaka",
          bio: "Wiring repair and electrical fitting specialist.",
          availability: "online",
          verificationStatus: "verified",
          avgRating: 4.1,
          reviewCount: 6,
        },
      });
      console.log("Created provider: kamal.provider@fixit.test (Electrical)");
    }
    let wiringRepair = await Service.findOne({ provider: kamal._id, title: "Wiring Repair" });
    if (!wiringRepair) {
      wiringRepair = await Service.create({
        provider: kamal._id, title: "Wiring Repair", category: "Electrical",
        price: 1800, estDurationMins: 90, approvalStatus: "approved",
        description: "Wiring repair and fault diagnosis.",
      });
      console.log("Created service: Wiring Repair (Electrical)");
    }

    // ---------- The showcase customer ----------
    let customer = await User.findOne({ email: "rifat.demo@fixit.test" });
    if (customer) {
      console.log("rifat.demo@fixit.test already exists — clearing old bookings/refund-requests so the demo stays clean.");
      await Booking.deleteMany({ customerId: customer._id });
      await RefundRequest.deleteMany({ customerId: customer._id });
    } else {
      customer = await User.create({
        name: "Rifat Hossain",
        email: "rifat.demo@fixit.test",
        phone: "01911000099",
        role: "customer",
        address: "House 25, Road 10, Uttara, Dhaka",
        passwordHash: PASSWORD,
        savedProviders: [mizanur._id, karim._id],
      });
      console.log("Created customer: rifat.demo@fixit.test");
    }

    let totalAwarded = 0;
    let totalDeducted = 0;
    let bookingNumber = 0;

    const createBooking = async (fields) => {
      bookingNumber += 1;
      const pointsAwarded = bookingNumber * 5; // same formula as bookingController.createBooking
      totalAwarded += pointsAwarded;
      return Booking.create({
        customerId: customer._id,
        address: customer.address,
        loyaltyPointsAwarded: pointsAwarded,
        ...fields,
      });
    };

    // #1 — Completed + Paid
    await createBooking({
      providerId: mizanur._id, serviceId: acGasMizanur._id,
      service: "AC Gas Refill", provider: "Mizanur Khan",
      date: daysAgo(20), time: TIME_SLOTS[0],
      amount: 1800, status: "Completed", paymentStatus: "Paid",
    });

    // #2 — Completed + UNPAID -> shows "Pay ৳1500 now" in booking history
    await createBooking({
      providerId: karim._id, serviceId: wallTouchUp._id,
      service: "Wall Touch-up", provider: "Karim Hossain",
      date: daysAgo(12), time: TIME_SLOTS[1],
      amount: 1500, status: "Completed", paymentStatus: "Pending",
    });

    // #3 — Completed + Paid
    await createBooking({
      providerId: rafiqul._id, serviceId: homeCleaning._id,
      service: "Home Cleaning", provider: "Rafiqul Islam",
      date: daysAgo(6), time: TIME_SLOTS[2],
      amount: 1200, status: "Completed", paymentStatus: "Paid",
    });

    // #4 — Already cancelled AFTER confirmation, 24+ hrs before job -> 50% refund (pre-resolved record)
    await createBooking({
      providerId: habibur._id, serviceId: pipeInstall._id,
      service: "Pipe Installation", provider: "Habibur Rahman",
      date: daysFromNow(5), time: TIME_SLOTS[3],
      amount: 2500, status: "Cancelled", paymentStatus: "Refunded",
      refundPercent: 50, cancelledBy: "customer", cancelledAt: new Date(),
      cancelReason: "Found a cheaper local plumber.",
      loyaltyPointsDeducted: 3,
    });
    totalDeducted += 3;

    // #5 — Already cancelled AFTER confirmation, WITHIN 24 hrs -> 0% refund (pre-resolved record)
    await createBooking({
      providerId: mizanur._id, serviceId: acGasMizanur._id,
      service: "AC Gas Refill", provider: "Mizanur Khan",
      date: daysFromNow(0), time: TIME_SLOTS[4],
      amount: 1800, status: "Cancelled", paymentStatus: "Pending",
      refundPercent: 0, cancelledBy: "customer", cancelledAt: new Date(),
      cancelReason: "Had to cancel last minute.",
      loyaltyPointsDeducted: 3,
    });
    totalDeducted += 3;

    // #6 — Already cancelled BEFORE provider ever accepted -> 100% refund, no penalty
    {
      const b6 = await createBooking({
        providerId: karim._id, serviceId: wallTouchUp._id,
        service: "Wall Touch-up", provider: "Karim Hossain",
        date: daysFromNow(8), time: TIME_SLOTS[0],
        amount: 1500, status: "Cancelled", paymentStatus: "Refunded",
        refundPercent: 100, cancelledBy: "customer", cancelledAt: new Date(),
        cancelReason: "Changed my mind before the provider accepted.",
        loyaltyPointsDeducted: 0,
      });
      await Booking.updateOne({ _id: b6._id }, { $set: { confirmedAt: null } });
    }

    // #7 — Still "Booked" (never accepted) — live-cancel this one during your
    // demo to PROVE the 100% tier computes correctly in real time.
    await createBooking({
      providerId: rafiqul._id, serviceId: homeCleaning._id,
      service: "Home Cleaning", provider: "Rafiqul Islam",
      date: daysFromNow(4), time: TIME_SLOTS[2],
      amount: 1200, status: "Booked", paymentStatus: "Pending",
    });

    // #8 — "Confirmed", 3 days out — live-cancel this one to PROVE the 50% tier.
    await createBooking({
      providerId: kamal._id, serviceId: wiringRepair._id,
      service: "Wiring Repair", provider: "Kamal Ahmed",
      date: daysFromNow(3), time: TIME_SLOTS[1],
      amount: 1800, status: "Confirmed", paymentStatus: "Pending",
    });

    // #9 — "Confirmed", today — live-cancel this one to PROVE the 0% tier.
    await createBooking({
      providerId: habibur._id, serviceId: pipeInstall._id,
      service: "Pipe Installation", provider: "Habibur Rahman",
      date: daysFromNow(0), time: TIME_SLOTS[4],
      amount: 2500, status: "Confirmed", paymentStatus: "Pending",
    });

    customer.loyaltyPoints = totalAwarded - totalDeducted;
    await customer.save();

    // A pending refund request tied to booking #5, so the dispute/admin
    // review loop has something to show too.
    const b5 = await Booking.findOne({ customerId: customer._id, service: "AC Gas Refill", status: "Cancelled" });
    await RefundRequest.create({
      bookingId: b5._id,
      customerId: customer._id,
      reason: "The provider hadn't even confirmed yet when I cancelled — I don't think I should lose the full amount.",
      status: "Pending",
    });

    console.log(`\nDone with rifat.demo.`);
    console.log(`Login: rifat.demo@fixit.test / ${PASSWORD}`);
    console.log(`Loyalty points so far: ${totalAwarded} awarded - ${totalDeducted} deducted = ${customer.loyaltyPoints}`);
    console.log(`(3 more bookings — #7/#8/#9 — are still ACTIVE and uncancelled, ready for you to cancel live.)`);
    console.log(`9 bookings total: 3 Completed (1 unpaid), 3 already-Cancelled (50%/0%/100%), 3 still active (Booked/Confirmed/Confirmed).`);
    console.log(`1 pending refund request. 2 saved providers. 6th provider (Kamal, Electrical) added.`);

    // ================================================================
    // PART 2 — 10 additional customers, password: 123456
    // ================================================================

    const SVC = {
      acGas: { providerId: mizanur._id, provider: "Mizanur Khan", serviceId: acGasMizanur._id, service: "AC Gas Refill", amount: 1800 },
      wall: { providerId: karim._id, provider: "Karim Hossain", serviceId: wallTouchUp._id, service: "Wall Touch-up", amount: 1500 },
      cleaning: { providerId: rafiqul._id, provider: "Rafiqul Islam", serviceId: homeCleaning._id, service: "Home Cleaning", amount: 1200 },
      pipe: { providerId: habibur._id, provider: "Habibur Rahman", serviceId: pipeInstall._id, service: "Pipe Installation", amount: 2500 },
    };

    for (const def of CUSTOMERS) {
      let c = await User.findOne({ email: def.email });
      if (c) {
        console.log(`${def.email} already exists — clearing old bookings/refund-requests.`);
        await Booking.deleteMany({ customerId: c._id });
        await RefundRequest.deleteMany({ customerId: c._id });
      } else {
        c = await User.create({
          name: def.name,
          email: def.email,
          phone: def.phone,
          role: "customer",
          address: def.address,
          passwordHash: PASSWORD_10,
        });
        console.log(`Created customer: ${def.email}`);
      }

      let refundAttached = false;
      let bNum = 0;
      for (const b of def.bookings) {
        bNum += 1;
        const svc = SVC[b.svc];
        const fields = {
          customerId: c._id,
          address: c.address,
          providerId: svc.providerId,
          provider: svc.provider,
          serviceId: svc.serviceId,
          service: svc.service,
          date: b.date,
          time: TIME_SLOTS[bNum % TIME_SLOTS.length],
          amount: svc.amount,
          status: b.status,
          paymentStatus: b.paymentStatus,
          loyaltyPointsAwarded: bNum * 5,
        };
        if (b.status === "Cancelled") {
          Object.assign(fields, {
            refundPercent: b.refundPercent,
            cancelledBy: "customer",
            cancelledAt: new Date(),
            cancelReason: "Demo cancellation for showcase.",
            loyaltyPointsDeducted: b.deducted ?? 0,
          });
        }
        const created = await Booking.create(fields);

        if (b.status === "Cancelled" && !refundAttached) {
          await RefundRequest.create({
            bookingId: created._id,
            customerId: c._id,
            reason: "Requesting review of the refund amount applied.",
            status: "Pending",
          });
          refundAttached = true;
        }
      }

      c.loyaltyPoints = def.loyaltyPoints;
      await c.save();

      console.log(`  -> ${def.name}: ${def.bookings.length} bookings, loyaltyPoints = ${def.loyaltyPoints}`);
    }

    console.log(`\nDone with the 10 extra customers. All use password: ${PASSWORD_10}`);
    console.log(CUSTOMERS.map(c => `${c.email} (${c.loyaltyPoints} pts)`).join("\n"));

    // ================================================================
    // PART 3 — 50 random bulk-test customers, password: 123456
    // (no bookings, just for UI volume testing — e.g. admin user tables)
    // ================================================================

    let bulkCreated = 0;
    let bulkSkipped = 0;
    let bulkAboveThreshold = 0;
    const LOYALTY_DISCOUNT_THRESHOLD = 100000;

    for (let i = 0; i < BULK_TOTAL_CUSTOMERS; i++) {
      const first = BULK_FIRST_NAMES[i % BULK_FIRST_NAMES.length];
      const last = BULK_LAST_NAMES[Math.floor(i / BULK_FIRST_NAMES.length) % BULK_LAST_NAMES.length];
      const bulkName = `${first} ${last}`;
      const bulkEmail = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@customer.test`;
      const bulkPhone = `019${String(10000000 + i).slice(-8)}`;
      const houseNo = bulkRandomBetween(1, 60);
      const roadNo = bulkRandomBetween(1, 15);
      const area = bulkPick(BULK_LOCATIONS);

      const assignedPoints = bulkPick(BULK_LOYALTY_POINT_OPTIONS);
      if (assignedPoints >= LOYALTY_DISCOUNT_THRESHOLD) bulkAboveThreshold++;

      const bulkExisting = await User.findOne({ email: bulkEmail });
      if (bulkExisting) {
        // Already exists (e.g. from an earlier run) — refresh their
        // loyaltyPoints to the new weighted pool instead of leaving the
        // old low value in place, so re-running actually gives you
        // discount-eligible accounts among the bulk batch.
        bulkExisting.loyaltyPoints = assignedPoints;
        await bulkExisting.save();
        bulkSkipped++;
        continue;
      }

      await User.create({
        name: bulkName,
        email: bulkEmail,
        phone: bulkPhone,
        address: `House ${houseNo}, Road ${roadNo}, ${area}`,
        passwordHash: PASSWORD_10,
        role: "customer",
        loyaltyPoints: assignedPoints,
      });
      bulkCreated++;
    }

    console.log(`\nDone with the 50 bulk-test customers.`);
    console.log(`  Customers created: ${bulkCreated}`);
    console.log(`  Customers skipped (email already existed): ${bulkSkipped}`);
    console.log(`  Customers with >= ${LOYALTY_DISCOUNT_THRESHOLD} points (discount-eligible): ${bulkAboveThreshold}`);
    console.log(`  All bulk-test customers use password: ${PASSWORD_10}`);
    console.log(`  Tip: check User collection sorted by loyaltyPoints desc to find which emails qualify.`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();