import { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

const policyRules = [
  {
    condition: "Before provider accepts",
    refund: "100% Full Refund",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle2,
  },
  {
    condition: "After acceptance, 24+ hours before job",
    refund: "50% Partial Refund",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  {
    condition: "Within 24 hours of the job",
    refund: "No Refund",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
];

// Simple rule: if status is "Booked" -> full refund, else -> partial refund (demo logic)
function getApplicableRefund(status) {
  if (status === "Booked") return policyRules[0];
  return policyRules[1];
}

export default function CancellationPolicy() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelledId, setCancelledId] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/bookings")
      .then((res) => setBookings(res.data.filter((b) => b.status !== "Cancelled")))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/bookings/${id}`, {
        status: "Cancelled",
      });
      setCancelledId(id);
      fetchBookings(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Service Cancellation</h2>
      <p className="text-slate-500 mb-6">Cancel your booking based on our configurable refund policy</p>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Active bookings list */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Your Active Bookings</h3>

          {loading && <p className="text-sm text-slate-400">Loading bookings...</p>}

          {!loading && bookings.length === 0 && (
            <p className="text-sm text-slate-400">
              No active bookings to cancel. Go book a service first!
            </p>
          )}

          <div className="space-y-4">
            {bookings.map((b) => {
              const applicable = getApplicableRefund(b.status);
              const justCancelled = cancelledId === b._id;

              return (
                <div key={b._id} className="border rounded-lg p-4">
                  <h4 className="font-bold">{b.service}</h4>
                  <p className="text-slate-600 text-sm">{b.provider}</p>
                  <p className="text-sm text-slate-500 mb-1">📅 {b.date} &nbsp; ⏰ {b.time}</p>
                  <p className="text-sm text-slate-500 mb-3">💰 ৳{b.amount}</p>

                  <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 ${applicable.color}`}>
                    <applicable.icon size={18} />
                    <div>
                      <p className="text-sm font-semibold">{applicable.condition}</p>
                      <p className="text-xs">Applicable refund: {applicable.refund}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancel(b._id)}
                    className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg"
                  >
                    Cancel This Booking
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Policy explanation table */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
          <h3 className="font-semibold mb-4">Cancellation Policy Rules</h3>
          <div className="space-y-3">
            {policyRules.map((rule) => (
              <div
                key={rule.condition}
                className={`flex items-center gap-3 p-3 rounded-lg ${rule.color}`}
              >
                <rule.icon size={20} />
                <div>
                  <p className="text-sm font-semibold">{rule.condition}</p>
                  <p className="text-xs">{rule.refund}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg mt-4 text-xs text-slate-500">
            <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <p>
              Providers can also cancel a booking. In that case, the customer is
              automatically notified and a full refund is triggered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}