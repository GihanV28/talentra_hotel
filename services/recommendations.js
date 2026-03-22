import Hotel from '../models/Hotel.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getContentBasedRecommendations(hotelId, limit = 5) {
    try {
        const currentHotel = await Hotel.findById(hotelId);

        if (!currentHotel) {
        throw new Error('Hotel not found');
        }

        console.log('Current hotel details:', currentHotel);

        const priceLower = currentHotel.price * 0.8;
        const priceUpper = currentHotel.price * 1.2;
        
        const query = {
        _id: { $ne: hotelId },
        available: true,
        $or: [
            { city: currentHotel.city },
            { city: { $in: getNearbyAreas(currentHotel.city) } }
        ],
        price: {
            $gte: priceLower,
            $lte: priceUpper
        },
        rating: {
            $gte: currentHotel.rating - 0.5,
            $lte: currentHotel.rating + 0.5
        }
        };
        
        let candidates = await Hotel.find(query)
        .select('-__v')
        .limit(20);  // Initial pool
        
        console.log(`📊 Found ${candidates.length} candidate hotels`);
        
        candidates = candidates.map(hotel => {
        const score = calculateSimilarityScore(currentHotel, hotel.toObject());
        return {
            ...hotel.toObject(),
            similarityScore: score
        };
        });
        
        const recommendations = candidates
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
        
        console.log(`✅ Returning top ${recommendations.length} recommendations`);
        
        return recommendations;
        
  } catch (error) {
    console.error('Error in getContentBasedRecommendations:', error);
    throw error;
  }
}

function calculateSimilarityScore(hotel1, hotel2) {
  let score = 0;
  let maxScore = 0;
  
  maxScore += 30;
  if (hotel1.city === hotel2.city) {
    score += 30;
  } else if (getNearbyAreas(hotel1.city).includes(hotel2.city)) {
    score += 15;
  }
  
  maxScore += 25;
  const priceDiff = Math.abs(hotel1.price - hotel2.price);
  const priceScore = Math.max(0, 25 - (priceDiff / hotel1.price) * 25);
  score += priceScore;
  
  maxScore += 20;
  const ratingDiff = Math.abs(hotel1.rating - hotel2.rating);
  const ratingScore = Math.max(0, 20 - ratingDiff * 10);
  score += ratingScore;
  
  maxScore += 25;
  const amenitiesScore = calculateAmenitiesOverlap(
    hotel1.amenities || [],
    hotel2.amenities || []
  );
  score += amenitiesScore;
  
  return score / maxScore;
}

function calculateAmenitiesOverlap(amenities1, amenities2) {
  if (amenities1.length === 0 && amenities2.length === 0) {
    return 12.5;
  }
  
  const common = amenities1.filter(a => 
    amenities2.some(b => 
      b.toLowerCase().includes(a.toLowerCase()) ||
      a.toLowerCase().includes(b.toLowerCase())
    )
  );
  
  const union = new Set([...amenities1, ...amenities2]);
  const similarity = common.length / union.size;
  
  return similarity * 25;
}

function getNearbyAreas(city) {
  const areaMap = {
    'Colombo': ['Negombo', 'Mount Lavinia', 'Dehiwala'],
    'Galle': ['Hikkaduwa', 'Unawatuna', 'Bentota'],
    'Kandy': ['Nuwara Eliya', 'Matale', 'Dambulla'],
    'Negombo': ['Colombo', 'Ja-Ela'],
    'Bentota': ['Galle', 'Hikkaduwa', 'Kalutara']
  };
  
  return areaMap[city] || [];
}

export async function getPersonalizedRecommendations(userPreferences, limit = 5) {
  try {
    console.log('\n🎯 Generating personalized recommendations...\n');
    console.log('User preferences:', userPreferences);
    
    const systemPrompt = `You are a hotel recommendation assistant. Analyze user preferences and suggest hotels based on price, amenities, location, and vibe.

Return ONLY valid JSON:
{
  "criteria": {
    "priceRange": {"min": number, "max": number},
    "mustHaveAmenities": ["amenity1", "amenity2"],
    "preferredLocations": ["location1", "location2"],
    "hotelType": "luxury/budget/family/business/romantic"
  },
  "explanation": "brief explanation of recommendations"
}

Examples:

Preferences: "I love beach vacations and spas, budget around $200"
Response: {"criteria":{"priceRange":{"min":150,"max":200},"mustHaveAmenities":["beach","spa"],"preferredLocations":["Galle","Bentota","Negombo"],"hotelType":"relaxation"},"explanation":"Beach hotels with spa facilities"}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPreferences) }
      ],
      temperature: 0.4
    });
    
    const aiAnalysis = JSON.parse(response.choices[0].message.content);
    console.log('🤖 AI Analysis:', aiAnalysis);
    
    const query = {
      available: true
    };
    
    if (aiAnalysis.criteria.priceRange) {
      query.price = {
        $gte: aiAnalysis.criteria.priceRange.min,
        $lte: aiAnalysis.criteria.priceRange.max
      };
    }
    
    if (aiAnalysis.criteria.mustHaveAmenities?.length > 0) {
      query.amenities = { 
        $in: aiAnalysis.criteria.mustHaveAmenities 
      };
    }
    
    if (aiAnalysis.criteria.preferredLocations?.length > 0) {
      query.city = { 
        $in: aiAnalysis.criteria.preferredLocations 
      };
    }
    
    const hotels = await Hotel.find(query)
      .sort({ rating: -1 })
      .limit(limit)
      .select('-__v');
    
    return {
      recommendations: hotels,
      reasoning: aiAnalysis.explanation,
      criteria: aiAnalysis.criteria
    };
    
  } catch (error) {
    console.error('❌ Personalized recommendation error:', error);
    throw error;
  }
}