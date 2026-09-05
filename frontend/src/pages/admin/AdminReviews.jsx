import { useEffect, useState } from "react";
import api from "../../api/axios";

const ALERT =
  "mt-4 rounded-[7px] border border-red-200 bg-red-50 px-[0.8rem] py-[0.6rem] text-[0.9rem] text-red-600";
const BTN_SMALL =
  "cursor-pointer rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-semibold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

// @desc  Admin moderation view for FR-10.4 — lets the admin remove reviews
//        that violate community guidelines.
export default function AdminReviews() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadReviews = () =>
    api
      .get("/reviews")
      .then((res) => setReviews(res.data.reviews))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load reviews.")
      );

  useEffect(() => {
    loadReviews();
  }, []);

  const removeReview = async (id) => {
    if (!window.confirm("Remove this review? This can't be undone.")) return;
    setBusyId(id);
    setError("");
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((list) => list.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove review.");
    } finally {
      setBusyId(null);
    }
  };

  if (error && !reviews) return <div className={ALERT}>{error}</div>;
  if (!reviews)
    return <p className="mt-0 text-[0.95rem] text-slate-500">Loading reviews…</p>;

  return (
    <>
      {error && <div className={ALERT}>{error}</div>}

      <h3 className="m-0 mb-3 text-[1.05rem] font-bold">All reviews</h3>
      {reviews.length === 0 ? (
        <p className="mt-0 text-[0.95rem] text-slate-500">
          No reviews have been submitted yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 border-l-4 border-l-brand bg-white px-[1.3rem] py-[1.1rem] max-[700px]:flex-col max-[700px]:items-stretch"
              key={r._id}
            >
              <div className="min-w-0">
                <div className="mb-[0.3rem] flex flex-wrap items-center gap-2">
                  <span className="text-[0.95rem] font-bold text-orange-500">
                    {"★".repeat(r.rating)}
                    <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-[0.85rem] text-slate-500">
                    {r.customerId?.name || "Customer"} → {r.providerId?.name || "Provider"}
                  </span>
                </div>
                {r.comment && (
                  <p className="m-0 mb-2 text-[0.95rem] text-slate-700">{r.comment}</p>
                )}
                {r.providerReply && (
                  <p className="m-0 border-l-2 border-slate-200 pl-2 text-[0.85rem] italic text-slate-500">
                    Provider reply: "{r.providerReply}"
                  </p>
                )}
                <div className="mt-2 text-[0.78rem] text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex shrink-0 gap-2 max-[700px]:justify-end">
                <button
                  className={`${BTN_SMALL} bg-[#c0392b] text-white hover:bg-[#a03024]`}
                  disabled={busyId === r._id}
                  onClick={() => removeReview(r._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
