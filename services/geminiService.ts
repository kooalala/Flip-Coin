
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getLuckAnalysis = async (wins: number, losses: number, streak: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player has ${wins} wins and ${losses} losses, with a current streak of ${streak}. Provide a very short, witty comment about their luck as a coin flip master. Keep it under 15 words.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["message", "advice"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini failed:", error);
    return { 
      message: "The universe is silent today.", 
      advice: "Keep flipping to find your path." 
    };
  }
};
