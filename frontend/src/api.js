export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const aiSearch = async (query) => {
  try {
    const response = await fetch(`${API_URL}/search/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return await response.json();
  } catch (error) {
    console.error("AI Search Error:", error);
    return { success: false, error: error.message };
  }
};

export const fetchSuggestions = async () => {
  try {
    const response = await fetch(`${API_URL}/search/suggestions`);
    return await response.json();
  } catch (error) {
    console.error("Suggestions Error:", error);
    return { success: false, suggestions: [] };
  }
};

export const fetchSimilarHotels = async (hotelId) => {
  try {
    const response = await fetch(`${API_URL}/recommendations/similar/${hotelId}?limit=4`);
    return await response.json();
  } catch (error) {
    console.error("Similar Hotels Error:", error);
    return { success: false, error: error.message };
  }
};
