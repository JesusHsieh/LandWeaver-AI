/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Added Modality to imports for use in image editing model config.
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";
import { GeneratedScene } from '../components/Step3SceneGeneration';
// FIX: Corrected import path for i18n module.
import { Language } from "../lib/i18n";


const getAI = (): GoogleGenAI => {
  const key = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey: key });
};


// --- Helper Functions ---

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param decade The decade string (e.g., "1950s").
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(decade: string): string {
    return `Create a landscape photograph of a garden from the ${decade}. The photograph should capture the distinct garden style, plants, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}

/**
 * Extracts the decade (e.g., "1950s") from a prompt string.
 * @param prompt The original prompt.
 * @returns The decade string or null if not found.
 */
function extractDecade(prompt: string): string | null {
    const match = prompt.match(/(\d{4}s)/);
    return match ? match[1] : null;
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: GenerateContentResponse): string {
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new Error(`The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`);
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors.
 * @param imagePart The image part of the request payload.
 * @param textPart The text part of the request payload.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(imagePart: object, textPart: object): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await getAI().models.generateContent({
                model: 'gemini-2.0-flash-preview-image-generation',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
        } catch (error) {
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');

            if (isInternalError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Internal error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // Re-throw if not a retriable error or if max retries are reached.
        }
    }
    // This should be unreachable due to the loop and throw logic above.
    throw new Error("Gemini API call failed after all retries.");
}


/**
 * Converts an image source to base64 format
 * @param src The image source (data URL or blob URL)
 * @returns Promise resolving to base64 string
 */
export async function imageSrcToBase64(src: string): Promise<string> {
    // If it's already a data URL, extract the base64 part
    const match = src.match(/^data:image\/\w+;base64,(.*)$/);
    if (match) {
        return match[1];
    }

    try {
        const response = await fetch(src);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image to base64:", error);
        throw error;
    }
}

/**
 * Generates prompt variations to ensure different results
 * @param basePrompt The base prompt
 * @returns Modified prompt with variation
 */
function generatePromptVariations(basePrompt: string): string {
    const variations = [
        '',  // Original
        '. Please generate a unique result.',
        '; make it distinctive.',
        '! Create something fresh.',
        ' - ensure originality.',
        '? Make it stand out.',
        ': focus on uniqueness.'
    ];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    const timestamp = Date.now();
    return basePrompt + randomVariation + ` [${timestamp}]`;
}

/**
 * Generates an architectural image with AI
 * @param parts The parts array for the request
 * @returns Promise resolving to data URL of generated image
 */
export async function generateArchitecturalImage(parts: any[]): Promise<string> {
    const maxAttempts = 7;
    let attempts = 0;
    
    // FIX: Updated config for 'gemini-2.0-flash-preview-image-generation' model according to guidelines.
    // This model only supports `responseModalities`.
    const payload = { 
        contents: { parts }, 
        config: { 
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    };
    
    while(attempts < maxAttempts) {
        try {
            console.log(`Architectural image generation attempt ${attempts + 1}/${maxAttempts}`);
            const response = await getAI().models.generateContent({
                model: 'gemini-2.0-flash-preview-image-generation',
                ...payload
            });
            
            // Check for blocked content
            if (response.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error('Content was blocked by safety filters');
            }
            
            const imagePart = response?.candidates?.[0]?.content?.parts?.find(p => (p as any).inlineData);
            if (imagePart && (imagePart as any).inlineData?.data) {
                console.log('Architectural image generation successful');
                return `data:image/png;base64,${(imagePart as any).inlineData.data}`;
            }
            
            // Extract text if available for better error info
            const textPart = response?.candidates?.[0]?.content?.parts?.find(p => p.text);
            const textContent = textPart ? textPart.text : 'No content returned';
            
            throw new Error(`API response did not contain image data. Model output: ${textContent}`);
        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts} failed:`, error);
            
            if (attempts >= maxAttempts) {
                console.error('All attempts failed, throwing error');
                throw new Error(`Architectural image generation failed after ${maxAttempts} attempts. Last error: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            // Progressive backoff: 2s, 4s, 8s, 16s, 32s, 64s
            const backoffTime = Math.min(Math.pow(2, attempts) * 1000, 60000);
            console.log(`Waiting ${backoffTime/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
    }
    
    throw new Error('Architectural image generation failed after all attempts');
}

/**
 * Generates AI rendering of landscape site plan
 * @param baseImageSrc Source image URL or data URL
 * @param promptOverride Optional prompt override
 * @param maskBase64 Optional mask for editing specific areas
 * @param numberOfImages The number of image variations to generate.
 * @returns Promise resolving to an array of generated image data URLs.
 */
export async function generateAIRendering(
    baseImageSrc: string,
    promptOverride?: string,
    maskBase64?: string,
    numberOfImages: number = 1
): Promise<string[]> {
    const baseImage64 = await imageSrcToBase64(baseImageSrc);
    
    const generationPromises: Promise<string>[] = [];

    for (let i = 0; i < numberOfImages; i++) {
        const promise = (async () => {
            let parts;
            if (maskBase64) {
                const maskPrompt = generatePromptVariations(`Using the provided black and white mask image, make precise modifications to the base image, which is a LANDSCAPE ARCHITECTURAL SITE PLAN (top-down view). Apply the following changes: "${promptOverride}"

PERSPECTIVE INSTRUCTIONS:
- The base image is a TOP-DOWN LANDSCAPE SITE PLAN.
- Any elements you add or modify (like trees, paths, pools, furniture) MUST be rendered from a consistent TOP-DOWN perspective.
- DO NOT generate side-view or isometric-view objects. All elements must look as they would in a standard professional site plan.

MASKING INSTRUCTIONS:
- You MUST only modify the areas of the base image that correspond to the WHITE regions in the mask.
- The BLACK areas of the mask indicate parts of the base image that MUST be preserved exactly as they are.
- Ensure the final image is a single, coherent site plan with seamless blending between the edited and unedited parts.
- Do not include the mask itself in the final output.

QUALITY REQUIREMENTS:
- Maintain the original landscape style and perspective.
- Ensure the edits are professional, realistic, and high-quality.`);
                parts = [
                    { text: maskPrompt },
                    { inlineData: { mimeType: 'image/png', data: baseImage64 } },
                    { inlineData: { mimeType: 'image/png', data: maskBase64 } }
                ];
            } else {
                const defaultPrompt = `Transform this 2D plan into a precise, high-quality 3D rendered LANDSCAPE ARCHITECTURAL SITE PLAN (OUTDOOR LANDSCAPE) with the following requirements:

CLEANING REQUIREMENTS:
- COMPLETELY REMOVE all text, Chinese characters, numbers, dimension markings, labels, and symbols.
- Remove interior furniture symbols (beds, wardrobes, etc.) unless they can be reinterpreted as outdoor features.

LANDSCAPE INTERPRETATION:
- Interpret the plan as an OUTDOOR SITE.
- Rectangular zones -> Lawns, patios, decks, or planting beds.
- Lines/Corridors -> Pathways (stone, gravel, or paver).
- Enclosed areas -> Courtyards, swimming pools, or water features.
- Walls/Boundaries -> Hedges, fences, or garden walls.

VISUAL ENHANCEMENT:
- Add realistic landscape textures: grass, stone, wood decking, water, gravel.
- Add vegetation: trees (top-down view), shrubs, flower beds.
- Add outdoor elements: outdoor seating, parasols, stepping stones.
- Apply natural outdoor lighting (sunlight) with appropriate shadows for a top-down view.

IMPORTANT: Generate a clean, professional landscape architecture visualization (site plan) that accurately represents the spatial layout as an outdoor garden or park environment.`;
                
                parts = [
                    { text: generatePromptVariations(promptOverride || defaultPrompt) },
                    { inlineData: { mimeType: 'image/jpeg', data: baseImage64 } }
                ];
            }
            return await generateArchitecturalImage(parts);
        })();
        generationPromises.push(promise);
    }

    return await Promise.all(generationPromises);
}

/**
 * Generates landscape scene from viewpoint
 * @param planImageSrc The site plan image source
 * @param pointX X coordinate of viewpoint
 * @param pointY Y coordinate of viewpoint  
 * @param style Landscape design style
 * @param viewIndex Index of the viewpoint (1-4)
 * @param camera Camera parameters for view angle
 * @param mode The lighting mode, either 'day' or 'night'
 * @param temperature The color temperature in Kelvin
 * @returns Promise resolving to generated scene image data URL
 */
export async function generateInteriorScene(
    planImageSrc: string,
    pointX: number,
    pointY: number,
    style: string,
    viewIndex: number,
    camera: { rotation: number; tilt: number; zoom: number; },
    mode: 'day' | 'night',
    temperature: number
): Promise<string> {
    // Create a temporary canvas to draw the base image and enhanced viewpoint marker
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = planImageSrc;
    });
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const radius = 25;

    // Draw simple viewpoint marker
    ctx.beginPath();
    ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Add viewpoint number
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(viewIndex.toString(), pointX, pointY);

    const imageWithPointBase64 = canvas.toDataURL().split(',')[1];
    
    let cameraInstructions = '';
    if (camera) {
        if (camera.rotation !== 0) {
            const direction = camera.rotation > 0 ? 'right' : 'left';
            cameraInstructions += ` The camera is panned ${Math.abs(camera.rotation)} degrees to the ${direction}.`;
        }

        if (camera.tilt !== 0) {
            const direction = camera.tilt > 0 ? 'upwards' : 'downwards';
            cameraInstructions += ` The camera is tilted ${Math.abs(camera.tilt)} degrees ${direction}.`;
        }

        if (camera.zoom > 1) {
            cameraInstructions += ` The view is zoomed in.`;
        } else if (camera.zoom < 1) {
            cameraInstructions += ` The view is zoomed out for a wider angle.`;
        }
    }

    const materialRealism = 'photorealistic with hyper-detailed landscape textures';

    const lightingDescription = mode === 'day' 
        ? `a bright, sunny daytime scene with clear blue skies and natural sunlight, color temperature around ${temperature}K`
        : `a dramatic and atmospheric night landscape scene. The primary light sources are garden lights, path lights, and moon lighting. Create high contrast and deep shadows. The sky should be a dark night sky. The mood is serene and magical, with a color temperature around ${temperature}K`;

    const promptDetails = [
        `Generate a ${materialRealism} EYE-LEVEL OUTDOOR LANDSCAPE photograph from the perspective of viewpoint ${viewIndex} on the attached site plan.`,
        `STYLE & ATMOSPHERE: The landscape design style is "${style}".`,
        `LIGHTING: ${lightingDescription}. Render realistic shadows from trees and structures.`,
        `CAMERA VIEW: The camera is at human eye-level (approximately 1.6 meters high) standing in the garden/park.${cameraInstructions || ' The camera is at a neutral, forward-facing position.'}`,
        'COMPOSITION: Create a complete and believable OUTDOOR scene with plants, trees, pathways, water features, sky, and hardscape that fit the specified style. The layout must be consistent with the site plan.',
        `CRITICAL INSTRUCTIONS: The output MUST be a ground-level, horizontal photograph of the OUTDOOR environment. ABSOLUTELY DO NOT generate aerial, top-down, or bird's-eye perspectives. Do not generate interior rooms.`
    ];
    
    const basePrompt = promptDetails.join(' ');
    const prompt = generatePromptVariations(basePrompt);
    
    const parts = [
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: imageWithPointBase64 } }
    ];
    
    console.log(`Generating scene ${viewIndex} with prompt: ${prompt}`);
    return await generateArchitecturalImage(parts);
}

