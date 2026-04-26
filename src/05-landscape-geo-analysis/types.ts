export interface MicroClimateData {
  temp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number; // 0-360
  rainfall: number;
  pm25: number;
  aqi: number;            // Air Quality Index (replaces airPh)
  solarAzimuth: number;
  solarAltitude: number;
  peakSunHours: number;
  shadowCoverage: number;
  annualIrradiance: number;
  recommendedTilt: number;
  monthlyIrradiance: number[]; // 12 months for chart (normalized 0-100)
  // Real terrain data from Open-Elevation
  elevation: number;          // metres above sea level
  slopePct: number;           // slope in %
  aspectDeg: number;          // aspect in degrees (0=N, 90=E, 180=S, 270=W)
  aspectDir: string;          // human-readable e.g. "東南"
  drainageCoeff: number;      // rational method C value (0–1)
  planCurvature: number;      // m⁻¹, Laplacian: +凹地(聚水) / -凸地(散水)
  // Source tracking — 'live' = real API, 'fallback' = estimated value
  _sources: {
    weather:    'openMeteo' | 'cwa' | 'fallback';
    airQuality: 'epa'              | 'fallback';
    solar:      'pvgis'            | 'fallback';
    elevation:  'openElevation'    | 'fallback';
  };
}

export type ZoningCategory = 
  | '高熱曝曬區' 
  | '半日照區' 
  | '陰影區' 
  | '乾陰區' 
  | '潮濕積水區' 
  | '強風區' 
  | '都市熱島區';

export interface PlantRecommendation {
  id: string;
  name: string;
  type: '喬木' | '灌木' | '地被';
  score: number;
  lightLimit: string;
  waterLimit: string;
}

export interface LandscapeDesignData {
  zoning: {
    category: ZoningCategory;
    intensity: number; // 0-1
  };
  urbanStress: {
    surfaceHeatIndex: number; // 0-1
    albedo: number;
    surfaceTemp: number;
    windAdjustment: number; // multiplier
    canyonEffect: boolean;
    downdraftRisk: boolean;
  };
  soil: {
    infiltrationRate: number; // mm/hr
    drainageSpeed: '快' | '中' | '慢';
    waterloggingRisk: '低' | '中' | '高';
  };
  hydrology: {
    flowDirection: number; // 0-360
    catchmentArea: number; // m2
    pondingDepth: number; // mm
  };
  seasonalSun: {
    summerSolstice: number; // shadow coverage %
    winterSolstice: number;
    equinox: number;
  };
  aiSummary: {
    traits: {
      sun: '高' | '中' | '低';
      temp: '高' | '中' | '低';
      wind: '高' | '中' | '低';
      water: '高' | '中' | '低';
    };
  };
  landUseZone: string; // Taiwan Urban Planning Zone from NLSC
  _sources: {
    admin:  'nlsc'               | 'fallback';
    zoning: 'nlscWms' | 'nlscWfs' | 'fallback';
  };
  recommendations: {
    topPlants: PlantRecommendation[];
    avoidPlants: { name: string; reason: string }[];
    designSuggestions: string[];
    riskWarnings: string[];
  };
}

