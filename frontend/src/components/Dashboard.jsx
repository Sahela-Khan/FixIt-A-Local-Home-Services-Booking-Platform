import { useState, useEffect, Fragment } from "react";
import { CheckCircle2, XCircle, Star, ClipboardList, MapPin, Calendar, Download, ChevronDown, ChevronUp, CreditCard, Trash2, MessageSquareText } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AppModal from "./AppModal";

const steps = ["Booked", "Confirmed", "En Route", "In Progress", "Completed"];

function getStepIndex(status) {
  const idx = steps.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function sortByDateAsc(a, b) {
  return new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`);
}

function refundHintFor(booking) {
  if (booking.status === "Booked") return "Before provider accepts — cancelling now gives a 100% refund";
  const jobDateTime = new Date(`${booking.date} ${booking.time}`);
  const hoursRemaining = (jobDateTime - new Date()) / (1000 * 60 * 60);
  if (hoursRemaining >= 24) return "Accepted, 24+ hours away — cancelling now gives a 50% refund";
  return "Within 24 hours of the job — cancelling now gives no refund";
}

export default function Dashboard({ setActiveTab, reviewCount = 0 }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState(null); // which row's service name was clicked (shows details)

  // Modal state — replaces window.alert / window.prompt / window.confirm
  const [modal, setModal] = useState({ open: false, type: "message", title: "", message: "" });
  const [cancelTarget, setCancelTarget] = useState(null); // booking currently being confirmed for cancel
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const showMessage = (title, message) =>
    setModal({ open: true, type: "message", title, message });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const loadBookings = () => {
    setLoading(true);
    api
      .get("/bookings/mine")
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setError("Could not load your bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const activeBookings = bookings
    .filter((b) => !["Completed", "Cancelled"].includes(b.status))
    .sort(sortByDateAsc);
  const completedCount = bookings.filter((b) => b.status === "Completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "Cancelled").length;
  const historyBookings = bookings
    .filter((b) => ["Completed", "Cancelled"].includes(b.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const openCancelConfirm = (booking) => {
    setCancelTarget(booking);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget._id);
    try {
      await api.put(`/bookings/${cancelTarget._id}/cancel`, { reason: cancelReason });
      setCancelTarget(null);
      setExpandedId(null);
      loadBookings();
    } catch (err) {
      showMessage("Could not cancel", err.response?.data?.message || "Something went wrong.");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePay = async (booking) => {
    if (booking.status !== "Completed") {
      showMessage("Booking not completed", "You can only pay once the job has been marked Completed by the provider.");
      return;
    }
    setPayingId(booking._id);
    try {
      await api.put(`/bookings/${booking._id}/pay`);
      loadBookings();
    } catch (err) {
      showMessage("Payment failed", err.response?.data?.message || "Something went wrong.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Good afternoon 👋</h2>
        <p className="text-slate-500">What service do you need today?</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Active Bookings", value: activeBookings.length, color: "text-blue-600", bg: "bg-blue-50", icon: ClipboardList },
          { label: "Completed Services", value: completedCount, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
          { label: "Cancelled Services", value: cancelledCount, color: "text-red-500", bg: "bg-red-50", icon: XCircle },
          { label: "Loyalty Points", value: user?.loyaltyPoints ?? 0, color: "text-yellow-500", bg: "bg-yellow-50", icon: Star },
          { label: "Reviews Given", value: reviewCount, color: "text-purple-500", bg: "bg-purple-50", icon: MessageSquareText, tab: "reviews" },
        ].map((s) => (
          <div
            key={s.label}
            onClick={s.tab ? () => setActiveTab(s.tab) : undefined}
            className={`bg-white rounded-xl p-5 text-center shadow-sm ${
              s.tab ? "cursor-pointer hover:shadow-md transition-shadow" : ""
            }`}
          >
            <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Merged Current + Upcoming table */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Upcoming Booking</h3>

        {loading && <p className="text-sm text-slate-400">Loading...</p>}
        {!loading && activeBookings.length === 0 && (
          <p className="text-sm text-slate-400">
            No bookings yet. Go to "Search & Book" to create one!
          </p>
        )}

        {activeBookings.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Service</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Booking Progress</th>
                <th>Pay</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.map((b, index) => {
                const isCurrent = index === 0; // earliest booking = "current"
                const isExpanded = expandedId === b._id;
                return (
                  <Fragment key={b._id}>
                    <tr className="border-b last:border-0 align-top">
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : b._id)}
                          className="flex items-center gap-2 text-left font-semibold hover:text-orange-600"
                        >
                          {isCurrent ? (
                            <MapPin size={14} className="text-orange-500 shrink-0" title="Current booking" />
                          ) : (
                            <Calendar size={14} className="text-slate-400 shrink-0" title="Upcoming booking" />
                          )}
                          {b.service}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="py-3 pr-2">{b.provider}</td>
                      <td className="py-3 pr-2 whitespace-nowrap">{b.date}<br /><span className="text-xs text-slate-400">{b.time}</span></td>
                      <td className="py-3 pr-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => handlePay(b)}
                          disabled={payingId === b._id || b.paymentStatus === "Paid"}
                          className="flex items-center gap-1 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60 whitespace-nowrap"
                        >
                          <CreditCard size={12} />
                          {b.paymentStatus === "Paid"
                            ? "Paid"
                            : payingId === b._id
                            ? "Paying..."
                            : `Pay ৳${b.amount} now`}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openCancelConfirm(b)}
                          title="Cancel this booking"
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-3 py-4 rounded-lg">
                          <p className="text-sm text-slate-500 mb-2">📍 {b.address}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {steps.map((step, i) => (
                              <span
                                key={step}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  i <= getStepIndex(b.status)
                                    ? "bg-orange-500 text-white"
                                    : "bg-slate-200 text-slate-400"
                                }`}
                              >
                                {step}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">{refundHintFor(b)}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3">📄 My Booking History</h3>
        {!loading && historyBookings.length === 0 && (
          <p className="text-sm text-slate-400">
            No bookings yet. Once a booking is completed or cancelled, it will show up here.
          </p>
        )}
        {historyBookings.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Service</th>
                <th>Provider</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historyBookings.map((h) => (
                <tr key={h._id} className="border-b last:border-0">
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
                  <td>
                    {h.status === "Completed" && (
                      <button
                        title="Download receipt"
                        className="text-orange-500"
                        onClick={() => showMessage("Coming soon", "PDF receipt generation will be added (Feature 13).")}
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Simple message modal (replaces alert()) */}
      <AppModal
        open={modal.open}
        type="message"
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      {/* Cancel confirmation modal (replaces prompt()/confirm()) */}
      <AppModal
        open={Boolean(cancelTarget)}
        type="confirm"
        title="Cancel this booking?"
        message={cancelTarget ? refundHintFor(cancelTarget) : ""}
        showReasonInput
        reason={cancelReason}
        onReasonChange={setCancelReason}
        confirmLabel="Cancel booking"
        confirming={Boolean(cancellingId)}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}