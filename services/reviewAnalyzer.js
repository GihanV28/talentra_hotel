import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function summarizeReviews(reviews) {
  try {
    console.log(`\n📊 Summarizing ${reviews.length} reviews...\n`);
    
    const reviewTexts = reviews.map((review, index) => 
      `Review ${index + 1} (${review.rating}/5): ${review.comment}`
    ).join('\n\n');
    
    const systemPrompt = `You are a hotel review analyst.

Multiple hotel reviews are provided. Create a concise summary.

Output format (valid JSON only):
{
  "summary": "2-3 sentence overall summary",
  "pros": ["positive point 1", "positive point 2", "positive point 3"],
  "cons": ["negative point 1", "negative point 2"],
  "overallSentiment": "positive/neutral/negative",
  "recommendationRate": number (0-100),
  "commonThemes": ["theme1", "theme2", "theme3"]
}

Rules:
- Focus on most frequently mentioned points
- Be objective and balanced
- Mention specific features (location, staff, amenities, etc.)
- If mostly positive reviews, say so
- If mostly negative, mention that too`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reviewTexts }
      ],
      temperature: 0.4,
      max_tokens: 500
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    
    console.log('✅ Review summary generated!');
    return analysis;
    
  } catch (error) {
    console.error('❌ Review summarization error:', error);
    throw error;
  }
}

export async function analyzeSentiment(reviewText) {
  try {
    const systemPrompt = `Analyze the sentiment of this hotel review.

Return JSON:
{
  "sentiment": "positive/neutral/negative",
  "score": number (-1 to 1, where -1 is very negative, 1 is very positive),
  "aspects": {
    "location": score,
    "cleanliness": score,
    "staff": score,
    "value": score
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reviewText }
      ],
      temperature: 0.2
    });
    
    return JSON.parse(response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);
    throw error;
  }
}

export async function generateReviewResponse(review, hotelName) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `You are the manager of ${hotelName}. Write a polite, professional response to the following customer review.` },
        { role: 'user', content: review }
      ],
      temperature: 0.7,
      max_tokens: 250
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Generate review response error:', error);
    throw error;
  }
}