/**
 * Edits an existing landscape scene based on a text prompt and lighting settings.
 * @param baseImageSrc The source URL of the image to edit.
 * @param prompt The user's instruction for the edit.
 * @param mode The desired lighting mode ('day' or 'night').
 * @param temperature The desired color temperature in Kelvin.
 * @param maskBase64 Optional base64 string of a black and white mask image.
 * @param objectImageBase64 Optional base64 string of a reference object to add.
 * @returns A promise resolving to the data URL of the edited image.
 */
export async function editInteriorScene(
    baseImageSrc: string,
    prompt: string,
    mode: 'day' | 'night',
    temperature: number,
    maskBase64?: string,
    objectImageBase64?: string
): Promise<string> {
    const baseImage64 = await imageSrcToBase64(baseImageSrc);
    
    const lightingDescription = mode === 'day' 
        ? `a bright, sunny daytime scene with clear skies, color temperature around ${temperature}K`
        : `a dramatic night landscape scene with garden lighting, color temperature around ${temperature}K`;

    let editPromptText: string;
    let parts: Part[] = [];

    const commonInstructions = `
CRITICAL INSTRUCTIONS:
-   Maintain the original camera angle, perspective, and overall landscape structure.
-   The result must be a single, photorealistic, and coherent OUTDOOR image.
-   Do not include the mask or reference object image in the final output.
-   The output must be a ground-level landscape photograph.
-   Match the style, lighting, shadows, and perspective of the base scene.`;

    if (objectImageBase64) {
        // SCENARIO: Adding a landscape element
        const objectPart = { inlineData: { mimeType: 'image/png', data: objectImageBase64 } };
        
        if (maskBase64) {
            // Object + Mask
            editPromptText = `You are an expert landscape photo editor. You are given a BASE SCENE, a reference ELEMENT image, and a MASK.
TASK:
1.  **PLACE ELEMENT IN MASKED AREA:** Place the landscape element from the ELEMENT image into the white area defined by the MASK on the BASE SCENE.
2.  **USE PROMPT FOR GUIDANCE:** The user's instruction is: "${prompt}".
3.  **ADJUST LIGHTING:** Render the scene as ${lightingDescription}.
4.  **PRESERVE UNMASKED AREA:** The black area of the mask MUST remain unchanged.
${commonInstructions}`;
            parts = [
                { text: generatePromptVariations(editPromptText) },
                { inlineData: { mimeType: 'image/png', data: baseImage64 } }, // Base Scene
                objectPart, // Object Image
                { inlineData: { mimeType: 'image/png', data: maskBase64 } }  // Mask
            ];
        } else {
            // Object, No Mask
            editPromptText = `You are an expert landscape photo editor. You are given a BASE SCENE and a reference ELEMENT image.
TASK:
1.  **ADD ELEMENT TO SCENE:** Seamlessly integrate the landscape element from the ELEMENT image into the BASE SCENE.
2.  **USE PROMPT FOR PLACEMENT:** The user's instruction is: "${prompt}".
3.  **ADJUST LIGHTING:** Render the scene as ${lightingDescription}.
${commonInstructions}`;
            parts = [
                { text: generatePromptVariations(editPromptText) },
                { inlineData: { mimeType: 'image/png', data: baseImage64 } }, // Base Scene
                objectPart // Object Image
            ];
        }
    } else {
        // SCENARIO: Standard editing
        if (maskBase64) {
            editPromptText = `You are an expert landscape photo editor. Using the provided mask, modify ONLY the masked area of the image based on the user's request.
TASK:
1.  **APPLY EDIT TO MASKED AREA:** Make the following change ONLY in the white area defined by the mask: "${prompt}".
2.  **ADJUST LIGHTING:** Render the scene as ${lightingDescription}.
3.  **PRESERVE UNMASKED AREA:** The black area of the mask MUST remain unchanged.
${commonInstructions}`;
            parts = [
                { text: generatePromptVariations(editPromptText) },
                { inlineData: { mimeType: 'image/png', data: baseImage64 } },
                { inlineData: { mimeType: 'image/png', data: maskBase64 } }
            ];
        } else {
            editPromptText = `You are an expert landscape photo editor. Modify the image based on the user's request.
TASK:
1.  **APPLY EDIT:** Make the following change: "${prompt || 'No specific edit, just apply lighting changes.'}".
2.  **ADJUST LIGHTING:** Render the scene as ${lightingDescription}.
${commonInstructions}`;
            parts = [
                { text: generatePromptVariations(editPromptText) },
                { inlineData: { mimeType: 'image/png', data: baseImage64 } }
            ];
        }
    }

    return await generateArchitecturalImage(parts);
}

