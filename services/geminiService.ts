import { GoogleGenAI } from "@google/genai";
import { CustomDealStage } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Auto-tagging feature will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const analyzeNoteForDealStage = async (noteText: string, customDealStages: CustomDealStage[]): Promise<string | null> => {
  if (!API_KEY || customDealStages.length === 0) return null;

  try {
    const stageNames = customDealStages.map(s => s.name);
    // Gemini works best if we give it the most important stages first.
    // We reverse the array assuming the user orders them from start to finish.
    const stagePriority = [...stageNames].reverse();

    const prompt = `
      Analyze the following text from a real estate broker's call note. 
      Your task is to identify if the note implies a specific deal stage for the contact.
      The possible deal stages are: ${stageNames.join(', ')}.
      
      RULES:
      - Respond with ONLY the deal stage name if it is strongly implied.
      - If no stage is clearly implied, respond with "None".
      - Prioritize the stage based on this order (highest to lowest): ${stagePriority.join(' > ')}. For example, if both 'LOI' and 'Contract' are mentioned, 'Contract' is the correct stage.
      - "sent LOI" or "letter of intent" maps to "LOI".
      - "under contract" or "signed contract" maps to "Contract".
      - "CCO received" or "closing" maps to "CCO".
      - "showings" or "touring" maps to "Showings".
      
      Note Text: "${noteText}"
      
      Suggested Deal Stage:
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text.trim();

    if (stageNames.includes(text)) {
      return text;
    }
    
    return null;
  } catch (error) {
    console.error("Error analyzing note with Gemini API:", error);
    return null;
  }
};