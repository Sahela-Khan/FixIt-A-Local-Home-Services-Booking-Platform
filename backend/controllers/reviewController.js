const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create a review for a completed booking
// @route   POST /api/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const customerId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.customerId.toString() !== customerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You can only review your own bookings.' });
    }
    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only review completed jobs.' });
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking.' });
    }

    const review = new Review({
      bookingId,
      customerId,
      providerId: booking.providerId,
      rating: Number(rating),
      comment,
    });
    await review.save();

    // Loyalty points: flat +5 every time a customer leaves a review
    const REVIEW_POINTS = 5;
    await User.findByIdAndUpdate(customerId, { $inc: { loyaltyPoints: REVIEW_POINTS } });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
      loyaltyPointsAwarded: REVIEW_POINTS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Respond to a customer review
// @route   PUT /api/reviews/:id/reply
// @access  Private (Provider only)
exports.replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const providerId = req.user.id;
    const reviewId = req.params.id;
    if (!reply || reply.trim() === '') {
      return res.status(400).json({ message: 'Reply text is required' });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You can only reply to reviews on your bookings.' });
    }
    review.providerReply = reply;
    await review.save();
    res.status(200).json({
      message: 'Reply added successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all reviews for a specific provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
exports.getReviewsForProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ providerId }).sort({ createdAt: -1 });
    // Providers should not see which customer left which review — anonymize.
    const anonymized = reviews.map((r) => {
      const obj = r.toObject();
      obj.customerId = undefined;
      obj.customerLabel = `Customer #${r._id.toString().slice(-4).toUpperCase()}`;
      return obj;
    });
    res.status(200).json({
      success: true,
      count: anonymized.length,
      reviews: anonymized,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get the logged-in customer's own reviews + reviewable completed bookings
// @route   GET /api/reviews/mine
// @access  Private (Customer)
exports.getMyReviewData = async (req, res) => {
  try {
    const customerId = req.user.id;
    const completedBookings = await Booking.find({ customerId, status: 'Completed' }).sort({ updatedAt: -1 });
    const myReviews = await Review.find({ customerId })
      .populate('providerId', 'name')
      .sort({ createdAt: -1 });
    const reviewedBookingIds = new Set(myReviews.map((r) => r.bookingId.toString()));

    const reviewableBookings = completedBookings.filter((b) => !reviewedBookingIds.has(b._id.toString()));

    res.status(200).json({ reviewableBookings, myReviews });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete a review (Admin only)
// @route   DELETE /api/reviews/:id
// @access  Private (Admin only)
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.deleteOne();
    res.status(200).json({
      message: 'Review deleted successfully by Admin',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};