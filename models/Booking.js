import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // References
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Allow anonymous bookings for demo
  },
  
  // Booking details
  checkIn: {
    type: Date,
    required: true
  },
  
  checkOut: {
    type: Date,
    required: true
  },
  
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Payment info
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Stripe reference
  stripePaymentIntentId: {
    type: String
  },
  
  // Guest contact (for anonymous bookings)
  guestName: String,
  guestEmail: String,
  guestPhone: String
  
}, {
  timestamps: true
});

// Virtual to get number of nights
bookingSchema.virtual('nights').get(function() {
  const nights = Math.ceil(
    (this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24)
  );
  return nights;
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;