import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle2, Clock, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ComingSoon from "./ComingSoon";
import featureFlags from "../config/featureFlags";

const statusColors = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  offline: "bg-slate-400",
};

const nextStatus = {
  Confirmed: "En Route",
  "En Route": "In Progress",
  "In Progress": "Completed",
};

function StatCard({ icon: Icon, iconBg, value, label }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function ProviderOverview() {
  const { user, updateUser } = useAuth();

  const [incoming, setIncoming] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, thisWeek: 0, thisMonth: 0, totalJobsCompleted: 0 });
  const [listings, setListings] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalRequests: 0, totalRejected: 0 });
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState({ title: "", category: "", price: "", estDurationMins: "", description: "" });
  const [savingListing, setSavingListing] = useState(false);

  const availability = user?.providerProfile?.availability || "offline";

  const loadAll = async () => {
    setLoading(true);
    try {
      const [incomingRes, scheduleRes, earningsRes, listingsRes, historyRes, reviewsRes] = await Promise.all([
        api.get("/provider/bookings/incoming"),
        api.get("/provider/bookings/schedule"),
        api.get("/provider/earnings"),
        api.get("/provider/services"),
        api.get("/provider/bookings/history"),
        api.get(`/reviews/provider/${user.id}`),
      ]);
      setIncoming(incomingRes.data.bookings);
      setSchedule(scheduleRes.data.bookings);
      setEarnings(earningsRes.data);
      setListings(listingsRes.data.listings);
      setHistory(historyRes.data.bookings);
      setStats({ totalRequests: historyRes.data.totalRequests, totalRejected: historyRes.data.totalRejected });
      setReviewCount(reviewsRes.data.reviews?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAvailability = async (value) => {
    try {
      await api.put("/provider/availability", { availability: value });
      updateUser({ providerProfile: { ...user.providerProfile, availability: value } });
    } catch (err) {
      alert(err.response?.data?.message || "Could not update availability.");
    }
  };

  const respond = async (bookingId, action) => {
    try {
      await api.put(`/provider/bookings/${bookingId}/respond`, { action });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Could not respond to booking.");
    }
  };

  const advanceStatus = async (booking) => {
    const newStatus = nextStatus[booking.status];
    if (!newStatus) return;
    try {
      await api.put(`/provider/bookings/${booking._id}/status`, { status: newStatus });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status.");
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!listingForm.title || !listingForm.category || !listingForm.price) {
      alert("Title, category and price are required.");
      return;
    }
    setSavingListing(true);
    try {
      await api.post("/provider/services", {
        ...listingForm,
        price: Number(listingForm.price),
        estDurationMins: listingForm.estDurationMins ? Number(listingForm.estDurationMins) : undefined,
      });
      setListingForm({ title: "", category: "", price: "", estDurationMins: "", description: "" });
      setShowListingForm(false);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Could not create listing.");
    } finally {
      setSavingListing(false);
    }
  };

  return (
    <div className="p-8">
      {/* Greeting header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Good morning, {user?.name?.split(" ")[0] || "there"}! 👋</h2>
          <p className="text-slate-500 text-sm">Here's what's happening with your services today.</p>
        </div>
        <div className="flex items-center gap-2">
          {["online", "busy", "offline"].map((opt) => (
            <button
              key={opt}
              onClick={() => changeAvailability(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                availability === opt ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-500"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors[opt]}`} />
              {opt[0].toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={ClipboardList} iconBg="bg-orange-500" value={earnings.totalJobsCompleted + incoming.length + schedule.length} label="Total Bookings" />
        <StatCard icon={CheckCircle2} iconBg="bg-green-500" value={earnings.totalJobsCompleted} label="Completed Jobs" />
        <StatCard icon={Clock} iconBg="bg-yellow-500" value={schedule.filter((b) => b.status === "In Progress").length} label="In Progress" />
        <StatCard icon={Wallet} iconBg="bg-purple-500" value={`৳ ${earnings.thisWeek}`} label="This Week's Earnings" />
      </div>

      {/* Request / Reject / Review counts */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex gap-6 text-sm">
        <p><span className="font-bold text-orange-500">{stats.totalRequests}</span> <span className="text-slate-500">Requests received</span></p>
        <p><span className="font-bold text-red-500">{stats.totalRejected}</span> <span className="text-slate-500">Rejected</span></p>
        <p><span className="font-bold text-green-600">{reviewCount}</span> <span className="text-slate-500">Reviews</span></p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Incoming Requests */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">
              Incoming Requests {incoming.length > 0 && <span className="text-orange-500">({incoming.length})</span>}
            </h3>
            {!loading && incoming.length === 0 && <p className="text-sm text-slate-400">No pending requests right now.</p>}
            <div className="space-y-3">
              {incoming.map((b) => (
                <div key={b._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{b.service}</p>
                      <p className="text-sm text-slate-500">👤 {b.customerId?.name || 'Customer'}</p>
                      <p className="text-sm text-slate-500">📍 {b.address}</p>
                      <p className="text-sm text-slate-500">📅 {b.date} ⏰ {b.time}</p>
                    </div>
                    <span className="font-bold text-orange-500">৳ {b.amount}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => respond(b._id, "reject")}
                      className="flex-1 border border-red-300 text-red-500 text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => respond(b._id, "accept")}
                      className="flex-1 bg-orange-500 text-white text-sm font-semibold py-1.5 rounded-lg"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Upcoming Schedule</h3>
            {!loading && schedule.length === 0 && <p className="text-sm text-slate-400">No upcoming jobs scheduled.</p>}
            <div className="space-y-3">
              {schedule.map((b) => (
                <div key={b._id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{b.service}</p>
                    <p className="text-sm text-slate-500">👤 {b.customerId?.name || 'Customer'}</p>
                    <p className="text-sm text-slate-500">📍 {b.address}</p>
                    <p className="text-sm text-slate-500">📅 {b.date} ⏰ {b.time} · Status: {b.status}</p>
                  </div>
                  {nextStatus[b.status] && (
                    // Feature 5 — Real-Time Job Status Tracker. Held back for
                    // Sprint 3 (see src/config/featureFlags.js). Booking
                    // acceptance (above) is unaffected — jobs will simply stay
                    // at "Confirmed" until this flag is turned on.
                    featureFlags.statusTracker ? (
                      <button
                        onClick={() => advanceStatus(b)}
                        className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Mark {nextStatus[b.status]}
                      </button>
                    ) : (
                      <ComingSoon compact />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Service History */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">My Service History</h3>
            {!loading && history.length === 0 && <p className="text-sm text-slate-400">No service history yet.</p>}
            {history.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b">
                    <th className="pb-2">Service Name</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Booking Progress</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b) => (
                    <tr key={b._id} className="border-b last:border-0">
                      <td className="py-2">{b.service}</td>
                      <td>{b.status}</td>
                      <td>{b.date}</td>
                      <td>{b.status}</td>
                      <td>{b.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* My service listings */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">My service listings</h3>
              <button
                onClick={() => setShowListingForm(!showListingForm)}
                className="text-sm font-semibold text-orange-500"
              >
                {showListingForm ? "Close" : "+ Add listing"}
              </button>
            </div>

            {showListingForm && (
              <form onSubmit={handleCreateListing} className="border rounded-lg p-3 mb-4 space-y-2">
                <input
                  placeholder="Title (e.g. AC Repair Service)"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Category (e.g. AC Repair)"
                  value={listingForm.category}
                  onChange={(e) => setListingForm({ ...listingForm, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Price (৳)"
                    value={listingForm.price}
                    onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Duration (mins)"
                    value={listingForm.estDurationMins}
                    onChange={(e) => setListingForm({ ...listingForm, estDurationMins: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  placeholder="Short description (optional)"
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={savingListing}
                  className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
                >
                  {savingListing ? "Saving..." : "Create listing"}
                </button>
              </form>
            )}

            {!loading && listings.length === 0 && <p className="text-sm text-slate-400">You haven't listed any services yet.</p>}
            <div className="space-y-2">
              {listings.map((l) => (
                <div key={l._id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{l.title}</p>
                    <p className="text-sm text-slate-500">{l.category} · ৳ {l.price}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      l.approvalStatus === "approved"
                        ? "bg-green-100 text-green-700"
                        : l.approvalStatus === "rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {l.approvalStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Earnings Overview</h3>
            <p className="text-2xl font-bold">৳ {earnings.thisWeek}</p>
            <p className="text-xs text-slate-400 mb-3">This week</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
              <div><p className="font-bold text-slate-800">৳ {earnings.today}</p>Today</div>
              <div><p className="font-bold text-slate-800">৳ {earnings.thisMonth}</p>This month</div>
              <div><p className="font-bold text-slate-800">{earnings.totalJobsCompleted}</p>Jobs done</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Recent Bookings</h3>
            {history.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
            {history.slice(0, 4).map((b) => (
              <div key={b._id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-semibold">{b.service}</p>
                  <p className="text-xs text-slate-400">{b.date}</p>
                </div>
                <span className={`text-xs font-semibold ${b.status === "Completed" ? "text-green-500" : "text-slate-400"}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}