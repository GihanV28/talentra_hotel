import {loadStripe} from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not defined in the environment variables');
}

const stripePromise = loadStripe(stripePublishableKey);

export default stripePromise;