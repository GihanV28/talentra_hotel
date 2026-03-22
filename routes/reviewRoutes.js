import express from 'express';
import {
  summarizeReviews,
  analyzeSentiment,
  generateReviewResponse
} from '../services/reviewAnalyzer.js';

const router = express.Router();

/**
 * @swagger
 * /api/reviews/summarize/{hotelId}:
 *   post:
 *     summary: Summarize multiple reviews for a hotel using AI
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviews
 *             properties:
 *               reviews:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of review texts
 *     responses:
 *       200:
 *         description: Reviews summarized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reviewCount:
 *                   type: integer
 *                 summary:
 *                   type: string
 *       400:
 *         description: No reviews provided
 *       500:
 *         description: Failed to summarize reviews
 */
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

/**
 * @swagger
 * /api/reviews/analyze-sentiment:
 *   post:
 *     summary: Analyze the sentiment of a review text
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewText
 *             properties:
 *               reviewText:
 *                 type: string
 *                 description: The review text to analyze
 *     responses:
 *       200:
 *         description: Sentiment analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, neutral]
 *                     score:
 *                       type: number
 *                     confidence:
 *                       type: number
 *       400:
 *         description: Review text is required
 *       500:
 *         description: Failed to analyze sentiment
 */
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


/**
 * @swagger
 * /api/reviews/generate-response:
 *   post:
 *     summary: Generate an appropriate response to a customer review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *               - hotelName
 *             properties:
 *               review:
 *                 type: string
 *                 description: The customer review text
 *               hotelName:
 *                 type: string
 *                 description: Name of the hotel
 *     responses:
 *       200:
 *         description: Response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 response:
 *                   type: string
 *       400:
 *         description: Review and hotel name are required
 *       500:
 *         description: Failed to generate response
 */
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