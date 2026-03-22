import express from 'express';
import Hotel from '../models/Hotel.js';
import {
  generateHotelDescription,
  generateDescriptionVariations,
  improveDescription
} from '../services/contentGenerator.js';

const router = express.Router();

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