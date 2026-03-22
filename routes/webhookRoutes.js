import express from 'express';
import stripe from '../config/stripe.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint for payment status updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Webhook signature verification failed
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('\n🔔 Webhook received:', event.type);
      
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    switch (event.type) {
      
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  }
);

async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log('✅ Payment succeeded:', paymentIntent.id);
    console.log('   Amount:', paymentIntent.amount / 100);
    
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) {
      console.error('❌ No booking ID in payment intent metadata');
      return;
    }
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        paymentStatus: 'succeeded',
        paidAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      console.error('❌ Booking not found:', bookingId);
      return;
    }
    
    console.log('✅ Booking confirmed:', booking._id);
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id);
    
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) return;
    
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'failed',
      status: 'cancelled'
    });
    
    console.log('📝 Booking marked as failed');
    
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent) {
  try {
    console.log('🚫 Payment canceled:', paymentIntent.id);
    
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) return;
    
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'canceled',
      status: 'cancelled'
    });
    
    console.log('📝 Booking marked as canceled');
    
  } catch (error) {
    console.error('❌ Error handling payment cancellation:', error);
  }
}

export default router;