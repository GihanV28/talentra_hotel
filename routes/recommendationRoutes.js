import express from 'express';
import { 
  getContentBasedRecommendations, 
  getPersonalizedRecommendations 
} from '../services/recommendations.js';

const router = express.Router();

router.get('/similar/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`\n📋 Similar hotels request for: ${hotelId}\n`);
    
    const recommendations = await getContentBasedRecommendations(
      hotelId, 
      limit
    );
    
    res.json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.message === 'Hotel not found') {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

router.post('/personalized', async (req, res) => {
  try {
    const userPreferences = req.body;
    
    console.log('\n🎯 Personalized recommendations request\n');
    
    const result = await getPersonalizedRecommendations(userPreferences);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalized recommendations'
    });
  }
});

export default router;