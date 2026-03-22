import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateHotelDescription(hotelData) {
  try {
    console.log(`\n Generating description for: ${hotelData.name}\n`);

    const context = `
Hotel Name: ${hotelData.name}
Location: ${hotelData.city || 'Sri Lanka'}
Price per night: Rs. ${hotelData.price}
Rating: ${hotelData.rating}/5
Amenities: ${hotelData.amenities?.join(', ') || 'Standard amenities'}
Number of rooms: ${hotelData.rooms || 'Multiple rooms'}
    `.trim();

    const systemPrompt = `You are a creative hotel marketing copywriter.

Hotel details are provided. Write an attractive, engaging hotel description.

Requirements:
- 2-3 paragraphs (150-200 words)
- Highlight unique features
- Use sensory language (sight, sound, touch)
- Include location benefits
- End with a call to action
- Sound natural, not robotic
- Professional but warm tone
- No exaggeration or false claims

Format: Plain text, no markdown`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const description = response.choices[0].message.content.trim();

    console.log('✅ Description generated!');
    return description;
  } catch (error) {
    console.error('❌ Description generation error:', error);
    throw error;
  }
}


export async function generateDescriptionVariations(hotelData, count = 3) {
  try {
    console.log(`\n Generating ${count} description variations...\n`);
    
    const variations = [];
    
    // Different tones for different variations
    const tones = ['professional', 'casual-friendly', 'luxury-elegant'];
    
    for (let i = 0; i < count; i++) {
      const tone = tones[i] || 'professional';
      
      const context = `
Hotel: ${hotelData.name}
City: ${hotelData.city}
Price: Rs. ${hotelData.price}/night
Amenities: ${hotelData.amenities?.join(', ')}
      `.trim();
      
      const systemPrompt = `Write a ${tone} hotel description.
      
Style: ${tone}
Length: 100-150 words
Format: 2 paragraphs

Make it sound ${tone === 'professional' ? 'polished and formal' : 
                 tone === 'casual-friendly' ? 'warm and inviting' :
                 'sophisticated and elegant'}.`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        temperature: 0.8,
        max_tokens: 250
      });
      
      variations.push({
        tone: tone,
        description: response.choices[0].message.content.trim()
      });
    }
    
    console.log(`✅ Generated ${variations.length} variations!`);
    return variations;
    
  } catch (error) {
    console.error('❌ Variations generation error:', error);
    throw error;
  }
}

export async function improveDescription(description) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a master copywriter. Rewrite the following description to be much more engaging, professional, and grammatically correct.' },
        { role: 'user', content: description }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Improve description error:', error);
    throw error;
  }
}