
import { GoogleGenAI } from "@google/genai";
import { GenerationRequest } from "../types";

const getAI = (): GoogleGenAI => {
  const key = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey: key });
};

// Helper to convert normalized coordinates to descriptive text
const generateSpatialDescription = (req: GenerationRequest): string => {
  const { camera, objects } = req;
  
  let layoutText = `SPATIAL LAYOUT & OBJECT PLACEMENT DATA (Derived from Top-Down Plan):\n`;
  layoutText += `Context: The viewer (Camera) is positioned at X:${Math.round(camera.x)}%, Y:${Math.round(camera.y)}% on the plan, facing ${Math.round(camera.rotation)}°.\n`;
  
  if (objects.length === 0) {
    layoutText += `- No specific objects added.\n`;
  } else {
    layoutText += `INSTRUCTIONS FOR INSERTING OBJECTS:\n`;
    objects.forEach(obj => {
      // Calculate relative position roughly for the AI context
      const dx = obj.x - camera.x;
      const dy = obj.y - camera.y;
      const dist = Math.sqrt(dx*dx + dy*dy); // Distance percentage 0-141
      
      // Calculate angle from camera to object
      // SVG/Web coords: Y increases down.
      // angle in rads from positive x axis (Right)
      const angleRad = Math.atan2(dy, dx); 
      let angleDeg = angleRad * (180 / Math.PI);
      
      // Convert to Map rotation (0=Up) to match camera rotation
      // Web: 0=Right, 90=Down. 
      // Map: 0=Up, 90=Right.
      // MapDeg = WebDeg + 90
      let mapAngle = angleDeg + 90;
      if (mapAngle < 0) mapAngle += 360;

      // Relative angle to camera view
      let relativeAngle = mapAngle - camera.rotation;
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;
      
      // Horizontal Position Description
      let hPos = "";
      if (Math.abs(relativeAngle) < 15) hPos = "Center/Directly in front";
      else if (Math.abs(relativeAngle) > 160) hPos = "Behind the camera (likely not visible unless wide angle)";
      else if (relativeAngle > 0) hPos = "Right side of the frame";
      else hPos = "Left side of the frame";

      // Depth Description
      let depthPos = "";
      if (dist < 20) depthPos = "Immediate Foreground (Very Close)";
      else if (dist < 50) depthPos = "Mid-Ground";
      else depthPos = "Background (Far)";

      // Format Attributes
      let detailString = "";
      if (obj.attributes && Object.keys(obj.attributes).length > 0) {
        const details = Object.entries(obj.attributes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        detailString = `[Details: ${details}]`;
      }

      layoutText += `- INSERT OBJECT: "${obj.type}" ${detailString}.\n  Placement: ${hPos}.\n  Depth: ${depthPos} (Distance ~${Math.round(dist)}%).\n`;
    });
  }
  return layoutText;
};

export const generateSynthesizedImage = async (request: GenerationRequest): Promise<string> => {
  try {
    const spatialPrompt = generateSpatialDescription(request);
    
    // Prompt engineered for "Editing/Synthesis" rather than "Generation from scratch"
    const prompt = `
      **Role**: Expert Architectural Visualizer & Photo Editor.
      **Task**: SYNTHESIZE a new composite image using the attached Source Image as the strict base.
      
      **CORE INSTRUCTION**: 
      Do NOT generate a new room or environment. You must KEEP the original room/landscape, perspective, and lighting of the Source Image exactly as is. 
      You are only allowed to INSERT new objects into this existing space.
      
      **1. Source Context**:
      ${request.contextDescription || "Standard architectural/landscape scene."}
      
      **2. Atmosphere/Lighting Adjustment**:
      ${request.atmosphereDescription || "Maintain original lighting coherence."}
      (Ensure any new objects cast shadows consistent with the original image's light sources).
      
      **3. Object Insertion List (Strict Spatial Adherence)**:
      ${spatialPrompt}

      **4. User Specific Object Prompts**:
      ${request.objectPrompt ? `Apply these specific style/visual instructions to the inserted objects: "${request.objectPrompt}"` : "Style the objects realistically to match the scene."}
      
      **Execution Checklist**:
      - [ ] Identify the perspective grid of the Source Image.
      - [ ] Insert the objects listed above into the Source Image at the described positions (Left/Right/Center) and Depths (Foreground/Background).
      - [ ] PAY CLOSE ATTENTION to the "Details" provided for each object, ESPECIALLY Tree Species (e.g. Banyan, Pine, Palm) and render their specific biological characteristics (bark, leaf shape) accurately.
      - [ ] Scale objects correctly according to the perspective depth.
      - [ ] Blend objects using correct lighting, shadows, and color grading to match the Source Image perfectly.
      - [ ] The output must look like a single, authentic photograph.
    `;

    const parts: any[] = [];
    
    // Add reference image if available
    if (request.referenceImage) {
      // Strip prefix if present (e.g., "data:image/png;base64,")
      const cleanBase64 = request.referenceImage.split(',')[1] || request.referenceImage;
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg', 
        },
      });
    }

    parts.push({ text: prompt });

    // Use gemini-2.5-flash-image for multimodal editing capabilities
    const modelId = 'gemini-2.5-flash-image'; 

    const response = await getAI().models.generateContent({
      model: modelId,
      contents: { parts },
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from Gemini.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
