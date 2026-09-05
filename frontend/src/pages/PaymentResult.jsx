import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { roleHome, useAuth } from "../context/AuthContext";

// FR-11.4 — shown after SSLCommerz redirects the customer back here from the
// hosted payment page, whichever way the payment attempt ended.
const REASON_MESSAGES = {
  validation_failed: "We couldn't verify this payment with SSLCommerz. If money left your account, it will be refunded automatically — please contact support if it isn't reflected within a few days.",
  gateway_declined: "Your payment was declined by SSLCommerz or your bank. No money was taken. You can try again, or use a different payment method (bKash, Nagad, or another card).",
  unknown_transaction: "We couldn't find a matching booking for this payment attempt.",
  server_error: "Something went wrong on our end while confirming this payment. Please check your booking status in a moment, or try again.",
};

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");
  const bookingId = searchParams.get("bookingId");

  const [seconds, setSeconds] = useState(5);
  const homePath = roleHome(user?.role || "customer");

  useEffect(() => {
    if (status !== "success") return;
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "success" && seconds === 0) {
      window.location.href = homePath;
    }
  }, [seconds, status, homePath]);

  let icon, title, message, tone;
  if (status === "success") {
    icon = <CheckCircle2 size={48} className="text-green-500" />;
    title = "Payment successful";
    message = "Your payment has been confirmed. Thanks for using FixIt!";
    tone = "border-green-200 bg-green-50";
  } else if (status === "cancelled") {
    icon = <AlertTriangle size={48} className="text-yellow-500" />;
    title = "Payment cancelled";
    message = "You cancelled the payment before it completed. No money was taken — you can try again any time from your dashboard.";
    tone = "border-yellow-200 bg-yellow-50";
  } else {
    icon = <XCircle size={48} className="text-red-500" />;
    title = "Payment failed";
    message = REASON_MESSAGES[reason] || "Something went wrong with this payment. Please try again.";
    tone = "border-red-200 bg-red-50";
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className={`max-w-md w-full rounded-2xl border p-8 text-center shadow-sm ${tone}`}>
        <div className="flex justify-center mb-4">{icon}</div>
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        {bookingId && (
          <p className="text-xs text-slate-400 mb-4">Booking reference: {bookingId}</p>
        )}
        <Link
          to={homePath}
          className="inline-block bg-orange-500 text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-orange-600"
        >
          Back to dashboard
        </Link>
        {status === "success" && (
          <p className="text-xs text-slate-400 mt-3">Redirecting automatically in {seconds}s…</p>
        )}
      </div>
    </div>
  );
}
