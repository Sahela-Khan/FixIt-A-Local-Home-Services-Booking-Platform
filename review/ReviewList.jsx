import React, { useState } from 'react';
export default function ReviewList({ reviews, userRole, currentUserId, onReplySubmit }) {
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };
  const handleReplyChange = (reviewId, val) => {
    setReplyText((prev) => ({ ...prev, [reviewId]: val }));
  };
  const handleReplySubmit = async (reviewId) => {
    const text = replyText[reviewId];
    if (!text || text.trim() === '') return;
    
    await onReplySubmit(reviewId, text);
    setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
    setActiveReplyId(null);
  };
  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        No reviews left yet for this provider.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const isProviderOfReview = userRole === 'provider' && review.providerId === currentUserId;
        
        return (
          <div key={review._id} className="p-6 transition-all bg-white border border-slate-100 rounded-2xl shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500">
                    {review.customerId?.name ? review.customerId.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      {review.customerId?.name || 'Anonymous Customer'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {renderStars(review.rating)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              {review.comment}
            </p>
            {/* Provider's Reply Section */}
            {review.providerReply ? (
              <div className="p-4 mt-4 border-l-4 border-indigo-500 bg-slate-50 rounded-r-xl dark:bg-slate-700/50">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                    Provider's Response
                  </span>
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-300 italic">
                  "{review.providerReply}"
                </p>
              </div>
            ) : (
              isProviderOfReview && (
                <div className="mt-4">
                  {activeReplyId === review._id ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full p-3 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        rows="3"
                        placeholder="Write a professional response..."
                        value={replyText[review._id] || ''}
                        onChange={(e) => handleReplyChange(review._id, e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReplySubmit(review._id)}
                          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(review._id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                    >
                      Reply to this review
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
