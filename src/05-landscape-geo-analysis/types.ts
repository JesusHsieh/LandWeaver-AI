/**
 * 基地資料：每個數值都直接來自外部資料來源或標準公式（天文、DEM 差分）。
 * 查詢失敗時欄位為 null，畫面顯示「無資料」，不以估算值或預設值代替。
 */
export interface MicroClimateData {
  // ── 即時氣象：Open-Meteo 格點，失敗時改用中央氣象署最近測站 ──
  temp: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null; // 0-360
  rainfall: number | null;
  /** 地表 0 cm 溫度（Open-Meteo 模式值；中央氣象署測站無此項） */
  surfaceTemp: number | null;
  // ── 空氣品質：環境部測站；未設定 Key 時改用 Open-Meteo CAMS 模式值（僅 PM2.5）──
  pm25: number | null;
  /** 台灣 AQI，只有環境部測站提供 */
  aqi: number | null;
  // ── 太陽位置：天文公式，隨時間軸即時計算 ──
  solarAzimuth: number;
  solarAltitude: number;
  // ── PVGIS-ERA5：最佳傾角斜面的日射量 ──
  /** 日均峰值日照時數（= 斜面日均日射量 kWh/m²） */
  peakSunHours: number | null;
  /** 斜面年日射量 kWh/m² */
  annualIrradiance: number | null;
  recommendedTilt: number | null;
  /** 12 個月斜面日射量，以最大月 = 100 正規化 */
  monthlyIrradiance: number[] | null;
  // ── DEM：Open-Elevation，中心點與東西南北約 111 m 共 5 點 ──
  elevation: number | null;   // m
  slopePct: number | null;    // %
  /** 坡面朝向（下坡方向）0=N 90=E；平坦或無資料為 null */
  aspectDeg: number | null;
  /** 「東南」等；平坦時為「平坦」，無資料為 null */
  aspectDir: string | null;
  /** m⁻¹，Laplacian：+ 凹地（聚水）／− 凸地（散水） */
  planCurvature: number | null;
  _sources: {
    weather:    'openMeteo' | 'cwa' | 'none';
    airQuality: 'epa' | 'openMeteo' | 'none';
    solar:      'pvgis' | 'none';
    elevation:  'openElevation' | 'none';
  };
}

export type ZoningCategory =
  | '高熱曝曬區'
  | '半日照區'
  | '陰影區'
  | '乾陰區'
  | '潮濕積水區'
  | '強風區'
  | '高溫低地區';

export type Level = '高' | '中' | '低';

export interface PlantMatch {
  id: string;
  name: string;
  type: '喬木' | '灌木' | '地被';
  lightLimit: string;
  waterLimit: string;
  /** 符合的篩選條件（規則，非 AI） */
  reasons: string[];
}

/** 水利署淹水潛勢圖的一個降雨情境 */
export interface FloodScenario {
  /** 延時（小時） */
  hours: number;
  /** 累積雨量（mm） */
  rainfall: number;
  /** 淹水深度分級 1–5（0.3–0.5 / 0.5–1.0 / 1.0–2.0 / 2.0–3.0 / >3.0 m）；不在潛勢範圍為 null */
  floodClass: number | null;
}

/** 官方災害潛勢圖資的點位查詢結果；查詢失敗的項目為 null */
export interface SiteHazards {
  flood: FloodScenario[] | null;
  /** 地調中心初級土壤液化潛勢；'未列入' = 不在分級範圍 */
  liquefaction: Level | '未列入' | null;
  /** 是否位於地調中心岩屑崩滑潛勢區 */
  debrisSlide: boolean | null;
}

