import OpenAI from "openai";
import dotenv, { config } from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseSearchQuery(naturalQuery) {
    try {
        console.log("Parsing search query:", naturalQuery);

        const systemPrompt = `You are an assistant that searches hotels.
        Return ONLY valid JSON in this exact format (no extra text):
        {
        "location": "city or area name (null if not mentioned)",
        "minPrice": "number or null",
        "maxPrice": "number or null", 
        "amenities": ["pool", "spa", "wifi", etc.],
        "vibe": "luxury/budget/family/romantic/business/etc.",
        "roomType": "single/double/suite/etc. or null",
        "dates": null
        }

        Price interpretation:
        - "cheap/budget" → maxPrice: 100
        - "affordable" → maxPrice: 150
        - "mid-range" → minPrice: 150, maxPrice: 300
        - "expensive/luxury" → minPrice: 300

        Location extraction:
        - Extract city names, beach areas, landmarks
        - If user says "near beach" → extract as location info

        Amenities extraction:
        - Common: pool, spa, gym, wifi, parking, restaurant
        - Kids: playground, kids pool, babysitting
        - Business: conference room, business center

        Examples:

        Query: "Find cheap hotel in Colombo"
        Response: {"location":"Colombo","minPrice":null,"maxPrice":100,"amenities":[],"vibe":"budget","roomType":null,"dates":null}

        Query: "Luxury hotel with spa and pool in Kandy"
        Response: {"location":"Kandy","minPrice":300,"maxPrice":null,"amenities":["spa","pool"],"vibe":"luxury","roomType":null,"dates":null}

        Query: "Family-friendly hotel near beach under $200"
        Response: {"location":"beach","minPrice":null,"maxPrice":200,"amenities":[],"vibe":"family","roomType":null,"dates":null}.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: naturalQuery }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        const aiResponse = response.choices[0].message.content.trim();
        console.log("AI Response:", aiResponse);

        let cleanedResponse = aiResponse;
        if (cleanedResponse.startsWith("```json")) {
            cleanedResponse = cleanedResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        }
        
        const parsedParams = JSON.parse(cleanedResponse);
        console.log("Parsed Parameters:", parsedParams);
        return parsedParams;

    } catch (error) {
        console.error("Error parsing search query:", error);
        return {
            location: null,
            minPrice: null,
            maxPrice: null,
            amenities: [],
            vibe: null,
            roomType: null,
            dates: null
        };
    }
}

export function buildDatabaseQuery(params) {
    const dbQuery = {};

    if (params.location) {
        if (params.location.toLowerCase().includes("beach") || 
            params.location.toLowerCase().includes("ocean") ||
            params.location.toLowerCase().includes("coastal")) {
        
        dbQuery.$or = [
            { city: new RegExp('Galle|Negombo|Bentota|Hikkaduwa|Mirissa', 'i') },
            { amenities: { $in: ["beachfront", "ocean view", "beach access"] } },
            { description: new RegExp('beach|ocean|coastal|sea', 'i') }
        ];

        } else {
            dbQuery.city = new RegExp(params.location, 'i');
        }
    }

    if (params.minPrice || params.maxPrice) {
        dbQuery.price = {};
        if (params.minPrice) {
            dbQuery.price.$gte = params.minPrice;
        }
        if (params.maxPrice) {
            dbQuery.price.$lte = params.maxPrice;
        }
    }

    if (params.amenities && params.amenities.length > 0) {
        dbQuery.amenities = { $in: params.amenities };
    }

    if (params.vibe) {
        dbQuery.vibe = new RegExp(params.vibe, 'i');
    }

    dbQuery.available = true;

    console.log("Constructed Database Query:", JSON.stringify(dbQuery, null, 2));
    return dbQuery;
}