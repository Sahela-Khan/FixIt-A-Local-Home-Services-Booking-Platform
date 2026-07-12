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
// Post-save middleware to update the average rating on the Provider's profile automatically
reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.providerId);
});
// Post-remove middleware to update the average rating on the Provider's profile when a review is deleted
reviewSchema.post('remove', async function() {
  await this.constructor.calculateAverageRating(this.providerId);
});
// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(providerId) {
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
    if (stats.length > 0) {
      await mongoose.model('ProviderProfile').findOneAndUpdate(
        { userId: providerId },
        {
          avgRating: Math.round(stats[0].avgRating * 10) / 10 // Round to 1 decimal place
        }
      );
    } else {
      await mongoose.model('ProviderProfile').findOneAndUpdate(
        { userId: providerId },
        { avgRating: 0 }
      );
    }
  } catch (err) {
    console.error('Error updating provider average rating:', err);
  }
};
module.exports = mongoose.model('Review', reviewSchema);