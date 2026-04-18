/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { PresentationText } from '../services/geminiService';
import { GeneratedScene } from '../components/Step3SceneGeneration';
import { Language, getTranslation } from './i18n';

type ColorThemeNameKey = 'themeModernBlue' | 'themeEarthTones' | 'themeMinimalistGray' | 'themeVibrantCreative' | 'themeElegantNoir' | 'themeSakuraPink';

export interface ColorTheme {
    nameKey: ColorThemeNameKey;
    colors: {
        background: string;
        primaryText: string;
        secondaryText: string;
        accent: string;
        titleBackground: string;
    };
}

export interface SlideStyle {
    fontFamily: string;
    fontSizeScale: number;
}

export const themes: ColorTheme[] = [
    {
        nameKey: 'themeModernBlue',
        colors: { background: '#FFFFFF', primaryText: '#1E3A8A', secondaryText: '#475569', accent: '#3B82F6', titleBackground: 'rgba(255, 255, 255, 0.7)' }
    },
    {
        nameKey: 'themeEarthTones',
        colors: { background: '#FBF9F6', primaryText: '#5D4037', secondaryText: '#795548', accent: '#A1887F', titleBackground: 'rgba(255, 255, 255, 0.7)' }
    },
    {
        nameKey: 'themeMinimalistGray',
        colors: { background: '#F3F4F6', primaryText: '#111827', secondaryText: '#4B5563', accent: '#6B7280', titleBackground: 'rgba(255, 255, 255, 0.7)' }
    },
    {
        nameKey: 'themeVibrantCreative',
        colors: { background: '#FFFBEB', primaryText: '#854D0E', secondaryText: '#B45309', accent: '#F59E0B', titleBackground: 'rgba(255, 255, 255, 0.7)' }
    },
    {
        nameKey: 'themeElegantNoir',
        colors: { background: '#212121', primaryText: '#FFFFFF', secondaryText: '#BDBDBD', accent: '#D4AF37', titleBackground: 'rgba(0, 0, 0, 0.6)' }
    },
    {
        nameKey: 'themeSakuraPink',
        colors: { background: '#FFF5F7', primaryText: '#5B21B6', secondaryText: '#4A044E', accent: '#F472B6', titleBackground: 'rgba(255, 255, 255, 0.7)' }
    }
];

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const PADDING = 80;

// Banner layout constants
const BANNER_Y = CANVAS_HEIGHT * 0.6;
const BANNER_HEIGHT = CANVAS_HEIGHT * 0.4;
const BANNER_PADDING = PADDING * 1.5;


function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Wraps text to fit a specified width, handling explicit newlines and different languages.
 * @param ctx The canvas rendering context.
 * @param text The text to wrap.
 * @param maxWidth The maximum width for a line.
 * @returns An array of strings, where each string is a line of wrapped text.
 */
function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const finalLines: string[] = [];
    if (!text) return finalLines;

    const paragraphs = text.split('\n');
    const hasChinese = /[\u4E00-\u9FA5]/.test(text);

    for (const paragraph of paragraphs) {
        if (paragraph === '') {
            finalLines.push('');
            continue;
        }

        if (hasChinese) {
            let currentLine = '';
            for (const char of paragraph) {
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine !== '') {
                    finalLines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            finalLines.push(currentLine);
        } else { // Word-based wrapping for English and other languages
            const words = paragraph.split(' ');
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine !== '') {
                    finalLines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            finalLines.push(currentLine);
        }
    }
    return finalLines;
}


/**
 * Draws text on the canvas, automatically adjusting font size to fit within a bounding box.
 * Also applies custom font family and scale.
 */
