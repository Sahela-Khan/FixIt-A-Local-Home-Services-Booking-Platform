import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext"; // adjust path if your context lives elsewhere
import AvailabilityToggle from "../components/provider/AvailabilityToggle";
import {
  getProviderProfile,
  getProviderBookings,
  getProviderEarnings,
  getProviderReviews,
  respondToBooking,
  updateJobStatus,
  replyToReview,
  STATUS_LABEL,
  nextStatus,
} from "../services/providerService";

function StatCard({ label, value, accent = "border-teal-700" }) {
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 ${accent} bg-white p-4 shadow-sm`}>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    booked: "bg-amber-100 text-amber-800",
    accepted: "bg-sky-100 text-sky-800",
    en_route: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// FR-8.1 — incoming booking request, Accept/Reject
function IncomingRequestCard({ booking, onRespond }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900">{booking.listingTitle}</p>
          <p className="text-xs text-slate-500">{booking.category}</p>
        </div>
        <StatusPill status={booking.status} />
      </div>
      <p className="text-sm text-slate-700">{booking.customerName} &middot; {booking.customerPhone}</p>
      <p className="text-sm text-slate-600">{booking.address}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">
        {booking.date} &middot; {booking.timeSlot}
      </p>
      <p className="mt-1 text-sm font-bold text-teal-800">৳{booking.price.toLocaleString()}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onRespond(booking.id, "accepted")}
          className="flex-1 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
        >
          Accept
        </button>
        <button
          onClick={() => onRespond(booking.id, "rejected")}
          className="flex-1 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// FR-8.3 / FR-8.4 — upcoming scheduled job with customer details + status update
function UpcomingJobRow({ booking, onAdvance }) {
  const next = nextStatus(booking.status);
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900">{booking.listingTitle}</p>
          <StatusPill status={booking.status} />
        </div>
        <p className="text-sm text-slate-600">
          {booking.customerName} &middot; {booking.customerPhone}
        </p>
        <p className="text-sm text-slate-500">{booking.address}</p>
        <p className="text-sm font-medium text-slate-700">
          {booking.date} &middot; {booking.timeSlot}
        </p>
      </div>
      {next && (
        <button
          onClick={() => onAdvance(booking.id, next)}
          className="whitespace-nowrap rounded-lg bg-rust px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: "#C6621F" }}
        >
          Mark as {STATUS_LABEL[next]}
        </button>
      )}
    </div>
  );
}

// FR-8.2 — earnings summary (daily / weekly / monthly) + trend
function EarningsPanel({ earnings }) {
  const max = Math.max(...earnings.trend.map((e) => e.amount), 1);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">Earnings summary</h2>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold text-teal-800">৳{earnings.today.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Today</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold text-teal-800">৳{earnings.thisWeek.toLocaleString()}</p>
          <p className="text-xs text-slate-500">This Week</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold text-teal-800">৳{earnings.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-slate-500">This Month</p>
        </div>
      </div>
      <div className="flex h-32 items-end gap-3">
        {earnings.trend.map((e) => (
          <div key={e.month} className="flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t bg-teal-700"
              style={{ height: `${(e.amount / max) * 100}%` }}
              title={`৳${e.amount.toLocaleString()}`}
            />
            <span className="mt-1 text-[11px] text-slate-500">{e.month}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// FR-11.2 — provider can respond to reviews
function ReviewsPanel({ reviews, onReply }) {
  const [drafts, setDrafts] = useState({});

  const submitReply = (reviewId) => {
    const text = (drafts[reviewId] || "").trim();
    if (!text) return;
    onReply(reviewId, text);
    setDrafts((d) => ({ ...d, [reviewId]: "" }));
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">Recent reviews</h2>
      <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
        {reviews.map((r) => (
          <div key={r.id} className="border-l-2 border-amber-400 pl-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{r.customerName}</p>
              <span className="text-amber-500 text-xs">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </div>
            <p className="text-sm text-slate-600">{r.comment}</p>
            <p className="text-[11px] text-slate-400">{r.date}</p>

            {r.providerReply ? (
              <p className="mt-2 rounded-lg bg-teal-50 p-2 text-xs text-teal-800">
                <span className="font-semibold">Your reply: </span>
                {r.providerReply}
              </p>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  value={drafts[r.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="Reply to this review…"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-teal-600 focus:outline-none"
                />
                <button
                  onClick={() => submitReply(r.id)}
                  className="rounded-md bg-teal-800 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-900"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProviderDashboard() {
  const { user } = useAuth(); // expects { name, role, providerProfile: {...} }

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [profileData, bookingsData, earningsData, reviewsData] = await Promise.all([
        getProviderProfile(),
        getProviderBookings(),
        getProviderEarnings(),
        getProviderReviews(),
      ]);
      setProfile(profileData);
      setBookings(bookingsData);
      setEarnings(earningsData);
      setReviews(reviewsData);
      setLoading(false);
    })();
  }, []);

  // FR-8.1
  const incomingRequests = useMemo(
    () => bookings.filter((b) => b.status === "booked"),
    [bookings]
  );

  // FR-8.3 — anything already accepted and not yet completed
  const upcomingJobs = useMemo(
    () => bookings.filter((b) => ["accepted", "en_route", "in_progress"].includes(b.status)),
    [bookings]
  );

  const completedCount = useMemo(
    () => bookings.filter((b) => b.status === "completed").length,
    [bookings]
  );

  const handleRespond = async (bookingId, action) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: action } : b))
    );
    await respondToBooking(bookingId, action);
  };

  const handleAdvance = async (bookingId, status) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    await updateJobStatus(bookingId, status);
  };

  const handleAvailabilityChange = (value) => {
    setProfile((p) => ({ ...p, availability: value }));
  };

  const handleReply = async (reviewId, reply) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, providerReply: reply } : r))
    );
    await replyToReview(reviewId, reply);
  };

  if (loading || !profile || !earnings) {
    return <div className="p-10 text-center text-slate-500">Loading your dashboard…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      {/* Header — profile summary + FR-8.4 quick-access availability toggle */}
      <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Provider Dashboard
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.avgRating.toFixed(1)} ★ average &middot; {profile.reviewCount} reviews
          </p>
        </div>
        <AvailabilityToggle status={profile.availability} onChange={handleAvailabilityChange} />
      </header>

      {/* Stat overview */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Incoming Requests" value={incomingRequests.length} accent="border-amber-500" />
        <StatCard label="Upcoming Jobs" value={upcomingJobs.length} accent="border-sky-600" />
        <StatCard label="Completed Jobs" value={completedCount} accent="border-emerald-600" />
        <StatCard label="Avg. Rating" value={profile.avgRating.toFixed(1)} accent="border-teal-700" />
      </section>

      {/* FR-8.1 — Incoming booking requests */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Incoming booking requests</h2>
        {incomingRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No new booking requests right now.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incomingRequests.map((b) => (
              <IncomingRequestCard key={b.id} booking={b} onRespond={handleRespond} />
            ))}
          </div>
        )}
      </section>

      {/* FR-8.3 / FR-8.4 — Upcoming scheduled jobs + status update */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Upcoming scheduled jobs</h2>
        {upcomingJobs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Nothing scheduled at the moment.</p>
        ) : (
          <div>
            {upcomingJobs.map((b) => (
              <UpcomingJobRow key={b.id} booking={b} onAdvance={handleAdvance} />
            ))}
          </div>
        )}
      </section>

      {/* FR-8.2 — Earnings summary + FR-11.2 — Review replies */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EarningsPanel earnings={earnings} />
        <ReviewsPanel reviews={reviews} onReply={handleReply} />
      </div>
    </div>
  );
}
