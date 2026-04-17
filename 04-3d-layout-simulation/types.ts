

export interface Point {
  x: number;
  y: number;
}

export enum ViewStyle {
  // 常用風格
  REALISTIC = '真實模擬',
  MODERN = '現代室內',
  MINIMALIST = '極簡風格',
  NORDIC = '北歐風格',
  JAPANESE = '日式禪風',
  INDUSTRIAL = '工業閣樓',
  
  // 特定風格
  LUXURY = '奢華古典',
  NEW_CHINESE = '新中式',
  AMERICAN = '美式鄉村',
  FRENCH = '法式風格',
  MEDITERRANEAN = '地中海風',
  TROPICAL = '熱帶度假',
  BOHEMIAN = '波希米亞',
  
  // 藝術與復古
  ART_DECO = '裝飾藝術',
  BRUTALISM = '粗野主義',
  RETRO = '復古懷舊',
  CYBERPUNK = '賽博龐克',
  FUTURISTIC = '未來科幻',

  // 特殊渲染
  SKETCH = '建築草圖',
  PENCIL = '鉛筆素描',
  WATERCOLOR = '水彩渲染',
  INK = '水墨風格',
  CLAY = '黏土模型',
  WIREFRAME = '線框結構',
  
  // 高質感渲染
  UE5 = '虛幻引擎5',
  CINEMATIC = '電影級光影',
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GenerationConfig {
  style: ViewStyle;
  prompt: string;
  ratio: AspectRatio;
}

export interface ViewerState {
  imageSrc: string | null;
  marker: Point | null; // Coordinates in percentage (0-100)
  angle: number; // 0-360 degrees
}