/**
 * Generates a decade-styled image from a source image and a prompt.
 * It includes a fallback mechanism for prompts that might be blocked in certain regions.
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param prompt The prompt to guide the image generation.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateDecadeImage(imageDataUrl: string, prompt: string): Promise<string> {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
  }
  const [, mimeType, base64Data] = match;

    const imagePart = {
        inlineData: { mimeType, data: base64Data },
    };

    // --- First attempt with the original prompt ---
    try {
        console.log("Attempting generation with original prompt...");
        const textPart = { text: prompt };
        const response = await callGeminiWithRetry(imagePart, textPart);
        return processGeminiResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const isNoImageError = errorMessage.includes("The AI model responded with text instead of an image");

        if (isNoImageError) {
            console.warn("Original prompt was likely blocked. Trying a fallback prompt.");
            const decade = extractDecade(prompt);
            if (!decade) {
                console.error("Could not extract decade from prompt, cannot use fallback.");
                throw error; // Re-throw the original "no image" error.
            }

            // --- Second attempt with the fallback prompt ---
            try {
                const fallbackPrompt = getFallbackPrompt(decade);
                console.log(`Attempting generation with fallback prompt for ${decade}...`);
                const fallbackTextPart = { text: fallbackPrompt };
                const fallbackResponse = await callGeminiWithRetry(imagePart, fallbackTextPart);
                return processGeminiResponse(fallbackResponse);
            } catch (fallbackError) {
                console.error("Fallback prompt also failed.", fallbackError);
                const finalErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`The AI model failed with both original and fallback prompts. Last error: ${finalErrorMessage}`);
            }
        } else {
            // This is for other errors, like a final internal server error after retries.
            console.error("An unrecoverable error occurred during image generation.", error);
            throw new Error(`The AI model failed to generate an image. Details: ${errorMessage}`);
        }
    }
}

/**
 * Generates a landscape design style suggestion based on a site plan.
 * @param planImageSrc The site plan image source.
 * @returns A promise that resolves to a suggested style string.
 */
