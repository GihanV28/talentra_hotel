import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './PaymentForm.css';

function PaymentForm({ clientSecret, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Stripe.js loaded නැත්නම් return
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = 
        await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/payment-success'
          },
          redirect: 'if_required'  // Don't redirect if not needed
        });
      
      if (confirmError) {
        // Payment failed
        setError(confirmError.message);
        console.error('Payment failed:', confirmError);
        
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded!
        setSuccess(true);
        console.log('Payment succeeded!', paymentIntent);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      }
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Payment error:', err);
      
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="payment-form-container">
      <h2>💳 Payment Details</h2>
      
      <div className="amount-display">
        <p>Amount to Pay:</p>
        <h3>Rs. {amount.toLocaleString()}</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="payment-form">
        {/* Stripe Payment Element */}
        {/* මේක automatically හදනවා card input fields */}
        <PaymentElement />
        
        {/* Error message */}
        {error && (
          <div className="payment-error">
            ❌ {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="payment-success">
            ✅ Payment successful! Redirecting...
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          className="btn-pay"
          disabled={!stripe || processing || success}
        >
          {processing ? (
            <span>
              <span className="spinner"></span>
              Processing...
            </span>
          ) : (
            `Pay Rs. ${amount.toLocaleString()}`
          )}
        </button>
        
        {/* Security badges */}
        <div className="security-badges">
          <p>🔒 Secure payment powered by Stripe</p>
          <p>💳 Your card details are never stored on our servers</p>
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;