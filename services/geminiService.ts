import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

// Initialize blindly using process.env.API_KEY as per instructions
// Note: In a real client-side app, this key should be proxied, but per requirements we use env.
if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateAIResponse = async (prompt: string): Promise<string> => {
  if (!aiClient) {
    return "Error: API Key not configured for /ai command.";
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful chat assistant inside a legacy-style chat application called max99. Keep responses short, concise, and text-only (no markdown).",
      }
    });
    
    return response.text || "No response from AI.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI is currently unavailable. Try again later.";
  }
};