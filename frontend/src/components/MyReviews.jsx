import { useState, useEffect } from "react";
import api from "../api/axios";
import LeaveReviewModal from "./LeaveReviewModal";
import { useAuth } from "../context/AuthContext";

export default function MyReviews() {
  const { user, updateUser } = useAuth();
  const [reviewableBookings, setReviewableBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null); // booking currently being reviewed in the modal

  const load = () => {
    setLoading(true);
    api
      .get("/reviews/mine")
      .then((res) => {
        setReviewableBookings(res.data.reviewableBookings);
        setMyReviews(res.data.myReviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmitReview = async ({ bookingId, rating, comment }) => {
    const res = await api.post("/reviews", { bookingId, rating, comment });
    const pointsAwarded = res.data?.loyaltyPointsAwarded || 0;
    if (pointsAwarded > 0) {
      updateUser({ loyaltyPoints: (user?.loyaltyPoints || 0) + pointsAwarded });
    }
    load();
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-6">Ratings & Reviews</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Completed jobs awaiting your review</h3>
        {!loading && reviewableBookings.length === 0 && (
          <p className="text-sm text-slate-400">
            Nothing to review right now — completed bookings will show up here.
          </p>
        )}
        <div className="space-y-2">
          {reviewableBookings.map((b) => (
            <div key={b._id} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{b.service}</p>
                <p className="text-sm text-slate-500">{b.provider} · {b.date}</p>
              </div>
              <button
                onClick={() => setActiveBooking(b)}
                className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
              >
                Leave a review
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3">My reviews</h3>
        {myReviews.length === 0 && (
          <p className="text-sm text-slate-400">You haven't left any reviews yet.</p>
        )}
        <div className="space-y-3">
          {myReviews.map((r) => (
            <div key={r._id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <p className="font-semibold">
                  You rated: <span className="text-orange-600">{r.providerId?.name || "Provider"}</span>
                </p>
                <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{r.comment}</p>
              {r.providerReply && (
                <div className="mt-2 border-l-2 border-orange-300 pl-3 text-sm text-slate-500 italic">
                  Provider replied: "{r.providerReply}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <LeaveReviewModal
        isOpen={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        onSubmit={handleSubmitReview}
        bookingDetails={
          activeBooking && {
            _id: activeBooking._id,
            listingId: { title: activeBooking.service },
            providerId: { name: activeBooking.provider },
            price: activeBooking.amount,
          }
        }
      />
    </div>
  );
}