export async function suggestInteriorStyle(planImageSrc: string): Promise<string> {
    try {
        const baseImage64 = await imageSrcToBase64(planImageSrc);
        const imagePart = {
            inlineData: { mimeType: 'image/jpeg', data: baseImage64 }
        };

        const prompt = `Analyze this landscape architectural site plan. Based on the layout, zones, and potential flow, suggest a single, concise landscape design style that would be suitable. Provide only the name of the style (e.g., "Japanese Zen Garden", "French Formal", "Modern Tropical", "Mediterranean", "English Cottage"). Do not add any other explanatory text.`;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [ { text: prompt }, imagePart ] },
        });

        const suggestedStyle = (response.text ?? "").trim();
        if (!suggestedStyle) {
            throw new Error("AI did not return a style suggestion.");
        }
        
        return suggestedStyle.split('\n')[0];

    } catch (error) {
        console.error("Error suggesting landscape style:", error);
        throw new Error(`Failed to get style suggestion from AI. ${error instanceof Error ? error.message : String(error)}`);
    }
}


export interface PresentationText {
    presentationTitle: string;
    conceptTitle: string;
    mainConcepts: string[];
    viewpointDetails: {
        title: string;
        description: string;
    }[];
    conclusionTitle: string;
    conclusion: string;
    // New optional field for extra slides if user requests more pages
    additionalSlides?: {
        title: string;
        content: string;
    }[];
}

