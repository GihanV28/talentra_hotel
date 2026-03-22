import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Sparkles, X, Heart, Menu, Coffee, BedDouble, Calendar } from 'lucide-react';
import { aiSearch, fetchSuggestions, fetchSimilarHotels } from './api';
import './index.css';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from './config/stripe';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CheckoutPage from './pages/CheckoutPage';

function AppContent() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarHotels, setSimilarHotels] = useState([]);

  useEffect(() => {
    const loadSuggestions = async () => {
      const res = await fetchSuggestions();
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
      }
    };
    loadSuggestions();
  }, []);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);

    const res = await aiSearch(query);
    if (res.success) {
      setResults(res.results || []);
    } else {
      setError(res.error || 'Failed to search hotels');
    }
    setLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 100);
  };

  const openHotelModal = async (hotel) => {
    setSelectedHotel(hotel);
    setSimilarLoading(true);
    setSimilarHotels([]);
    
    const res = await fetchSimilarHotels(hotel._id);
    if (res.success && res.recommendations) {
      setSimilarHotels(res.recommendations);
    }
    setSimilarLoading(false);
  };

  const closeHotelModal = () => {
    setSelectedHotel(null);
    setSimilarHotels([]);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        className={`star-icon ${idx < Math.floor(rating) ? 'star-filled' : 'star-empty'}`} 
      />
    ));
  };

  return (
    <div className="app-container">
      <div className="bg-glow orb-1"></div>
      <div className="bg-glow orb-2"></div>
      
      <header className={`hero ${hasSearched ? 'hero-compact' : 'hero-full'}`}>
        <div className="hero-content">
          <div className="top-bar">
            <div className="logo" onClick={() => {setHasSearched(false); setResults([]); setQuery('');}}>
              <Sparkles className="logo-icon" />
              <h1>Aura<span>Stays</span></h1>
            </div>
            <div className="nav-menu">
               <button className="nav-link">Destinations</button>
               <button className="nav-link">Offers</button>
               <button className="user-btn"><Menu size={18}/></button>
            </div>
          </div>
          
          {!hasSearched && (
            <div className="hero-text">
              <h2>Find your perfect stay, naturally.</h2>
              <p>Just describe what you're looking for, and our AI will find the perfect match.</p>
            </div>
          )}

          <form onSubmit={handleSearch} className={`search-wrapper ${hasSearched ? 'compact' : ''}`}>
            <div className="search-bar">
              <Sparkles className="search-icon-left" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., A romantic oceanfront villa in Galle under $200..." 
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : <Search size={20} />}
              </button>
            </div>
            
            {!hasSearched && suggestions.length > 0 && (
              <div className="suggestions">
                <p>Try searching for:</p>
                <div className="suggestion-chips">
                  {suggestions.slice(0, 4).map((s, idx) => (
                    <button key={idx} type="button" className="chip" onClick={() => handleSuggestionClick(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </header>

      <main className="main-content">
        {loading && hasSearched && (
          <div className="state-container">
            <div className="ai-loader">
              <Sparkles className="pulse-icon" size={32} />
              <p>AI is analyzing millions of options...</p>
            </div>
          </div>
        )}

        {!loading && hasSearched && error && (
          <div className="state-container error">
            <p>{error}</p>
            <button className="primary-btn" onClick={handleSearch}>Try Again</button>
          </div>
        )}

        {!loading && hasSearched && !error && (
          <div className="results-container">
            <div className="results-header">
              <h3>We found {results.length} magical stays for you</h3>
              <p className="results-subtitle">Based on your query: "<span className="highlight-text">{query}</span>"</p>
            </div>
            
            {results.length === 0 ? (
              <div className="state-container empty">
                <Search className="empty-icon" size={48} />
                <p>We couldn't find any stays matching that description perfectly.</p>
                <button className="primary-btn mt-1" onClick={() => {setHasSearched(false); setQuery('');}}>Clear Search</button>
              </div>
            ) : (
              <div className="hotel-grid">
                {results.map((hotel, idx) => (
                  <div key={hotel._id || idx} className="hotel-card" onClick={() => openHotelModal(hotel)} style={{ animationDelay: `${idx * 0.05}s`}}>
                    <div className="hotel-image-wrapper">
                      <img 
                        src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                        alt={hotel.name} 
                        className="hotel-image" 
                      />
                      <button className="heart-btn" onClick={(e) => {e.stopPropagation();}}><Heart size={16}/></button>
                      <div className="hotel-price-badge">${hotel.pricePerNight}<span>/night</span></div>
                    </div>
                    
                    <div className="hotel-info">
                      <div className="hotel-meta">
                        <span className="hotel-category">{hotel.category}</span>
                        <div className="hotel-rating">
                          <Star className="star-filled" size={12} />
                          <span>{hotel.rating}</span>
                        </div>
                      </div>
                      
                      <h4 className="hotel-name">{hotel.name}</h4>
                      
                      <div className="hotel-location">
                        <MapPin size={14} className="location-icon" />
                        <span>{hotel.city}, {hotel.country}</span>
                      </div>
                      
                      <p className="hotel-desc-short">{hotel.description?.substring(0, 90)}...</p>
                      
                      <div className="hotel-amenities">
                        {hotel.amenities?.slice(0, 3).map((amenity, i) => (
                          <span key={i} className="amenity-tag">{amenity}</span>
                        ))}
                        {hotel.amenities?.length > 3 && (
                          <span className="amenity-tag">+{hotel.amenities.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedHotel && (
        <div className="modal-overlay" onClick={closeHotelModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeHotelModal}>
              <X size={24} />
            </button>
            
            <div className="modal-body">
              <div className="modal-image-container">
                <img 
                  src={`https://images.unsplash.com/photo-1551882547-ff40c0d5e9af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`} 
                  alt={selectedHotel.name} 
                  className="modal-image-large" 
                />
                <div className="modal-price-tag">
                  <span className="price-val">${selectedHotel.pricePerNight}</span>
                  <span className="price-unit">/night</span>
                </div>
              </div>
              
              <div className="modal-details">
                <div className="modal-header-info">
                  <div className="modal-title-area">
                    <h2>{selectedHotel.name}</h2>
                    <div className="modal-location-rating">
                      <span className="loc-span"><MapPin size={16} /> {selectedHotel.city}, {selectedHotel.country}</span>
                      <span className="rating-span">
                        {renderStars(selectedHotel.rating)} 
                        <span className="rating-val">({selectedHotel.rating})</span>
                      </span>
                    </div>
                  </div>
                  <button className="book-btn" onClick={() => navigate(`/checkout/${selectedHotel._id}`)}>Book Now</button>
                </div>
                
                <div className="modal-description">
                  <h3>About this place</h3>
                  <p>{selectedHotel.description}</p>
                </div>
                
                <div className="modal-features">
                  <div className="feature-item">
                    <Coffee className="feature-icon" />
                    <span>Breakfast</span>
                  </div>
                  <div className="feature-item">
                    <MapPin className="feature-icon" />
                    <span>City Center</span>
                  </div>
                  <div className="feature-item">
                    <BedDouble className="feature-icon" />
                    <span>Multiple Rooms</span>
                  </div>
                  <div className="feature-item">
                    <Calendar className="feature-icon" />
                    <span>Free Cancelation</span>
                  </div>
                </div>

                <div className="modal-amenities">
                  <h3>Amenities</h3>
                  <div className="amenities-list">
                    {selectedHotel.amenities?.map((amenity, i) => (
                      <span key={i} className="amenity-pill">{amenity}</span>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="similar-section">
                  <div className="similar-header">
                    <Sparkles className="sparkle-icon" size={20} />
                    <h3>Because you liked this</h3>
                  </div>
                  
                  {similarLoading ? (
                    <div className="similar-loading">
                      <div className="spinner"></div>
                    </div>
                  ) : similarHotels.length > 0 ? (
                    <div className="similar-grid">
                      {similarHotels.map(rec => (
                        <div 
                          key={rec._id} 
                          className="similar-card"
                          onClick={() => openHotelModal(rec)}
                        >
                          <img 
                            src={`https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`} 
                            className="similar-img"
                            alt={rec.name}
                          />
                          <div className="similar-info">
                            <h5 className="similar-name">{rec.name}</h5>
                            <div className="similar-rating">
                              <Star className="star-filled" size={12} /> <span>{rec.rating}</span>
                            </div>
                            <div className="similar-loc">
                              <MapPin size={12}/> <span>{rec.city}</span>
                            </div>
                            <div className="similar-price">${rec.pricePerNight}<span>/night</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-similar">No similar hotels found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/checkout/:hotelId" element={<CheckoutPage />} />
        </Routes>
      </Elements>
    </BrowserRouter>
  );
}

export default App;
