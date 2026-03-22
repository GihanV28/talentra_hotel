import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentForm from '../components/PaymentForm';
import '../styles/checkout.css';

function CheckoutPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking details form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  
  // Payment intent
  const [clientSecret, setClientSecret] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Load hotel details
  useEffect(() => {
    fetchHotel();
  }, [hotelId]);
  
  const fetchHotel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/hotels/${hotelId}`
      );
      setHotel(response.data.data);
    } catch (err) {
      setError('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate nights and total
  const calculateTotal = () => {
    if (!checkIn || !checkOut || !hotel) return 0;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    
    if (nights < 1) return 0;
    
    return hotel.price * nights;
  };
  
  // Handle proceed to payment
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate dates
      if (!checkIn || !checkOut) {
        setError('Please select check-in and check-out dates');
        return;
      }
      
      const total = calculateTotal();
      if (total <= 0) {
        setError('Invalid dates selected');
        return;
      }
      
      // Create payment intent
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/payments/create-payment-intent`,
        {
          hotelId: hotelId,
          checkIn: checkIn,
          checkOut: checkOut,
          guests: guests,
          userId: null  // For demo, no authentication
        }
      );
      
      // Got client secret!
      setClientSecret(response.data.clientSecret);
      setBookingId(response.data.bookingId);
      setTotalAmount(response.data.amount);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };
  
  // Payment success callback
  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful!', paymentIntent);
    // Redirect to confirmation page
    navigate(`/booking-confirmation/${bookingId}`);
  };
  
  if (loading && !hotel) {
    return <div className="loading">Loading...</div>;
  }
  
  if (error && !hotel) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        {/* Left: Booking Details */}
        <div className="booking-details">
          <h2>Book Your Stay</h2>
          
          {hotel && (
            <div className="hotel-summary">
              <h3>{hotel.name}</h3>
              <p className="location">📍 {hotel.city}</p>
              <p className="price">Rs. {hotel.price.toLocaleString()} / night</p>
            </div>
          )}
          
          <form onSubmit={handleProceedToPayment} className="booking-form">
            <div className="form-group">
              <label>Check-in Date:</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Check-out Date:</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Number of Guests:</label>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                min="1"
                max="10"
                required
              />
            </div>
            
            {checkIn && checkOut && (
              <div className="total-summary">
                <p>Nights: {Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000*60*60*24))}</p>
                <h3>Total: Rs. {calculateTotal().toLocaleString()}</h3>
              </div>
            )}
            
            {!clientSecret && (
              <button 
                type="submit" 
                className="btn-proceed"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            )}
          </form>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {/* Right: Payment Form */}
        <div className="payment-section">
          {clientSecret ? (
            <PaymentForm
              clientSecret={clientSecret}
              amount={totalAmount}
              onSuccess={handlePaymentSuccess}
            />
          ) : (
            <div className="payment-placeholder">
              <p>Fill in booking details to proceed to payment</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default CheckoutPage;
