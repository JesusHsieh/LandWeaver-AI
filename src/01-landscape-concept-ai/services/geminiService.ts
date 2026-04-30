
import { RenderStyle, Shape, ToolMode, PathMaterial, BackgroundType } from "../types";
import { PATH_MATERIAL_COLORS } from "../utils";
import { generateImage, getImageProvider } from "../../shared/imageGenerationService";

export const generateLandscapePlan = async (
  sketchImageBase64: string,
  styleRefImageBase64: string | null,
  style: RenderStyle,
  backgroundType: BackgroundType,
  customPrompt: string,
  width: number,
  height: number,
  shapes: Shape[]
): Promise<string> => {


  const stylePrompts: Record<RenderStyle, string> = {
    [RenderStyle.REALISTIC]: "Top-down aerial view, photorealistic landscape architecture render. High fidelity textures, ray-traced shadows, natural lighting. 8k resolution.",
    [RenderStyle.CAD]: "Professional architectural site plan. Clean 2D technical drawing, crisp lines, white background, standard CAD hatching patterns.",
    [RenderStyle.BUBBLE_DIAGRAM]: "Architectural Concept Bubble Diagram. Abstract circular zones, fluid flow lines with arrows, hand-written annotations (marker pen style), diagrammatic aesthetic, white background, colorful translucent overlays for zones.",
    [RenderStyle.SKETCH_COLOR_PENCIL]: "Hand-drawn architectural sketch using colored pencils. Soft texture, vibrant strokes, artistic presentation.",
    [RenderStyle.SKETCH_MARKER]: "Alcohol marker rendering. Bold colors, sharp edges, professional design presentation style.",
    [RenderStyle.WATERCOLOR]: "Watercolor landscape plan. Wet-on-wet technique, soft edges, artistic bleeding, painterly vegetation.",
    [RenderStyle.MINIMALIST_BW]: "High-contrast black and white architectural diagram. Ink lines, stippling for vegetation, abstract modern style.",
    [RenderStyle.BLUEPRINT]: "Technical blueprint style. Deep blue background, white construction lines, engineering aesthetic.",
    [RenderStyle.VINTAGE_MAP]: "Antique cartography style. Parchment paper texture, sepia tones, hand-drawn topographic details.",
    [RenderStyle.NIGHT_RENDER]: "Night rendering. Dramatic landscape lighting, path lights, uplights on trees, glowing water features, dark ambient atmosphere.",
    [RenderStyle.DIGITAL_PAINTING]: "Concept art style. Digital painting, cinematic lighting, stylized textures, lush environment.",
    [RenderStyle.CLAY_MODEL]: "Architectural clay model (Maquette). Monochromatic white plaster material, soft ambient occlusion shadows.",
    
    // New Styles
    [RenderStyle.WOODEN_MODEL]: "Architectural physical model made of plywood and balsa wood. Laser-cut edges, cork textures for terrain, realistic studio lighting, depth of field effect, miniature scale.",
    [RenderStyle.COLLAGE]: "Post-digital architectural collage style. Mixed media, cut-out photo textures, flat vector people, abstract trees, artistic composition, vivid colors, avant-garde aesthetic.",
    [RenderStyle.INK_WASH]: "Traditional Asian ink wash painting (Sumi-e). Black ink strokes on textured paper, varying ink density, wet wash effects, minimalist and atmospheric, negative space.",
    [RenderStyle.PAPER_CUTOUT]: "Layered paper craft art. Die-cut paper shapes stacked to create depth, soft drop shadows between layers, vibrant color palette, textured paper stock.",
    [RenderStyle.VECTOR_ART]: "Flat vector illustration style. Clean lines, solid color fills, no gradients, modern graphic design, minimalist architectural diagram, Adobe Illustrator style.",
    [RenderStyle.CYBERPUNK]: "Futuristic cyberpunk landscape. Neon lighting (pink/cyan), glowing paths, dark rainy atmosphere, high-tech materials, holographic elements, cinematic night view.",
    [RenderStyle.STORYBOOK]: "Whimsical children's storybook illustration. Soft pastel colors, hand-drawn outline, watercolor texture, cozy and magical atmosphere, rounded shapes.",
    [RenderStyle.TECHNICAL_PEN]: "Precise technical pen drawing. Stippling and cross-hatching shading, high contrast black and white, detailed line work, architectural sketch, Rotring pen style.",
    [RenderStyle.IMPRESSIONIST]: "Impressionist oil painting style. Short thick brush strokes, capturing light and movement, vibrant color vibration, Claude Monet garden aesthetic.",
    [RenderStyle.LEGO]: "Constructed entirely from LEGO plastic bricks. Studs visible, blocky terrain, vibrant plastic colors, tilt-shift photography effect, miniature toy aesthetic."
  };

  const backgroundPrompts: Record<BackgroundType, string> = {
      [BackgroundType.NONE]: "clean empty background",
      [BackgroundType.GRASS]: "manicured green lawn surrounding the site",
      [BackgroundType.SNOW]: "winter snow-covered ground",
      [BackgroundType.DESERT]: "arid desert sand environment",
      [BackgroundType.SOIL]: "natural dark earth soil",
      [BackgroundType.FOREST]: "forest floor with fallen leaves"
  };

  // Extensive material mapping
  const materialDescriptions: Record<string, string> = {
      NONE: "Abstract conceptual line (Vector Stroke)", // Changed from Generic Paving
      // Terrain
      GRASS: "Lush Green Grass",
      SOIL: "Dark Organic Soil",
      PAVEMENT: "Smooth Concrete",
      WOOD_DECK: "Timber Decking",
      WATER: "Blue Water Feature",
      // Paths
      CONCRETE: "Poured Concrete (Light Grey)",
      CEMENT_FINISH: "Polished Cement",
      ASPHALT: "Dark Asphalt",
      STONE_SLAB: "Large Stone Slabs",
      GRANITE: "Granite Pavers",
      MARBLE: "White Marble",
      SLATE: "Grey Slate Tile",
      BLUESTONE: "Bluestone Pavers",
      SANDSTONE: "Beige Sandstone",
      LIMESTONE: "Limestone Pavers",
      ANDESITE: "Dark Volcanic Stone",
      RANDOM_STONE: "Irregular Flagstone",
      COBBLESTONE: "Round Cobblestone",
      MOSAIC_STONE: "Detailed Stone Mosaic",
      BRICK: "Red Brick (Herringbone)",
      CLAY_PAVER: "Terracotta Pavers",
      INTERLOCKING: "Interlocking Pavers",
      GRASS_PAVERS: "Grasscret (Grid Pavers)",
      TERRAZZO: "Terrazzo Surface",
      TILE: "Ceramic Outdoor Tile",
      WPC: "Composite Decking",
      BAMBOO: "Bamboo Flooring",
      OLD_TIE: "Railway Sleepers",
      GRAVEL: "Crushed Gravel",
      PEBBLE_WASH: "Exposed Aggregate",
      SAND: "Raked Sand",
      MULCH: "Wood Chip Mulch",
      RED_CLAY: "Red Clay Court",
      PU_TRACK: "Red Rubber Track"
  };

  // Build Material Legend (Strict Color Mapping)
  const legendLines: string[] = [];
  const activeMaterials = new Set<string>();
  let hasBubbles = false;

  // Build descriptive prompt elements
  const designElements: string[] = [];

  shapes.forEach((shape, index) => {
      if (shape.type === ToolMode.PATH) {
          const matKey = shape.pathMaterial || 'NONE';
          const matDesc = materialDescriptions[matKey] || matKey;
          const widthInfo = shape.pathWidth ? `${shape.pathWidth}m wide` : "standard width";
          
          // Add to legend if not present
          if (matKey !== 'NONE' && !activeMaterials.has(matKey)) {
             const hexColor = PATH_MATERIAL_COLORS[shape.pathMaterial as PathMaterial];
             // SUPER STRICT INSTRUCTION for Texture Mapping
             let instruction = `- COLOR CODE: ${hexColor} (Visual appearance in input) -> REPLACES WITH: ${matDesc}. DO NOT RENDER THE COLOR ${hexColor}.`;
             
             if (shape.lineStyle === 'DASHED') {
                 instruction += " Render as a DASHED/DOTTED path.";
             }
             
             legendLines.push(instruction);
             activeMaterials.add(matKey);
          } else if (matKey === 'NONE') {
             // For Bubble Diagram, let NONE be explicitly linear
             const hexColor = PATH_MATERIAL_COLORS.NONE;
             let lineType = "Render as clean abstract line (Marker stroke)";
             if (shape.lineStyle === 'DASHED') {
                 lineType = "Render as DOTTED movement flow line (diagrammatic)";
             }
             legendLines.push(`- COLOR CODE: ${hexColor} -> ${lineType}.`);
          }

          designElements.push(
              `Path ${index + 1}: A ${widthInfo} path. Material: ${matDesc}. ${shape.lineStyle === 'DASHED' ? 'This is a dashed movement line.' : ''}`
          );
      } 
      else if (shape.type === ToolMode.BOUNDARY) {
          const mat = shape.terrainMaterial || 'NONE';
          const matDesc = materialDescriptions[mat] || mat;
          if (mat !== 'NONE') {
             designElements.push(`Site Boundary: The base ground material is ${matDesc}.`);
          }
      }
      else if (shape.type === ToolMode.BUBBLE) {
          hasBubbles = true;
          const label = shape.label || 'Planting Area';
          designElements.push(`Zone: ${label} (represented by transparent green area).`);
      }
  });

  if (hasBubbles) {
      legendLines.push(`- COLOR CODE: Semi-transparent GREEN areas -> REPLACES WITH: Organic Vegetation/Lawn/Function Zones. DO NOT RENDER GREEN BLOCKS OR OUTLINES.`);
  }

  const bgPrompt = backgroundPrompts[backgroundType] ? `Context: ${backgroundPrompts[backgroundType]}` : "";
  const selectedStyleDescription = stylePrompts[style] || stylePrompts[RenderStyle.REALISTIC];

  const corePrompt = `
    **Role:** Advanced Landscape Renderer (Image-to-Image / ControlNet).
    
    **TARGET VISUAL STYLE:**
    ${selectedStyleDescription}
    
    **INPUT IMAGE TYPE:** **TECHNICAL SEGMENTATION MAP** (False-Color Data).
    
    **CRITICAL INSTRUCTION:**
    The input image uses **FALSE COLORS** to represent materials.
    - **DO NOT** copy the colors from the input image.
    - **DO NOT** draw colored stripes, outlines, or neon shapes.
    - **YOU MUST** perform a texture replacement based on the legend below.
    
    **SEGMENTATION LEGEND (Strict Adherence):**
    ${legendLines.length > 0 ? legendLines.join('\n    ') : "- No specific color codes. Interpret shapes naturally."}
    
    **Rendering Rules:**
    1. **Texture Swapping:** If you see a thick RED line, render a BRICK ROAD texture (Brown/Reddish natural tone), NOT a painted red stripe. If you see a GREY line, render CONCRETE.
    2. **Bubble Zones:** If you see transparent green blobs, these are **ZONES**. Fill them with organic vegetation or the specified function. Remove the "blob" shape.
    3. **Geometry:** The input paths are vector curves. You must blend them into the terrain realistically.
    4. **Style Application:** Apply the **TARGET VISUAL STYLE** defined above to the interpreted materials. (e.g., if the style is Watercolor, render the Brick Road as a watercolor painting, not a photo).
    5. **Artifact Removal:** The final image must contain **ZERO** neon colors or schematic lines.
    ${style === RenderStyle.BUBBLE_DIAGRAM ? `6. **HANDWRITTEN TEXT:** All labels and text in the image should mimic a handwritten architect's font/marker style.` : ''}

    **Design Context:**
    ${designElements.join('\n')}

    **Background/Context:**
    ${bgPrompt}

    ${customPrompt ? `Additional User Notes: ${customPrompt}` : ''}
  `;

  // Append style reference note to prompt for non-Gemini providers
  let finalPrompt = corePrompt;
  if (styleRefImageBase64) {
    finalPrompt += "\nSTYLE REFERENCE: Use the lighting, color palette, and rendering technique of the reference image provided.";
  }

  try {
    // Pass sketch as reference image (Gemini will use it; other providers use text prompt only)
    return await generateImage(finalPrompt, width, height, sketchImageBase64);
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(error.message || "圖片生成失敗");
  }
};