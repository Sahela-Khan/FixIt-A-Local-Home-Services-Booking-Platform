import React, { useState } from 'react';
export default function LeaveReviewModal({ isOpen, onClose, onSubmit, bookingDetails }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback comments.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        bookingId: bookingDetails._id,
        rating,
        comment
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Leave a Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">Share your experience with this service provider</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Booking Summary */}
          {bookingDetails && (
            <div className="p-4 bg-indigo-50/50 dark:bg-slate-700/30 rounded-2xl flex items-center justify-between border border-indigo-100/50 dark:border-slate-700">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {bookingDetails.listingId?.title || 'Home Service'}
                </span>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                  Provided by: {bookingDetails.providerId?.name || 'Service Provider'}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Amount Paid</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  ৳{bookingDetails.paymentDetails?.amount || bookingDetails.price || 0}
                </span>
              </div>
            </div>
          )}
          {/* Star Selection */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              How would you rate this service?
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transform transition hover:scale-125"
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-slate-500">
              {rating === 5 && 'Excellent - Exceeded Expectations!'}
              {rating === 4 && 'Good - Fully Satisfied.'}
              {rating === 3 && 'Average - Met basic needs.'}
              {rating === 2 && 'Fair - Needs improvement.'}
              {rating === 1 && 'Poor - Unacceptable.'}
            </span>
          </div>
          {/* Comment Box */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              Write your review comments
            </label>
            <textarea
              className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 text-sm shadow-inner"
              rows="4"
              placeholder="What did you like or dislike? How was the service quality?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
