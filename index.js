require('dotenv').config();
import { post } from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

const prompt = "Explain how AI works";


async function getGeminiResponse(prompt) {
  try {
    const response = await post(
      GEMINI_API_URL,
      {
        prompt,
        "temperature": 0.7, 
        "max_tokens": 150, 
        "top_p": 0.9, 
        "stop": ["\n"] 
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Response from Gemini API:", response.data);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }
}


getGeminiResponse(prompt);