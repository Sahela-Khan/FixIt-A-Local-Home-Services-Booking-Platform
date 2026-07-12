const Review = require('../models/Review');
const Booking = require('../models/Booking');
// @desc    Create a review for a completed booking
// @route   POST /api/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const customerId = req.user._id;
    // 1. Verify booking exists, belongs to customer, and is completed
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
    // 2. Check if a review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking.' });
    }
    // 3. Create the review
    const review = new Review({
      bookingId,
      customerId,
      providerId: booking.providerId,
      rating: Number(rating),
      comment
    });
    await review.save();
    res.status(201).json({
      message: 'Review submitted successfully',
      review
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
    const providerId = req.user._id;
    const reviewId = req.params.id;
    if (!reply || reply.trim() === '') {
      return res.status(400).json({ message: 'Reply text is required' });
    }
    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You can only reply to reviews on your bookings.' });
    }
    // Add reply
    review.providerReply = reply;
    await review.save();
    res.status(200).json({
      message: 'Reply added successfully',
      review
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
    const reviews = await Review.find({ providerId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
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
    // Use findById and then remove() to trigger the post('remove') middleware
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    // Trigger middleware for recalculating avgRating
    await review.deleteOne();
    res.status(200).json({
      message: 'Review deleted successfully by Admin'
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

