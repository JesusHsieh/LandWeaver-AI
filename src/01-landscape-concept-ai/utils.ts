
import { Point, PathMaterial, TerrainMaterial, BackgroundType, RenderStyle } from './types';

// Calculate Euclidean distance between two points
export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Calculate total length of a polyline
export const getPolylineLength = (points: Point[], scale: number): number => {
  if (scale === 0) return 0;
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += getDistance(points[i], points[i + 1]);
  }
  return length / scale;
};

// Calculate Polygon Area (Shoelace Formula)
export const getPolygonArea = (points: Point[], scale: number): number => {
  if (points.length < 3 || scale === 0) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2) / (scale * scale);
};

// Get center point of a polygon for labeling
export const getPolygonCentroid = (points: Point[]): Point => {
  if (points.length === 0) return { x: 0, y: 0 };
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
};

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Convert base64 data URL to raw base64 string (remove prefix)
export const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};

// Generate a deterministic Hex color from a string (Material Name)
// Avoids Green hues (approx 80-170) to prevent confusion with Green Bubbles
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate Hue (0-360)
  let h = Math.abs(hash) % 360;
  
  // Shift Hue if it falls in the Green range (70 - 170)
  // We want to avoid the "Green Bubble" look.
  if (h > 70 && h < 170) {
     h = (h + 120) % 360;
  }

  // Use fixed Saturation (75%) and Lightness (50%) for vibrant, solid path lines
  return hslToHex(h, 75, 45);
};

// Helper: HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// --- COLOR PALETTE FOR MATERIALS ---
// This ensures consistent visual representation on the canvas
export const PATH_MATERIAL_COLORS: Record<PathMaterial, string> = {
  [PathMaterial.NONE]: '#000000',
  
  // Greys / Concrete
  [PathMaterial.CONCRETE]: '#9CA3AF', // Gray 400
  [PathMaterial.CEMENT_FINISH]: '#D1D5DB', // Gray 300
  [PathMaterial.ASPHALT]: '#374151', // Gray 700
  
  // Stones (Cool Tones)
  [PathMaterial.STONE_SLAB]: '#6B7280', // Gray 500
  [PathMaterial.GRANITE]: '#4B5563', // Gray 600
  [PathMaterial.MARBLE]: '#E5E7EB', // Gray 200
  [PathMaterial.SLATE]: '#475569', // Slate 600
  [PathMaterial.BLUESTONE]: '#64748B', // Slate 500
  [PathMaterial.ANDESITE]: '#1F2937', // Gray 800
  [PathMaterial.COBBLESTONE]: '#78716C', // Stone 500
  
  // Stones (Warm/Beige Tones)
  [PathMaterial.SANDSTONE]: '#D6D3D1', // Stone 300
  [PathMaterial.LIMESTONE]: '#F3F4F6', // Gray 100
  [PathMaterial.RANDOM_STONE]: '#94A3B8', // Slate 400
  [PathMaterial.MOSAIC_STONE]: '#FCA5A5', // Red 300
  
  // Bricks (Reds/Oranges)
  [PathMaterial.BRICK]: '#DC2626', // Red 600
  [PathMaterial.CLAY_PAVER]: '#EA580C', // Orange 600
  [PathMaterial.INTERLOCKING]: '#F97316', // Orange 500
  [PathMaterial.TERRAZZO]: '#FDE047', // Yellow 300
  [PathMaterial.TILE]: '#06B6D4', // Cyan 500
  
  // Green
  [PathMaterial.GRASS_PAVERS]: '#84CC16', // Lime 500
  
  // Woods (Browns)
  [PathMaterial.WOOD_DECK]: '#B45309', // Amber 700
  [PathMaterial.WPC]: '#92400E', // Amber 800
  [PathMaterial.BAMBOO]: '#D97706', // Amber 600
  [PathMaterial.OLD_TIE]: '#78350F', // Amber 900
  
  // Loose
  [PathMaterial.GRAVEL]: '#A8A29E', // Stone 400
  [PathMaterial.PEBBLE_WASH]: '#E7E5E4', // Stone 200
  [PathMaterial.SAND]: '#FCD34D', // Amber 300
  [PathMaterial.MULCH]: '#57534E', // Stone 600
  [PathMaterial.RED_CLAY]: '#B91C1C', // Red 700
  [PathMaterial.PU_TRACK]: '#EF4444', // Red 500
};

// --- SHARED LABELS ---

