export {};
const mongoose = require('mongoose');

const bookingNightSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  }
}, {
  timestamps: true
});

bookingNightSchema.index(
  { listing: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('BookingNight', bookingNightSchema);
