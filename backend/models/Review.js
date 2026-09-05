const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per completed booking
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  providerReply: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true
});

// Recalculate and store the provider's average rating on the User document
// (this project stores provider info on User.providerProfile, there is no separate ProviderProfile model)
reviewSchema.statics.calculateAverageRating = async function (providerId) {
  const stats = await this.aggregate([
    { $match: { providerId: providerId } },
    {
      $group: {
        _id: '$providerId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  try {
    const User = mongoose.model('User');
    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    await User.findByIdAndUpdate(providerId, {
      'providerProfile.avgRating': avgRating,
      'providerProfile.reviewCount': stats.length > 0 ? stats[0].nRating : 0,
    });
  } catch (err) {
    console.error('Error updating provider average rating:', err);
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.providerId);
});

// Mongoose 7+/8 removed document.remove(); deleteOne() on a document triggers this hook instead
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calculateAverageRating(this.providerId);
});

module.exports = mongoose.model('Review', reviewSchema);