const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
// Public route to view reviews for a provider
router.get('/provider/:providerId', reviewController.getReviewsForProvider);
// Protected routes
router.use(protect);
// Customer only - create a review
router.post('/', restrictTo('customer'), reviewController.createReview);
// Provider only - reply to a review
router.put('/:id/reply', restrictTo('provider'), reviewController.replyToReview);
// Admin only - delete a review
router.delete('/:id', restrictTo('admin'), reviewController.deleteReview);
module.exports = router;
