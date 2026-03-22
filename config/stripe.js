import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: false,
});

async function testStripeConnection(amount, currency) {
    try {
        const account = await stripe.accounts.retrieve();
        console.log('Stripe account retrieved successfully:', account.id);
    } catch (error) {
        console.error('Error testing Stripe connection:', error);
    }
}

export default stripe;