export const STYLE_LABELS: Record<RenderStyle, string> = {
  [RenderStyle.REALISTIC]: '真實擬真 (Realistic)',
  [RenderStyle.CAD]: 'CAD 工程圖 (AutoCAD)',
  [RenderStyle.BUBBLE_DIAGRAM]: '概念泡泡圖 (Bubble Diagram)', // New Style
  [RenderStyle.SKETCH_COLOR_PENCIL]: '手繪色鉛筆 (Color Pencil)',
  [RenderStyle.SKETCH_MARKER]: '手繪馬克筆 (Marker)',
  [RenderStyle.WATERCOLOR]: '水彩渲染 (Watercolor)',
  [RenderStyle.MINIMALIST_BW]: '極簡黑白 (Minimalist B&W)',
  [RenderStyle.BLUEPRINT]: '建築藍曬圖 (Blueprint)',
  [RenderStyle.VINTAGE_MAP]: '復古圖紙 (Vintage)',
  [RenderStyle.NIGHT_RENDER]: '夜景照明 (Night View)',
  [RenderStyle.DIGITAL_PAINTING]: '數位概念藝術 (Digital Art)',
  [RenderStyle.CLAY_MODEL]: '白模模型 (Clay Model)',
  // New Styles
  [RenderStyle.WOODEN_MODEL]: '木製模型 (Wooden Model)',
  [RenderStyle.COLLAGE]: '建築拼貼 (Post-Digital Collage)',
  [RenderStyle.TECHNICAL_PEN]: '針筆線稿 (Technical Pen)',
  [RenderStyle.INK_WASH]: '水墨畫 (Ink Wash)',
  [RenderStyle.PAPER_CUTOUT]: '紙藝層疊 (Paper Cutout)',
  [RenderStyle.VECTOR_ART]: '扁平向量 (Vector Art)',
  [RenderStyle.CYBERPUNK]: '賽博龐克 (Cyberpunk)',
  [RenderStyle.STORYBOOK]: '童書插畫 (Storybook)',
  [RenderStyle.IMPRESSIONIST]: '印象派 (Impressionist)',
  [RenderStyle.LEGO]: '樂高積木 (Lego)',
};

export const BACKGROUND_LABELS: Record<BackgroundType, string> = {
    [BackgroundType.NONE]: '無 (請選擇)',
    [BackgroundType.GRASS]: '草地 (Grass)',
    [BackgroundType.SNOW]: '雪地 (Snow)',
    [BackgroundType.DESERT]: '沙漠 (Desert)',
    [BackgroundType.SOIL]: '土壤 (Soil)',
    [BackgroundType.FOREST]: '森林地表 (Forest)',
};

export const TERRAIN_MATERIAL_LABELS: Record<TerrainMaterial, string> = {
    [TerrainMaterial.NONE]: '--- 請選擇材質 ---',
    [TerrainMaterial.GRASS]: '草地 (Grass)',
    [TerrainMaterial.PAVEMENT]: '混凝土/硬鋪面 (Concrete)',
    [TerrainMaterial.SOIL]: '土壤 (Soil)',
    [TerrainMaterial.WOOD_DECK]: '木棧板 (Wood Deck)',
    [TerrainMaterial.GRAVEL]: '碎石 (Gravel)',
    [TerrainMaterial.WATER]: '水體 (Water)',
};

export const PATH_MATERIAL_LABELS: Record<PathMaterial, string> = {
    [PathMaterial.NONE]: '無材質 (線條/泡泡圖用)',
    
    // Basics
    [PathMaterial.CONCRETE]: '清水混凝土 (Concrete)',
    [PathMaterial.CEMENT_FINISH]: '水泥粉光 (Cement Finish)',
    [PathMaterial.ASPHALT]: '柏油路面 (Asphalt)',
    
    // Stone
    [PathMaterial.STONE_SLAB]: '大塊石板 (Stone Slab)',
    [PathMaterial.GRANITE]: '花崗岩 (Granite)',
    [PathMaterial.MARBLE]: '大理石 (Marble)',
    [PathMaterial.SLATE]: '板岩 (Slate)',
    [PathMaterial.BLUESTONE]: '青石 (Bluestone)',
    [PathMaterial.SANDSTONE]: '砂岩 (Sandstone)',
    [PathMaterial.LIMESTONE]: '石灰岩 (Limestone)',
    [PathMaterial.ANDESITE]: '安山岩 (Andesite)',
    [PathMaterial.RANDOM_STONE]: '亂石拼貼 (Crazy Paving)',
    [PathMaterial.COBBLESTONE]: '鵝卵石 (Cobblestone)',
    [PathMaterial.MOSAIC_STONE]: '馬賽克拼貼 (Mosaic)',

    // Brick
    [PathMaterial.BRICK]: '紅磚 (Red Brick)',
    [PathMaterial.CLAY_PAVER]: '陶磚 (Clay Paver)',
    [PathMaterial.INTERLOCKING]: '連鎖磚 (Interlocking)',
    [PathMaterial.GRASS_PAVERS]: '植草磚 (Grass Pavers)',
    [PathMaterial.TERRAZZO]: '磨石子 (Terrazzo)',
    [PathMaterial.TILE]: '戶外磁磚 (Outdoor Tile)',

    // Wood
    [PathMaterial.WOOD_DECK]: '實木棧道 (Wood Deck)',
    [PathMaterial.WPC]: '塑木 (WPC)',
    [PathMaterial.BAMBOO]: '竹鋪面 (Bamboo)',
    [PathMaterial.OLD_TIE]: '枕木 (Railroad Tie)',

    // Soft/Other
    [PathMaterial.GRAVEL]: '碎石 (Gravel)',
    [PathMaterial.PEBBLE_WASH]: '抿石子 (Pebble Wash)',
    [PathMaterial.SAND]: '景觀沙地 (Sand)',
    [PathMaterial.MULCH]: '樹皮/木屑 (Mulch)',
    [PathMaterial.RED_CLAY]: '紅土 (Red Clay)',
    [PathMaterial.PU_TRACK]: 'PU 跑道 (Rubber)',
};