import express from 'express';
import {
  summarizeReviews,
  analyzeSentiment,
  generateReviewResponse
} from '../services/reviewAnalyzer.js';

const router = express.Router();

router.post('/summarize/:hotelId', async (req, res) => {
  try {
    const { reviews } = req.body;
    
    if (!reviews || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No reviews provided'
      });
    }
    
    const summary = await summarizeReviews(reviews);
    
    res.json({
      success: true,
      reviewCount: reviews.length,
      summary: summary
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to summarize reviews'
    });
  }
});

router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { reviewText } = req.body;
    
    if (!reviewText) {
      return res.status(400).json({
        success: false,
        error: 'Review text is required'
      });
    }
    
    const analysis = await analyzeSentiment(reviewText);
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment'
    });
  }
});


router.post('/generate-response', async (req, res) => {
  try {
    const { review, hotelName } = req.body;
    
    if (!review || !hotelName) {
      return res.status(400).json({
        success: false,
        error: 'Review and hotel name are required'
      });
    }
    
    const response = await generateReviewResponse(review, hotelName);
    
    res.json({
      success: true,
      response: response
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate response'
    });
  }
});

export default router;