function drawTextWithAutoSize(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    maxWidth: number, maxHeight: number,
    baseFontPx: number, lineHeightPx: number, 
    align: 'left' | 'center' | 'right',
    style?: SlideStyle
) {
    let fontSize = baseFontPx;
    const fontFamily = style?.fontFamily || 'sans-serif';
    
    // Apply user scaling preference
    if (style?.fontSizeScale) {
        fontSize = Math.round(fontSize * style.fontSizeScale);
    }
    
    const baseFontSize = fontSize;
    const baseLineHeight = lineHeightPx * (style?.fontSizeScale || 1);
    
    // Attempt to fit text by shrinking font size if needed
    while (fontSize > 10) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        const currentLineHeight = baseLineHeight * (fontSize / baseFontSize);
        const lines = getLines(ctx, text, maxWidth);
        const totalHeight = lines.length * currentLineHeight;
        
        if (totalHeight <= maxHeight) {
            let startY = y;
            for (const line of lines) {
                let startX = x;
                if (align === 'center') {
                    startX = x + (maxWidth - ctx.measureText(line).width) / 2;
                } else if (align === 'right') {
                    startX = x + (maxWidth - ctx.measureText(line).width);
                }
                ctx.fillText(line, startX, startY);
                startY += currentLineHeight;
            }
            return;
        }
        fontSize -= 2; 
    }
    
    // If it still doesn't fit, draw with the smallest font size and truncate visually
    ctx.font = `${fontSize}px ${fontFamily}`;
    const finalLineHeight = baseLineHeight * (fontSize / baseFontSize);
    let startY = y;
    const lines = getLines(ctx, text, maxWidth);
    for (const line of lines) {
        let startX = x;
         if (align === 'center') {
            startX = x + (maxWidth - ctx.measureText(line).width) / 2;
        } else if (align === 'right') {
            startX = x + (maxWidth - ctx.measureText(line).width);
        }
        ctx.fillText(line, startX, startY);
        startY += finalLineHeight;
        if (startY > y + maxHeight - finalLineHeight) break; 
    }
}

/**
 * Draws an image to fill the entire canvas, cropping as needed while preserving aspect ratio.
 */
function drawFullBleedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
    const sWidth = image.naturalWidth;
    const sHeight = image.naturalHeight;
    const sAspect = sWidth / sHeight;
    const dAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    let sx, sy, sw, sh;

    if (sAspect > dAspect) { // source is wider, crop sides
        sh = sHeight;
        sw = sh * dAspect;
        sx = (sWidth - sw) / 2;
        sy = 0;
    } else { // source is taller or same, crop top/bottom
        sw = sWidth;
        sh = sw / dAspect;
        sx = 0;
        sy = (sHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}


async function drawTitleSlide(ctx: CanvasRenderingContext2D, text: PresentationText, styleName: string, theme: ColorTheme, scenes: GeneratedScene[], slideStyle?: SlideStyle) {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (scenes.length > 0) {
        const image = await loadImage(scenes[0].url);
        drawFullBleedImage(ctx, image);
    }
    
    ctx.fillStyle = theme.colors.titleBackground;
    ctx.fillRect(0, BANNER_Y, CANVAS_WIDTH, BANNER_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = theme.colors.primaryText;
    const title = text.presentationTitle;
    
    // Font handling
    // We override specific fonts for the main title style if no custom font is set, for better aesthetics
    // but here we respect user choice.
    
    drawTextWithAutoSize(ctx, title, CANVAS_WIDTH / 2, BANNER_Y + BANNER_HEIGHT / 2, CANVAS_WIDTH - BANNER_PADDING * 2, 220, 100, 120, 'center', slideStyle);
}


async function drawConceptSlide(ctx: CanvasRenderingContext2D, text: PresentationText, planImageSrc: string, theme: ColorTheme, slideStyle?: SlideStyle) {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const planImage = await loadImage(planImageSrc);
    drawFullBleedImage(ctx, planImage);

    ctx.fillStyle = theme.colors.titleBackground;
    ctx.fillRect(0, BANNER_Y, CANVAS_WIDTH, BANNER_HEIGHT);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const concepts = text.mainConcepts.join('\n\n');
    ctx.fillStyle = theme.colors.secondaryText;
    drawTextWithAutoSize(ctx, concepts, BANNER_PADDING, BANNER_Y + PADDING, CANVAS_WIDTH - BANNER_PADDING * 2, BANNER_HEIGHT - PADDING * 2, 48, 65, 'left', slideStyle);
}


async function drawViewpointSlide(ctx: CanvasRenderingContext2D, scene: GeneratedScene, detail: PresentationText['viewpointDetails'][0], theme: ColorTheme, slideStyle?: SlideStyle) {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const image = await loadImage(scene.url);
    drawFullBleedImage(ctx, image);
    
    ctx.fillStyle = theme.colors.titleBackground;
    ctx.fillRect(0, BANNER_Y, CANVAS_WIDTH, BANNER_HEIGHT);
    
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = theme.colors.primaryText;
    const titleText = detail.title;
    
    // We want the title to be slightly larger than description
    // Pass a temporary style for title based on the global slide style
    const titleStyle = { ...slideStyle, fontSizeScale: (slideStyle?.fontSizeScale || 1) * 1.2 } as SlideStyle;
    
    drawTextWithAutoSize(ctx, titleText, BANNER_PADDING, BANNER_Y + PADDING, CANVAS_WIDTH - BANNER_PADDING * 2, 120, 70, 80, 'left', titleStyle);

    ctx.fillStyle = theme.colors.secondaryText;
    drawTextWithAutoSize(ctx, detail.description, BANNER_PADDING, BANNER_Y + PADDING + 120, CANVAS_WIDTH - BANNER_PADDING * 2, BANNER_HEIGHT - PADDING * 2 - 120, 40, 50, 'left', slideStyle);
}

async function drawGenericSlide(ctx: CanvasRenderingContext2D, title: string, content: string, theme: ColorTheme, slideStyle?: SlideStyle) {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative Element
    ctx.fillStyle = theme.colors.accent;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 20);
    
    // Title area
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.colors.primaryText;
    
    // Use the custom font for title as well
    const fontFamily = slideStyle?.fontFamily || 'sans-serif';
    ctx.font = `bold 80px ${fontFamily}`;
    ctx.fillText(title, CANVAS_WIDTH / 2, PADDING + 60);

    // Content area
    ctx.textAlign = 'left';
    const contentY = PADDING + 200;
    const contentH = CANVAS_HEIGHT - contentY - PADDING;
    ctx.fillStyle = theme.colors.secondaryText;
    drawTextWithAutoSize(ctx, content, PADDING * 2, contentY, CANVAS_WIDTH - PADDING * 4, contentH, 48, 70, 'left', slideStyle);
}


async function drawConclusionSlide(ctx: CanvasRenderingContext2D, text: PresentationText, scenes: GeneratedScene[], theme: ColorTheme, slideStyle?: SlideStyle) {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (scenes.length > 0) {
        const image = await loadImage(scenes[scenes.length - 1].url);
        drawFullBleedImage(ctx, image);
    }
    
    ctx.fillStyle = theme.colors.titleBackground;
    ctx.fillRect(0, BANNER_Y, CANVAS_WIDTH, BANNER_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = theme.colors.primaryText;
    const fontFamily = slideStyle?.fontFamily || 'sans-serif';
    ctx.font = `bold 80px ${fontFamily}`;
    ctx.fillText(text.conclusionTitle, CANVAS_WIDTH / 2, BANNER_Y + BANNER_HEIGHT / 2 - 80);

    ctx.fillStyle = theme.colors.secondaryText;
    drawTextWithAutoSize(ctx, text.conclusion, CANVAS_WIDTH / 2, BANNER_Y + BANNER_HEIGHT / 2 + 40, CANVAS_WIDTH - BANNER_PADDING * 2, 200, 48, 60, 'center', slideStyle);
}


export async function generateSlides(
    text: PresentationText,
    scenes: GeneratedScene[],
    planImage: string,
    style: string,
    language: Language,
    theme: ColorTheme,
    slideStyles: { [key: number]: SlideStyle } = {}
): Promise<string[]> {
    const slideGenerators: ((ctx: CanvasRenderingContext2D) => Promise<void>)[] = [
        (ctx) => drawTitleSlide(ctx, text, style, theme, scenes, slideStyles[0]),
        (ctx) => drawConceptSlide(ctx, text, planImage, theme, slideStyles[1]),
        ...scenes.map((scene, i) => (ctx: CanvasRenderingContext2D) => drawViewpointSlide(ctx, scene, text.viewpointDetails[i], theme, slideStyles[2 + i])),
        // Generate additional text slides if present
        ...(text.additionalSlides || []).map((slide, i) => (ctx: CanvasRenderingContext2D) => drawGenericSlide(ctx, slide.title, slide.content, theme, slideStyles[2 + scenes.length + i])),
        (ctx) => drawConclusionSlide(ctx, text, scenes, theme, slideStyles[2 + scenes.length + (text.additionalSlides?.length || 0)]),
    ];

    const dataUrls: string[] = [];

    for (let i = 0; i < slideGenerators.length; i++) {
        const generate = slideGenerators[i];
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');
        
        await generate(ctx);
        dataUrls.push(canvas.toDataURL('image/png'));
    }

    return dataUrls;
}