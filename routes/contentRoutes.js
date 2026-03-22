import express from 'express';
import Hotel from '../models/Hotel.js';
import {
  generateHotelDescription,
  generateDescriptionVariations,
  improveDescription
} from '../services/contentGenerator.js';

const router = express.Router();

/**
 * @swagger
 * /api/content/generate-description:
 *   post:
 *     summary: Generate a hotel description using AI
 *     tags: [Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *                 description: Hotel name
 *               city:
 *                 type: string
 *                 description: Hotel city
 *               additionalData:
 *                 type: object
 *                 description: Additional hotel data
 *     responses:
 *       200:
 *         description: Description generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 description:
 *                   type: string
 *       400:
 *         description: Hotel name and city are required
 *       500:
 *         description: Failed to generate description
 */
router.post('/generate-description', async (req, res) => {
  try {
    const hotelData = req.body;
    
    // Validation
    if (!hotelData.name || !hotelData.city) {
      return res.status(400).json({
        success: false,
        error: 'Hotel name and city are required'
      });
    }
    
    const description = await generateHotelDescription(hotelData);
    
    res.json({
      success: true,
      description: description
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate description'
    });
  }
});

/**
 * @swagger
 * /api/content/generate-variations/{hotelId}:
 *   post:
 *     summary: Generate multiple description variations for a hotel
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the hotel
 *     responses:
 *       200:
 *         description: Variations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 variations:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Failed to generate variations
 */
router.post('/generate-variations/:hotelId', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }
    
    const variations = await generateDescriptionVariations(hotel.toObject());
    
    res.json({
      success: true,
      variations: variations
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate variations'
    });
  }
});


/**
 * @swagger
 * /api/content/improve-description/{hotelId}:
 *   put:
 *     summary: Improve an existing hotel description using AI
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the hotel
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               save:
 *                 type: boolean
 *                 description: Whether to save the improved description to database
 *     responses:
 *       200:
 *         description: Description improved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 original:
 *                   type: string
 *                 improved:
 *                   type: string
 *                 saved:
 *                   type: boolean
 *       404:
 *         description: Hotel not found
 *       400:
 *         description: Hotel has no existing description
 *       500:
 *         description: Failed to improve description
 */
router.put('/improve-description/:hotelId', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }
    
    if (!hotel.description) {
      return res.status(400).json({
        success: false,
        error: 'Hotel has no existing description'
      });
    }
    
    const improved = await improveDescription(hotel.description);
    
    // Optionally update database
    if (req.body.save === true) {
      hotel.description = improved;
      await hotel.save();
    }
    
    res.json({
      success: true,
      original: hotel.description,
      improved: improved,
      saved: req.body.save === true
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to improve description'
    });
  }
});

export default router;