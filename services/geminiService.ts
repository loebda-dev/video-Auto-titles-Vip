
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key is missing. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion, error handled in App.tsx

export async function analyzeVideoFrame(base64Frame: string, userPrompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming JPEG from canvas.toDataURL('image/jpeg')
        data: base64Frame.split(',')[1], // Remove "data:image/jpeg;base64," prefix
      },
    };

    const textPart = {
      text: userPrompt,
    };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        // No thinkingConfig, use default for better quality suggestions
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text content in Gemini API response.');
    }
    return text.trim();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
        // Check for specific API error messages if available from the SDK
        if (error.message.includes('API key not valid')) {
            throw new Error('Invalid Gemini API Key. Please check your configuration.');
        }
        throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the Gemini API.');
  }
}
