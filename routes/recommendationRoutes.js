import express from 'express';
import { 
  getContentBasedRecommendations, 
  getPersonalizedRecommendations 
} from '../services/recommendations.js';

const router = express.Router();

/**
 * @swagger
 * /api/recommendations/similar/{hotelId}:
 *   get:
 *     summary: Get hotels similar to the specified hotel
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the hotel
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: Similar hotels returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to get recommendations
 */
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

/**
 * @swagger
 * /api/recommendations/personalized:
 *   post:
 *     summary: Get personalized hotel recommendations
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: User preferences object
 *     responses:
 *       200:
 *         description: Personalized recommendations returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *                 explanation:
 *                   type: string
 *       500:
 *         description: Failed to get personalized recommendations
 */
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