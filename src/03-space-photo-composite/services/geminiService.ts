
import { GenerationRequest } from "../types";
import { generateImage } from "../../shared/imageGenerationService";

const generateSpatialDescription = (req: GenerationRequest): string => {
  const { camera, objects } = req;

  let layoutText = `SPATIAL LAYOUT & OBJECT PLACEMENT DATA (Derived from Top-Down Plan):\n`;
  layoutText += `Context: The viewer (Camera) is positioned at X:${Math.round(camera.x)}%, Y:${Math.round(camera.y)}% on the plan, facing ${Math.round(camera.rotation)}°.\n`;

  if (objects.length === 0) {
    layoutText += `- No specific objects added.\n`;
  } else {
    layoutText += `INSTRUCTIONS FOR INSERTING OBJECTS:\n`;
    objects.forEach(obj => {
      const dx = obj.x - camera.x;
      const dy = obj.y - camera.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angleRad = Math.atan2(dy, dx);
      let mapAngle = angleRad * (180 / Math.PI) + 90;
      if (mapAngle < 0) mapAngle += 360;
      let relativeAngle = mapAngle - camera.rotation;
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;

      let hPos = Math.abs(relativeAngle) < 15 ? "Center/Directly in front"
        : Math.abs(relativeAngle) > 160 ? "Behind the camera"
        : relativeAngle > 0 ? "Right side of the frame" : "Left side of the frame";

      let depthPos = dist < 20 ? "Immediate Foreground (Very Close)"
        : dist < 50 ? "Mid-Ground" : "Background (Far)";

      let detailString = "";
      if (obj.attributes && Object.keys(obj.attributes).length > 0) {
        detailString = `[Details: ${Object.entries(obj.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}]`;
      }

      layoutText += `- INSERT OBJECT: "${obj.type}" ${detailString}.\n  Placement: ${hPos}.\n  Depth: ${depthPos} (Distance ~${Math.round(dist)}%).\n`;
    });
  }
  return layoutText;
};

export const generateSynthesizedImage = async (request: GenerationRequest): Promise<string> => {
  const spatialPrompt = generateSpatialDescription(request);

  const prompt = `
    **Role**: Expert Architectural Visualizer & Photo Editor.
    **Task**: SYNTHESIZE a new composite image using the Source Image as the strict base.

    **CORE INSTRUCTION**: Keep the original room/landscape, perspective, and lighting exactly as is. Only INSERT new objects.

    **1. Source Context**: ${request.contextDescription || "Standard architectural/landscape scene."}

    **2. Atmosphere/Lighting**: ${request.atmosphereDescription || "Maintain original lighting coherence."}

    **3. Object Insertion List**:
    ${spatialPrompt}

    **4. Object Style**: ${request.objectPrompt ? `"${request.objectPrompt}"` : "Style realistically to match the scene."}

    Checklist: Insert objects at described positions and depths. Match scale, lighting, shadows. Output must look like a single authentic photograph.
  `;

  return await generateImage(prompt, 1024, 768, request.referenceImage || undefined);
};
