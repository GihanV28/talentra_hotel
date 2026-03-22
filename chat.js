import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chatWithAI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const userInput = await new Promise((resolve) => {
      rl.question("Enter your message: ", resolve);
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
            role: "user",
            content: userInput }],
        });

    const aiResponse = response.choices[0].message.content;
    console.log("AI Response:", aiResponse);
    } catch (error) {
        console.error("Error occurred while chatting with AI:", error);
        throw error;
    } finally {
      rl.close();
    }
}

chatWithAI();