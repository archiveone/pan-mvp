import { GoogleGenAI } from "@google/genai";

// Ensure you have your API key set in your environment variables
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

export async function generateListingDescription(title: string, tags: string[]): Promise<string> {
  if (!ai) {
    return "AI service is currently unavailable. Please write a description manually.";
  }
  
  try {
    const prompt = `Write a short, appealing marketplace description for a product titled "${title}". 
    Incorporate these themes if possible: ${tags.join(', ')}.
    Keep the description under 40 words and make it sound exciting for potential buyers. Do not use hashtags.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.8,
            // FIX: Per Gemini API guidelines, when using maxOutputTokens with gemini-2.5-flash,
            // a thinkingBudget must be set to reserve tokens for the final output.
            maxOutputTokens: 100,
            thinkingConfig: { thinkingBudget: 40 },
        }
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "There was an error generating the description. Please try again or write one manually.";
  }
}