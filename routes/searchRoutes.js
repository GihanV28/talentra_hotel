import express from 'express';
import Hotel from '../models/Hotel.js';
import { parseSearchQuery, buildDatabaseQuery } from '../services/aiSearch.js';

const router = express.Router();

/**
 * POST /api/search/ai
 * Natural language hotel search
 */
router.post('/ai', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query string is required'
      });
    }
    
    console.log(`\n🔍 AI Search Request: "${query}"\n`);
    
    // Step 1: Parse natural language query AI එකෙන්
    const parsedParams = await parseSearchQuery(query);
    
    // Step 2: Build MongoDB query
    const dbQuery = buildDatabaseQuery(parsedParams);
    
    // Step 3: Execute database query
    const hotels = await Hotel.find(dbQuery)
      .sort({ rating: -1 })  // Highest rated first
      .limit(20)
      .select('-__v');  // Exclude version field
    
    // Step 4: Send response
    res.json({
      success: true,
      query: query,
      parsedParams: parsedParams,
      count: hotels.length,
      results: hotels
    });
    
  } catch (error) {
    console.error('❌ AI Search Error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed. Please try again.'
    });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions/examples
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    "Find me a cheap hotel in Colombo",
    "Luxury hotel with spa in Kandy",
    "Family-friendly beach hotel under $200",
    "Budget hotel near airport",
    "Romantic hotel with ocean view",
    "Business hotel with conference room in Galle"
  ];
  
  res.json({
    success: true,
    suggestions: suggestions
  });
});

export default router;