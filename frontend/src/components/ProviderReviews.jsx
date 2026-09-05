import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ProviderReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get(`/reviews/provider/${user.id}`)
      .then((res) => setReviews(res.data.reviews || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleReplyChange = (reviewId, val) => {
    setReplyText((prev) => ({ ...prev, [reviewId]: val }));
  };

  const submitReply = async (reviewId) => {
    const text = (replyText[reviewId] || "").trim();
    if (!text) return;
    setSubmittingId(reviewId);
    setError("");
    try {
      await api.put(`/reviews/${reviewId}/reply`, { reply: text });
      setActiveReplyId(null);
      setReplyText((prev) => ({ ...prev, [reviewId]: "" }));
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit reply. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Rating and Review</h2>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {!loading && reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r._id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="font-semibold">{r.customerLabel || "Customer"}</p>
              <p className="text-orange-500">{"⭐".repeat(r.rating)}</p>
            </div>
            <p className="text-sm text-slate-600 mt-1">{r.comment}</p>

            {r.providerReply ? (
              <div className="mt-3 border-l-2 border-orange-300 pl-3 text-sm text-slate-500 italic">
                Your response: "{r.providerReply}"
              </div>
            ) : activeReplyId === r._id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  rows="3"
                  placeholder="Write a professional response..."
                  value={replyText[r._id] || ""}
                  onChange={(e) => handleReplyChange(r._id, e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitReply(r._id)}
                    disabled={submittingId === r._id}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {submittingId === r._id ? "Submitting..." : "Submit reply"}
                  </button>
                  <button
                    onClick={() => setActiveReplyId(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveReplyId(r._id)}
                className="mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Reply to this review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
