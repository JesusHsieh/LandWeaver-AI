
import { GoogleGenAI } from "@google/genai";
import { ViewStyle, AspectRatio } from "../types";

const getAI = (): GoogleGenAI => {
  const key = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates a 3D view based on an annotated floor plan.
 */
export const generate3DView = async (
  annotatedImageBase64: string,
  style: ViewStyle,
  userPrompt: string,
  cameraHeight: number, // cm
  cameraPitch: number,   // degrees
  ratio: AspectRatio
): Promise<string> => {
  try {
    const base64Data = annotatedImageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Construct a strong prompt for the Vision model
    const textPrompt = `
      You are an expert Architectural Visualization AI.
      
      TASK:
      Generate a "First-Person Perspective (FPV)" view from inside the scene.
      
      **CRITICAL NEGATIVE CONSTRAINTS (MUST FOLLOW):**
      - DO NOT generate a floor plan.
      - DO NOT generate a top-down view.
      - DO NOT generate an isometric view.
      - DO NOT generate a map.
      - Output MUST be a perspective view (3D render).

      INPUT MAP DECODING:
      1. **RED DOT**: This is the EXACT camera position (The lens).
      2. **RED ARROW & "LOOK THIS WAY"**: This is the optical axis of the camera. You MUST look in this direction.

      STRICT POSITIONING RULES (GHOST MODE):
      - **IGNORE PHYSICS**: You are a virtual camera. 
      - If the Red Dot is on a **Swimming Pool**, you are standing ON the water surface.
      - If the Red Dot is on a **Garden Bed**, you are standing ON the dirt/plants.
      - If the Red Dot is in a **Wall**, you are embedded in the wall looking out.
      - **DO NOT MOVE**: Do NOT snap to the nearest "walkable" path. Stay exactly at the coordinate of the Red Dot.
      
      CAMERA PARAMETERS:
      - **Height**: ${cameraHeight} cm (from the floor level at that specific point).
      - **Pitch**: ${cameraPitch} degrees (0 is level, positive is looking up, negative is looking down).
      - **FOV**: Wide Angle (approx 24mm lens equivalent).
      
      RENDERING STYLE:
      - Style: ${style}. 
      - Scene Details: ${userPrompt}
      - The output image should be clean (NO red overlays, NO text labels from the input).
    `;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            text: textPrompt,
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: ratio
        }
      }
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};