/**
 * Generates text content for a design presentation.
 * @param planImageSrc The source of the floor plan image.
 * @param scenes An array of generated scene objects.
 * @param style The interior design style.
 * @param language The target language for the output.
 * @param targetSlideCount Optional target number of slides.
 * @param tone Optional presentation tone/style.
 * @returns A promise that resolves to an object containing the generated text.
 */
export async function generatePresentationText(
    planImageSrc: string,
    scenes: GeneratedScene[],
    style: string,
    language: Language,
    targetSlideCount: number = 7,
    tone: string = 'Professional'
): Promise<PresentationText> {
    try {
        const planImageBase64 = await imageSrcToBase64(planImageSrc);
        const sceneImagePromises = scenes
            .filter(scene => scene.url)
            .map(scene => imageSrcToBase64(scene.url));
        const sceneImagesBase64 = await Promise.all(sceneImagePromises);
        
        const languageInstruction = language === 'zh' ? 'Traditional Chinese (Taiwan)' : 'English';
        
        // Calculate needed extra slides. Base is Title + Concept + Scenes + Conclusion
        const baseSlides = 3 + scenes.length;
        const extraSlidesNeeded = Math.max(0, targetSlideCount - baseSlides);
        const extraInstructions = extraSlidesNeeded > 0 
            ? `Additionally, generate ${extraSlidesNeeded} EXTRA slides ('additionalSlides') with deep-dive analysis topics such as "Planting Strategy", "Sustainability Analysis", "Material Palette", "Maintenance Plan", or "Lighting Concept".`
            : "";

        const parts: Part[] = [
            {
                text: `You are an expert Landscape Architect creating a client-facing presentation in ${languageInstruction}.

The landscape design style is "${style}".
The desired TONE of the presentation is: "${tone}" (ensure the vocabulary and structure reflect this tone).

**CRITICAL INSTRUCTIONS:**
1.  **Language:** The output MUST be in ${languageInstruction}. If the style name "${style}" is not in this language, translate it.
2.  **Context:** Focus on Landscape Architecture (gardens, parks, outdoor spaces), NOT interior design.
3.  **Brevity & Structure:**
    - **presentationTitle**: Creative title, max 10 words.
    - **conceptTitle**: Title for concepts, max 7 words.
    - **mainConcepts**: Exactly 4 concept bullet points. Max 15 words each.
    - **viewpointDetails**: Array matching the ${scenes.length} provided scene images.
    - **conclusion**: Concluding paragraph, max 40 words.
    ${extraInstructions}

Analyze the provided site plan and ${scenes.length} landscape scenes to generate the JSON.`
            },
            { inlineData: { mimeType: 'image/png', data: planImageBase64 } }
        ];

        sceneImagesBase64.forEach(data => {
            parts.push({ inlineData: { mimeType: 'image/png', data } });
        });

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        presentationTitle: {
                            type: Type.STRING,
                            description: "A creative title for the landscape proposal."
                        },
                        conceptTitle: {
                            type: Type.STRING,
                        },
                        mainConcepts: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        viewpointDetails: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ["title", "description"]
                            },
                        },
                        conclusionTitle: {
                            type: Type.STRING,
                        },
                        conclusion: {
                            type: Type.STRING,
                        },
                        additionalSlides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "Title of the extra slide" },
                                    content: { type: Type.STRING, description: "Main text content for the slide (max 50 words)" }
                                },
                                required: ["title", "content"]
                            },
                            description: "Optional array of extra text-only slides for deeper analysis."
                        }
                    },
                    required: ["presentationTitle", "conceptTitle", "mainConcepts", "viewpointDetails", "conclusionTitle", "conclusion"]
                },
            },
        });
        
        const jsonText = (response.text ?? "").trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating presentation text:", error);
        throw new Error(`Failed to get presentation text from AI. ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Suggests an improvement for a rendered floor plan.
 * @param planImageSrc The source of the rendered floor plan image.
 * @returns A promise that resolves to a suggested improvement string.
 */
export async function suggestPlanImprovements(planImageSrc: string): Promise<string> {
    try {
        const baseImage64 = await imageSrcToBase64(planImageSrc);
        const imagePart = {
            inlineData: { mimeType: 'image/jpeg', data: baseImage64 }
        };

        const prompt = `Analyze this rendered landscape site plan. Provide one concise, actionable suggestion for improvement to pass to an AI image editor. Single sentence. Examples: "Add a large shade tree in the corner.", "Change the pathway to irregular flagstones.", "Add a swimming pool in the open lawn area." Focus on landscape elements.`;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [ { text: prompt }, imagePart ] },
        });

        const suggestion = (response.text ?? "").trim();
        if (!suggestion) {
            throw new Error("AI did not return a suggestion.");
        }
        
        return suggestion;

    } catch (error) {
        console.error("Error suggesting plan improvements:", error);
        throw new Error(`Failed to get plan improvement suggestion from AI. ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Generates a list of 6 random landscape design style ideas.
 * @param language The language to generate suggestions in.
 * @returns A promise that resolves to an array of 6 style strings.
 */
export async function suggestStyleIdeas(language: Language = 'en'): Promise<string[]> {
    try {
        const langInstruction = language === 'zh' ? 'Traditional Chinese' : 'English';
        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest 6 diverse and popular landscape architecture styles (e.g., Japanese Zen, English Cottage, Modern Minimalist, Mediterranean). Provide only the names of the styles in the array, in ${langInstruction}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { 
                        type: Type.STRING,
                        description: 'A landscape design style name.'
                    }
                }
            }
        });

        const jsonText = (response.text ?? "").trim();
        const styles = JSON.parse(jsonText);

        if (!Array.isArray(styles) || styles.length === 0) {
            throw new Error("AI did not return a valid array of style suggestions.");
        }
        
        return styles.slice(0, 6);

    } catch (error) {
        console.error("Error suggesting style ideas:", error);
        return ['Modern Minimalist', 'Japanese Zen', 'English Cottage', 'Mediterranean', 'Tropical', 'Desert Modern'];
    }
}

/**
 * Rewrites a given text in a specific style (e.g., Chinese Poetry, Modern Literature).
 * @param text The original text to rewrite.
 * @param style The requested style (e.g., "Chinese Poetry").
 * @param language The target language.
 * @returns The rewritten text.
 */
export async function rewriteText(text: string, style: string, language: Language): Promise<string> {
    try {
        const langInstruction = language === 'zh' ? 'Traditional Chinese (Taiwan)' : 'English';
        const prompt = `Rewrite the following text in the style of "${style}".
        
        Original Text: "${text}"
        
        Requirements:
        1. Keep the core meaning but change the tone and vocabulary to match the "${style}" style.
        2. Output MUST be in ${langInstruction}.
        3. Be creative but concise.`;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return (response.text ?? "").trim();
    } catch (error) {
        console.error("Error rewriting text:", error);
        throw new Error("Failed to rewrite text.");
    }
}