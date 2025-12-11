import { GoogleGenAI, Type } from "@google/genai";
import { Resolution, AspectRatio, ProcessingMode, BoundingBox } from '../types';

const STORAGE_KEY = 'ungrid_api_key';

// Helper to get key from either local storage (manual) or environment (Google auth)
export const getStoredApiKey = () => localStorage.getItem(STORAGE_KEY);
export const setStoredApiKey = (key: string) => localStorage.setItem(STORAGE_KEY, key);

export const hasValidKey = () => {
  const manual = getStoredApiKey();
  const env = process.env.API_KEY;
  return !!(manual || env);
};

const getClient = () => {
  const apiKey = getStoredApiKey() || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  return new GoogleGenAI({ apiKey });
};

export const detectPanels = async (base64Image: string): Promise<BoundingBox[]> => {
  if (base64Image.startsWith('blob:')) {
    throw new Error("Invalid Format: detectPanels received a blob URL. It requires a Base64 Data URL.");
  }

  const data = base64Image.split(',')[1] || base64Image;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data } },
          { text: "Detect the bounding boxes of all distinct panels in this image. Return a JSON object with a 'panels' array containing objects with 'ymin', 'xmin', 'ymax', 'xmax' where the values are integers from 0 to 1000 representing the relative position." }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            panels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.INTEGER },
                  xmin: { type: Type.INTEGER },
                  ymax: { type: Type.INTEGER },
                  xmax: { type: Type.INTEGER },
                },
                required: ['ymin', 'xmin', 'ymax', 'xmax'],
              },
            },
          },
        },
      }
    });

    let text = response.text || '{}';
    // Remove markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const json = JSON.parse(text);
    return json.panels || [];
  } catch (error) {
    console.error("Gemini Detect Panels Error:", error);
    throw error;
  }
};

export const describeImage = async (base64Image: string): Promise<string> => {
  const data = base64Image.split(',')[1] || base64Image;
  
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: data
            }
          },
          {
            text: "Provide a concise, detailed visual description of this image panel. Focus on the main subject and style."
          }
        ]
      }
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Describe Error:", error);
    throw error;
  }
};

export const reimagineImage = async (
  base64Image: string, 
  resolution: Resolution, 
  aspectRatio: AspectRatio, 
  mode: ProcessingMode
): Promise<string> => {
  
  const generate = async () => {
    const data = base64Image.split(',')[1] || base64Image;

    // Define Prompts based on mode
    let prompt = "";
    if (mode === 'fidelity') {
        prompt = `Create a high-fidelity copy of this image. 
        Strictly preserve the original colors, lighting, exposure, and artistic style. 
        Do not add new details, do not change the texture, and do not "improve" the image. 
        The goal is a faithful, sharp reproduction of the input image at ${resolution} resolution.`;
    } else {
        prompt = `Create a high-fidelity version of this image. 
        Maintain the exact composition and pose, but enhance details, lighting, and texture to professional studio quality. 
        Optimize color grading for a premium look at ${resolution} resolution.`;
    }

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      // Send Image FIRST, then Text. Use explicit array structure.
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: data
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        imageConfig: {
          imageSize: resolution,
          aspectRatio: aspectRatio
        }
      }
    });

    // Extract image or capture refusal text
    let refusalText = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        refusalText += part.text;
      }
    }
    
    // If no image was found, throw an error with the text content (if any)
    const errorMsg = refusalText ? `Model Refusal: ${refusalText.substring(0, 200)}` : "No image generated by Gemini.";
    throw new Error(errorMsg);
  };

  try {
    return await generate();
  } catch (error: any) {
    console.error("Gemini Re-imagine Error:", error);
    throw error;
  }
};