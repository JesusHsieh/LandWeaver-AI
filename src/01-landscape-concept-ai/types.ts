
export type Point = {
  x: number;
  y: number;
};

export enum ToolMode {
  SELECT = 'SELECT',
  BACKGROUND = 'BACKGROUND', // New mode for background settings
  SCALE = 'SCALE',       // Scale calibration tool
  BOUNDARY = 'BOUNDARY', // Base site shape
  BUBBLE = 'BUBBLE',     // Functional zones (water, platform)
  PATH = 'PATH',         // Circulation (roads, paths)
}

// New: Background Environment Type
export enum BackgroundType {
  NONE = 'NONE',
  GRASS = 'GRASS',
  SNOW = 'SNOW',
  DESERT = 'DESERT',
  SOIL = 'SOIL',
  FOREST = 'FOREST',
}

// 1. Terrain Materials for Boundary
export enum TerrainMaterial {
  NONE = 'NONE',            // 未設定
  GRASS = 'GRASS',          // 草地
  SOIL = 'SOIL',            // 土壤
  PAVEMENT = 'PAVEMENT',    // 硬鋪面
  WOOD_DECK = 'WOOD_DECK',  // 木棧板
  WATER = 'WATER',          // 水體
  GRAVEL = 'GRAVEL',        // 碎石
}

// 2. Path Materials (Texture) - Significantly Expanded
export enum PathMaterial {
  NONE = 'NONE',                 // 未設定 (Default)
  
  // Basics
  CONCRETE = 'CONCRETE',         // 混凝土
  CEMENT_FINISH = 'CEMENT_FINISH', // 水泥粉光
  ASPHALT = 'ASPHALT',           // 柏油
  
  // Stone / Masonry
  STONE_SLAB = 'STONE_SLAB',     // 石板
  GRANITE = 'GRANITE',           // 花崗岩
  MARBLE = 'MARBLE',             // 大理石
  SLATE = 'SLATE',               // 板岩
  BLUESTONE = 'BLUESTONE',       // 青石
  SANDSTONE = 'SANDSTONE',       // 砂岩
  LIMESTONE = 'LIMESTONE',       // 石灰岩
  ANDESITE = 'ANDESITE',         // 安山岩
  RANDOM_STONE = 'RANDOM_STONE', // 亂石拼貼 (Crazy Paving)
  COBBLESTONE = 'COBBLESTONE',   // 鵝卵石
  MOSAIC_STONE = 'MOSAIC_STONE', // 馬賽克拼貼
  
  // Brick / Pavers
  BRICK = 'BRICK',               // 紅磚
  CLAY_PAVER = 'CLAY_PAVER',     // 陶磚
  INTERLOCKING = 'INTERLOCKING', // 連鎖磚
  GRASS_PAVERS = 'GRASS_PAVERS', // 植草磚
  TERRAZZO = 'TERRAZZO',         // 磨石子
  TILE = 'TILE',                 // 戶外磁磚
  
  // Wood / Composite
  WOOD_DECK = 'WOOD_DECK',       // 實木棧道
  WPC = 'WPC',                   // 塑木
  BAMBOO = 'BAMBOO',             // 竹鋪面
  OLD_TIE = 'OLD_TIE',           // 枕木
  
  // Soft / Loose
  GRAVEL = 'GRAVEL',             // 碎石
  PEBBLE_WASH = 'PEBBLE_WASH',   // 抿石子
  SAND = 'SAND',                 // 沙地
  MULCH = 'MULCH',               // 木屑/樹皮
  RED_CLAY = 'RED_CLAY',         // 紅土
  PU_TRACK = 'PU_TRACK',         // PU跑道
}

export type ArrowType = 'FILLED' | 'LINEAR';
export type LineStyle = 'SOLID' | 'DASHED'; // New: Line Style

export interface Shape {
  id: string;
  type: ToolMode;
  points: Point[];
  label?: string;
  showLabel?: boolean; // New: Toggle label visibility
  
  // Dimensions
  pathWidth?: number; // meters
  
  // Arrows for paths
  arrowStart?: boolean; // New: Arrow at start
  arrowEnd?: boolean;   // New: Arrow at end
  arrowType?: ArrowType; // New: Style of the arrowhead

  // Line Style
  lineStyle?: LineStyle; // New: Solid or Dashed line

  // Visual/Material Properties
  terrainMaterial?: TerrainMaterial;
  pathMaterial?: PathMaterial; // Only Material now, no Style
  
  color: string;
}

export enum RenderStyle {
  REALISTIC = 'REALISTIC',
  CAD = 'CAD',
  SKETCH_COLOR_PENCIL = 'SKETCH_COLOR_PENCIL',
  SKETCH_MARKER = 'SKETCH_MARKER',
  WATERCOLOR = 'WATERCOLOR',
  BUBBLE_DIAGRAM = 'BUBBLE_DIAGRAM', // New Style
  MINIMALIST_BW = 'MINIMALIST_BW', // Minimalist Black & White
  BLUEPRINT = 'BLUEPRINT',         // Blueprint
  VINTAGE_MAP = 'VINTAGE_MAP',     // Vintage Paper
  NIGHT_RENDER = 'NIGHT_RENDER',   // Night View
  DIGITAL_PAINTING = 'DIGITAL_PAINTING', // Digital Art
  CLAY_MODEL = 'CLAY_MODEL',       // Clay Model
  
  // New Styles
  WOODEN_MODEL = 'WOODEN_MODEL',   // Wooden architectural model
  COLLAGE = 'COLLAGE',             // Post-digital collage
  INK_WASH = 'INK_WASH',           // Traditional Ink Wash
  PAPER_CUTOUT = 'PAPER_CUTOUT',   // Paper Cutout Art
  VECTOR_ART = 'VECTOR_ART',       // Flat Vector Art
  CYBERPUNK = 'CYBERPUNK',         // Cyberpunk
  STORYBOOK = 'STORYBOOK',         // Children's book
  TECHNICAL_PEN = 'TECHNICAL_PEN', // Fine liner pen
  IMPRESSIONIST = 'IMPRESSIONIST', // Impressionism
  LEGO = 'LEGO',                   // Lego
}