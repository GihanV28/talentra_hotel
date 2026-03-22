import express from 'express';
import stripe from '../config/stripe.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';

const router = express.Router();

/**
 * @swagger
 * /api/payments/create-payment-intent:
 *   post:
 *     summary: Create a Stripe payment intent for hotel booking
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - checkIn
 *               - checkOut
 *               - guests
 *             properties:
 *               hotelId:
 *                 type: string
 *                 description: MongoDB ObjectId of the hotel
 *               checkIn:
 *                 type: string
 *                 format: date
 *                 description: Check-in date (ISO string)
 *               checkOut:
 *                 type: string
 *                 format: date
 *                 description: Check-out date (ISO string)
 *               guests:
 *                 type: integer
 *                 description: Number of guests
 *               userId:
 *                 type: string
 *                 description: MongoDB ObjectId of the user (optional)
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                 bookingId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                   example: LKR
 *       400:
 *         description: Missing required booking details or validation error
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to create payment intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, guests, userId } = req.body;
    
    console.log('\n💳 Creating payment intent...');
    console.log('Hotel ID:', hotelId);
    console.log('Dates:', checkIn, 'to', checkOut);
    console.log('Guests:', guests);
    
    if (!hotelId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking details'
      });
    }
    
    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }
    
    if (!hotel.available) {
      return res.status(400).json({
        success: false,
        error: 'Hotel not available for booking'
      });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    
    if (nights < 1) {
      return res.status(400).json({
        success: false,
        error: 'Check-out must be after check-in'
      });
    }
    
    const totalAmount = hotel.price * nights;
    
    console.log(`💰 Amount: Rs. ${totalAmount} (${nights} nights)`);
    
    const booking = await Booking.create({
      hotel: hotelId,
      user: userId || null,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guests,
      totalAmount: totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    console.log('📋 Booking created:', booking._id);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'lkr',
      metadata: {
        bookingId: booking._id.toString(),
        hotelId: hotel._id.toString(),
        hotelName: hotel.name,
        checkIn: checkIn,
        checkOut: checkOut,
        nights: nights.toString(),
        guests: guests.toString()
      },
      description: `Hotel Booking: ${hotel.name} (${nights} nights)`,
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    console.log('✅ Payment Intent created:', paymentIntent.id);
    console.log('   Status:', paymentIntent.status);
    
    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      bookingId: booking._id,
      amount: totalAmount,
      currency: 'LKR'
    });
    
  } catch (error) {
    console.error('❌ Payment intent creation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/payments/intent/{paymentIntentId}:
 *   get:
 *     summary: Get the status of a Stripe payment intent
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe payment intent ID
 *     responses:
 *       200:
 *         description: Payment intent status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                   example: LKR
 *       500:
 *         description: Error retrieving payment intent
 */
router.get('/intent/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    
    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;