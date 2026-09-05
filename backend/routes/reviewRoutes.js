const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, role } = require('../middleware/auth');
// Public route to view reviews for a provider
router.get('/provider/:providerId', reviewController.getReviewsForProvider);
// Protected routes
router.use(auth);
// Customer only - see reviewable completed bookings + my submitted reviews
router.get('/mine', role('customer'), reviewController.getMyReviewData);
// Customer only - create a review
router.post('/', role('customer'), reviewController.createReview);
// Provider only - reply to a review
router.put('/:id/reply', role('provider'), reviewController.replyToReview);
// Admin only - delete a review
router.delete('/:id', role('admin'), reviewController.deleteReview);
module.exports = router;