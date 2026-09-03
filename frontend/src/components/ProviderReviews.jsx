import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ProviderReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/reviews/provider/${user.id}`)
      .then((res) => setReviews(res.data.reviews || []))
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Rating and Review</h2>
      {!loading && reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r._id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="font-semibold">{r.customerLabel || "Customer"}</p>
              <p className="text-orange-500">{"⭐".repeat(r.rating)}</p>
            </div>
            <p className="text-sm text-slate-600 mt-1">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
