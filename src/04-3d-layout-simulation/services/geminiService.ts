
import { ViewStyle, AspectRatio } from "../types";
import { generateImage } from "../../shared/imageGenerationService";

export const generate3DView = async (
  annotatedImageBase64: string,
  style: ViewStyle,
  userPrompt: string,
  cameraHeight: number,
  cameraPitch: number,
  ratio: AspectRatio
): Promise<string> => {
  const [w, h] = ratio.split(':').map(Number);
  const width = 1024;
  const height = Math.round(1024 * h / w);

  const textPrompt = `
    You are an expert Architectural Visualization AI.

    TASK: Generate a "First-Person Perspective (FPV)" view from inside the scene.

    **CRITICAL NEGATIVE CONSTRAINTS (MUST FOLLOW):**
    - DO NOT generate a floor plan.
    - DO NOT generate a top-down view.
    - DO NOT generate an isometric view.
    - Output MUST be a perspective view (3D render).

    INPUT MAP DECODING:
    1. **RED DOT**: This is the EXACT camera position (The lens).
    2. **RED ARROW & "LOOK THIS WAY"**: This is the optical axis of the camera. You MUST look in this direction.

    STRICT POSITIONING RULES (GHOST MODE):
    - **IGNORE PHYSICS**: You are a virtual camera.
    - If the Red Dot is on a Swimming Pool, you are standing ON the water surface.
    - If the Red Dot is on a Garden Bed, you are standing ON the dirt/plants.
    - If the Red Dot is in a Wall, you are embedded in the wall looking out.
    - **DO NOT MOVE**: Stay exactly at the coordinate of the Red Dot.

    CAMERA PARAMETERS:
    - **Height**: ${cameraHeight} cm (from the floor level at that specific point).
    - **Pitch**: ${cameraPitch} degrees (0 is level, positive is looking up, negative is looking down).
    - **FOV**: Wide Angle (approx 24mm lens equivalent).

    RENDERING STYLE:
    - Style: ${style}.
    - Scene Details: ${userPrompt}
    - The output image should be clean (NO red overlays, NO text labels from the input).
  `;

  return await generateImage(textPrompt, width, height, annotatedImageBase64);
};
