import { useState, useEffect } from "react";
import { CheckCircle2, Clock, XCircle, Upload } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function PaymentsRewardsCancellation() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/bookings/mine")
      .then((res) => setBookings(res.data.bookings))
      .catch(() => {});
    loadRefundRequests();
  }, []);

  const loadRefundRequests = () => {
    api
      .get("/refund-requests/mine")
      .then((res) => setRefundRequests(res.data.requests || []))
      .catch(() => {});
  };

  const totalPaid = bookings
    .filter((b) => b.paymentStatus === "Paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Bookings a customer can reasonably dispute — not still-pending ones.
  const disputableBookings = bookings.filter((b) =>
    ["Completed", "Cancelled", "Confirmed", "En Route", "In Progress"].includes(b.status)
  );

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!bookingId) {
      setSubmitError("Please select which booking this is about.");
      return;
    }

    setSubmitting(true);
    try {
      let proofUrl = "";
      if (proofFile) {
        proofUrl = await readFileAsDataUrl(proofFile);
      }
      await api.post("/refund-requests", { bookingId, reason, proofUrl });
      setSubmitted(true);
      setReason("");
      setProofFile(null);
      setBookingId("");
      loadRefundRequests();
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Could not submit your refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-6">Payments, Rewards & Cancellation</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-500">{user?.loyaltyPoints ?? 0}</p>
          <p className="text-sm text-slate-500">Loyalty points balance</p>
        </div>
        <div className="bg-white rounded-xl p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-800">৳ {totalPaid}</p>
          <p className="text-sm text-slate-500">Total paid</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Payment history</h3>
        {bookings.length === 0 && <p className="text-sm text-slate-400">No payments yet.</p>}
        {bookings.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b last:border-0">
                  <td className="py-2">{b.service}</td>
                  <td>৳ {b.amount}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        b.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : b.paymentStatus === "Refunded"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Loyalty points rules</h3>
        <p className="text-sm text-slate-500 mb-1">
          You earn 5 points on your 1st booking, 10 on your 2nd, 15 on your 3rd — increasing by 5 every booking.
        </p>
        <p className="text-sm text-slate-500 mb-1">
          Cancelling a booking costs 10 points on your 1st cancellation, 20 on your 2nd, 30 on your 3rd — increasing by 10 each time.
        </p>
        <p className="text-sm text-slate-500">
          Reach 100,000 points and your next booking automatically gets 50% off — the discount is applied at checkout and 100,000 points are spent from your balance.
        </p>
        {(user?.loyaltyPoints ?? 0) >= 100000 && (
          <p className="text-sm font-semibold text-green-600 mt-2 bg-green-50 rounded-lg px-3 py-2">
            🎉 You've unlocked 50% off your next booking!
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Cancellation and refund policy</h3>
        <p className="text-sm text-green-600 flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} /> Before provider accepts — 100% refund
        </p>
        <p className="text-sm text-yellow-600 flex items-center gap-2 mb-2">
          <Clock size={16} /> After acceptance, 24+ hours before the job — 50% refund
        </p>
        <p className="text-sm text-red-500 flex items-center gap-2">
          <XCircle size={16} /> Within 24 hours of the job — no refund
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Request a refund / file a complaint</h3>
        {submitted && (
          <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-3">
            Your request has been submitted for admin review.
          </div>
        )}
        {submitError && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{submitError}</div>
        )}
        <form onSubmit={handleSubmitRefund}>
          <label className="text-xs font-semibold text-slate-500">Booking</label>
          <select
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            required
          >
            <option value="">Select the booking this is about</option>
            {disputableBookings.map((b) => (
              <option key={b._id} value={b._id}>
                {b.service} — {b.date} ({b.status})
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold text-slate-500">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why you're requesting a refund"
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            rows={2}
            required
          />
          <label className="text-xs font-semibold text-slate-500">Proof document</label>
          <label className="mt-1 mb-3 flex items-center gap-2 border border-dashed rounded-lg px-3 py-3 text-xs text-slate-500 cursor-pointer">
            <Upload size={14} />
            {proofFile ? proofFile.name : "Upload a photo or document"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit refund request"}
          </button>
        </form>
      </div>

      {refundRequests.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Your refund requests</h3>
          <table className="w-full text-sm">
            <tbody>
              {refundRequests.map((r) => (
                <tr key={r._id} className="border-b last:border-0">
                  <td className="py-2">{r.bookingId?.service || "Booking"}</td>
                  <td className="text-slate-500 text-xs">{r.reason}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : r.status === "Rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}