export interface MapSettings {
  // ── 基礎圖層
  showOsmBuildings: boolean;
  showOsmImagery: boolean;
  showGoogle3DTiles: boolean;
  showShadows: boolean;
  showTerrain: boolean;
  // ── 國土測繪 WMTS 圖層
  showNlscEmap: boolean;    // 電子地圖 (EMAP)
  showNlscPhoto: boolean;   // 正射影像 (PHOTO2)
  // ── 分析工具
  showMicroClimate: boolean;
  showSlopeAnalysis: boolean;
  // ── 景觀決策層
  showZoning: boolean;
  showUrbanStress: boolean;
  showHydrology: boolean;
  showSoilAnalysis: boolean;
  showPlantMatching: boolean;
  // ── 地政法規查詢 (內政部地政司 · 8路並行)
  showUrbanPlan: boolean;       // 08A 都市計畫  urban.cpami.gov.tw
  showLiquefaction: boolean;    // 08B 地盤液化  liquidation.tw
  showDebrisFlow: boolean;      // 08C 土石流潛勢 246.swcb.gov.tw
  showActiveFault: boolean;     // 08D 活動斷層  CGS WMS
  showFloodPotential: boolean;  // 08E 淹水潛勢  fsp.wra.gov.tw
  showSlopeSensitive: boolean;  // 08F 山坡地/地質敏感區 soil.swcb.gov.tw
  showDrinkingWater: boolean;   // 08G 飲用水保護區 epa.gov.tw
  showCulturalHeritage: boolean;// 08H 文化資產  文化部 BOCH
  // ── 國土測繪額外圖層
  showNlscLandSect: boolean;   // 地籍圖 LANDSECT
  showNlscContour: boolean;    // 等高線 MOI_CONTOUR
  showNlscHillShade: boolean;  // 山體陰影 MOI_HILLSHADE
  showNlscAdminBound: boolean; // 行政區界 TOWN
  // ── 底圖主題 / OSM 3D 色彩
  baseTheme: 'OSM' | 'DARK' | 'LIGHT';
  osmBuildingHue: number;     // 0-360
  osmBuildingOpacity: number; // 0-1
  // ── 交通流動層 (Cesium GroundPolylinePrimitive)
  showMrtLayer: boolean;           // 台北捷運路線 + 站點
  showMrtTrains: boolean;          // 捷運列車動態 (TDX LiveBoard)
  showThsrLayer: boolean;          // 高鐵路線 + 站點
  showThsrTrains: boolean;         // 高鐵列車動態 (時刻表模擬)
  showTRALayer: boolean;           // 台鐵路線 + 站點
  showTRATrains: boolean;          // 台鐵列車動態 (TDX 時刻表模擬)
  showTaoyuanMrtLayer: boolean;    // 桃捷路線 + 站點
  showTaoyuanMrtTrains: boolean;   // 桃捷列車動態 (TDX LiveBoard)
  showTaichungMrtLayer: boolean;   // 中捷路線 + 站點
  showTaichungMrtTrains: boolean;  // 中捷列車動態 (TDX LiveBoard)
  showKaohsiungMrtLayer: boolean;  // 高捷路線 + 站點
  showKaohsiungMrtTrains: boolean; // 高捷列車動態 (TDX LiveBoard)
  showYouBikeLayer: boolean;       // YouBike 站點密度
  currentTime: Date;
  selectedBase: {
    lat: number;
    lng: number;
    name: string;
  } | null;
  analysisPoint: {
    lat: number;
    lng: number;
  } | null;
}

export const INITIAL_SETTINGS: MapSettings = {
  showOsmBuildings: false,
  showOsmImagery: true,
  showGoogle3DTiles: false,
  showShadows: true,
  showTerrain: false,
  showNlscEmap: false,
  showNlscPhoto: false,
  showMicroClimate: false,
  showSlopeAnalysis: false,
  showZoning: false,
  showUrbanStress: false,
  showHydrology: false,
  showSoilAnalysis: false,
  showPlantMatching: false,
  showUrbanPlan: false,
  showLiquefaction: false,
  showDebrisFlow: false,
  showActiveFault: false,
  showFloodPotential: false,
  showSlopeSensitive: false,
  showDrinkingWater: false,
  showCulturalHeritage: false,
  showNlscLandSect: false,
  showNlscContour: false,
  showNlscHillShade: false,
  showNlscAdminBound: false,
  baseTheme: 'OSM',
  osmBuildingHue: 35,
  osmBuildingOpacity: 0.85,
  showMrtLayer: false,
  showMrtTrains: false,
  showThsrLayer: false,
  showThsrTrains: false,
  showTRALayer: false,
  showTRATrains: false,
  showTaoyuanMrtLayer: false,
  showTaoyuanMrtTrains: false,
  showTaichungMrtLayer: false,
  showTaichungMrtTrains: false,
  showKaohsiungMrtLayer: false,
  showKaohsiungMrtTrains: false,
  showYouBikeLayer: false,
  currentTime: new Date(),
  selectedBase: {
    lat: 25.0339, 
    lng: 121.5644,
    name: "台北中央商務區 (Taipei CBD)"
  },
  analysisPoint: null
};