/** 由 MicroClimateData 以固定規則推導，不含任何估算數值 */
export interface LandscapeDesignData {
  /** 微氣候分區（規則分類）；所需資料不全時為 null */
  zoning: { category: ZoningCategory; basis: string } | null;
  urbanStress: {
    /** 同 MicroClimateData.surfaceTemp */
    surfaceTemp: number | null;
    /** 風速 <3 m/s 的平坦低地（海拔 <80 m、坡度 <5%） */
    stagnantLowland: boolean | null;
    /** 風速 >5 m/s 且坡度 >10% */
    windySlope: boolean | null;
  };
  /** 地表排水：依 DEM 坡度分級（沒有土壤資料，不推估入滲率） */
  drainage: {
    speed: '快' | '中' | '慢' | null;
    waterloggingRisk: Level | null;
    /** 地表逕流方向 = 下坡方向；平坦或無資料為 null */
    flowDirection: number | null;
  };
  /** 夏至、春秋分、冬至的正午太陽高度角（°）與晝長（h），天文公式 */
  seasonalSun: { label: string; noonAltitude: number; dayLength: number }[];
  /** 植栽篩選用的環境等級（規則） */
  traits: { sun: Level | null; temp: Level | null; wind: Level | null; water: Level | null };
  landUseZone: string;
  /** 淹水、土壤液化、岩屑崩滑潛勢（官方圖資點位查詢） */
  hazards: SiteHazards;
  _sources: {
    admin:  'nlsc' | 'none';
    zoning: 'nlscWms' | 'none';
  };
  recommendations: {
    plants: PlantMatch[];
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
  showZoningRegulation: boolean; // 08I 容積率/建蔽率 分區查表
  showLandscapeStrategy: boolean; // 場址規則檢核（services/siteRules.ts）
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
  showThsrTrains: boolean;         // 高鐵列車即時位置 (TDX 時刻表，沿軌道移動)
  showTRALayer: boolean;           // 台鐵路線 + 站點
  showTRATrains: boolean;          // 台鐵列車即時位置 (TDX 時刻表 + 即時誤點，沿軌道移動)
  showTaoyuanMrtLayer: boolean;    // 桃捷路線 + 站點
  showTaoyuanMrtTrains: boolean;   // 桃捷列車動態 (TDX LiveBoard)
  showTaichungMrtLayer: boolean;   // 中捷路線 + 站點
  showTaichungMrtTrains: boolean;  // 中捷列車動態 (TDX LiveBoard)
  showKaohsiungMrtLayer: boolean;  // 高捷路線 + 站點
  showKaohsiungMrtTrains: boolean; // 高捷列車動態 (TDX LiveBoard)
  showYouBikeLayer: boolean;       // YouBike 站點密度
  // ── Analysis tools
  bufferRadius: 0 | 100 | 300 | 500 | 800;
  showMeasureTool: boolean;        // 兩點距離量測
  showElevProfile: boolean;        // 高程剖面（兩點取樣）
  showNdviLayer: boolean;          // OSM 綠地標記（公園、林地、草地）
  showBuildingDensity: boolean;    // 建物密度熱區
  showStreetTreeLayer: boolean;    // 行道樹（台北市官方 / OSM fallback）
  // ── 交通區位分析
  showRoadLayer: boolean;          // OSM 道路等級
  showPoiLayer: boolean;           // 生活機能 POI（學校/公園/市場/公共設施）
  currentTime: Date;
  selectedBase: {
    lat: number;
    lng: number;
    name: string;
    /** 由搜尋定位時，相機飛到地面以上這個高度（公尺）；點地圖時不設，維持目前高度 */
    viewHeight?: number;
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
  showZoningRegulation: false,
  showLandscapeStrategy: false,
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
  bufferRadius: 0,
  showMeasureTool: false,
  showElevProfile: false,
  showNdviLayer: false,
  showBuildingDensity: false,
  showStreetTreeLayer: false,
  showRoadLayer: false,
  showPoiLayer: false,
  currentTime: new Date(),
  selectedBase: {
    lat: 25.0339, 
    lng: 121.5644,
    name: "台北中央商務區 (Taipei CBD)"
  },
  analysisPoint: null
};
