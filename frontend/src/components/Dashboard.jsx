import { useState, useEffect } from "react";
import axios from "axios";
import { Search, CheckCircle2, XCircle, Star, ClipboardList, MapPin, PaintBucket, Wrench, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const stats = [
  { label: "Active Bookings", value: 2, color: "text-blue-600", bg: "bg-blue-50", icon: ClipboardList },
  { label: "Completed Services", value: 17, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  { label: "Cancelled Services", value: 3, color: "text-red-500", bg: "bg-red-50", icon: XCircle },
  { label: "Reviews Given", value: 12, color: "text-yellow-500", bg: "bg-yellow-50", icon: Star },
];

const history = [
  { service: "Home Cleaning", provider: "SparkleClean Co.", date: "05 July 2026", amount: 1200, status: "Completed" },
  { service: "Plumbing Repair", provider: "Karim Hossain", date: "02 July 2026", amount: 1800, status: "Completed" },
  { service: "AC Repair Service", provider: "Mizanur Khan", date: "28 June 2026", amount: 2500, status: "Completed" },
  { service: "Painting Service", provider: "Color House", date: "20 June 2026", amount: 4000, status: "Cancelled" },
];

const upcoming = [
  { service: "Home Cleaning", date: "15 July 2026, 10:00 AM", status: "Confirmed", icon: PaintBucket },
  { service: "Plumbing Repair", date: "18 July 2026, 2:00 PM", status: "Pending", icon: Wrench },
  { service: "Electrical Service", date: "20 July 2026, 11:00 AM", status: "Pending", icon: Zap },
];

const steps = ["Booked", "Confirmed", "En Route", "In Progress", "Completed"];

function getStepIndex(status) {
  const idx = steps.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function Dashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/bookings")
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const activeBookings = bookings.filter((b) => b.status !== "Cancelled");
  const currentBooking = activeBookings[0];

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Good afternoon, {user?.name || "there"} 👋</h2>
          <p className="text-slate-500">What service do you need today?</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab && setActiveTab("booking")}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold whitespace-nowrap"
          >
            + Book a Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-1">
            <MapPin size={16} className="text-orange-500" /> Current Booking
          </h3>

          {loading && <p className="text-sm text-slate-400">Loading...</p>}

          {!loading && !currentBooking && (
            <p className="text-sm text-slate-400">
              No active bookings. Go to "Book a Service" to create one!
            </p>
          )}

          {currentBooking && (
            <>
              <h4 className="text-lg font-bold">{currentBooking.service}</h4>
              <p className="text-slate-600">{currentBooking.provider}</p>
              <p className="text-sm text-slate-500">
                📅 {currentBooking.date} &nbsp; ⏰ {currentBooking.time}
              </p>
              <p className="text-sm text-slate-500 mb-1">📍 {currentBooking.address}</p>
              <button className="text-orange-500 text-sm font-semibold mb-3">View Details →</button>

              <p className="font-semibold text-sm mb-2">Booking Progress</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {steps.map((step, i) => (
                  <span
                    key={step}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      i <= getStepIndex(currentBooking.status)
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 items-center">
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg">
                  Provider is on the way
                </span>
                <button className="flex-1 border border-orange-500 text-orange-500 font-semibold py-2 rounded-lg">
                  Track Booking
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">📄 My Booking History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Service</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.service} className="border-b last:border-0">
                  <td className="py-2">{h.service}</td>
                  <td>{h.provider}</td>
                  <td>{h.date}</td>
                  <td>৳ {h.amount}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        h.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">📅 Upcoming Bookings</h3>
            <button className="text-orange-500 text-xs font-semibold">View All →</button>
          </div>
          <div className="space-y-3">
            {upcoming.map((u) => (
              <div key={u.service} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                    <u.icon size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{u.service}</p>
                    <p className="text-xs text-slate-500">{u.date}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.status === "Confirmed"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab && setActiveTab("search")}
              className="border rounded-lg p-3 flex items-start gap-2 text-left"
            >
              <Search size={18} className="text-blue-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Book a New Service</p>
                <p className="text-xs text-slate-500">Find and book any service</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab("search")}
              className="border rounded-lg p-3 flex items-start gap-2 text-left"
            >
              <ClipboardList size={18} className="text-slate-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Browse Services</p>
                <p className="text-xs text-slate-500">Explore all available services</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab("saved")}
              className="border rounded-lg p-3 flex items-start gap-2 text-left"
            >
              <MapPin size={18} className="text-pink-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Saved Providers</p>
                <p className="text-xs text-slate-500">View your favourite providers</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab("profile")}
              className="border rounded-lg p-3 flex items-start gap-2 text-left"
            >
              <div className="w-5 h-5 bg-slate-700 rounded text-white text-[8px] font-bold flex items-center justify-center mt-1">i</div>
              <div>
                <p className="font-semibold text-sm">Profile Settings</p>
                <p className="text-xs text-slate-500">Update address & phone</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}