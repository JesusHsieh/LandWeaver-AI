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
    weather:    'cwa'           | 'fallback';
    airQuality: 'epa'           | 'fallback';
    solar:      'pvgis'         | 'fallback';
    elevation:  'openElevation' | 'fallback';
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
    admin:  'nlsc'    | 'fallback';
    zoning: 'nlscWfs' | 'fallback';
  };
  recommendations: {
    topPlants: PlantRecommendation[];
    avoidPlants: { name: string; reason: string }[];
    designSuggestions: string[];
    riskWarnings: string[];
  };
}

export interface MapSettings {
  showOsmBuildings: boolean;
  showOsmImagery: boolean;
  showGoogle3DTiles: boolean;
  showShadows: boolean;
  showTerrain: boolean;
  showMicroClimate: boolean;
  showSlopeAnalysis: boolean;
  showZoning: boolean; 
  showUrbanStress: boolean;
  showHydrology: boolean; // New
  showSoilAnalysis: boolean; // New
  showPlantMatching: boolean; // New
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
  showGoogle3DTiles: true,
  showShadows: true,
  showTerrain: true,
  showMicroClimate: false,
  showSlopeAnalysis: false,
  showZoning: false,
  showUrbanStress: false,
  showHydrology: false,
  showSoilAnalysis: false,
  showPlantMatching: false,
  currentTime: new Date(),
  selectedBase: {
    lat: 25.0339, 
    lng: 121.5644,
    name: "台北中央商務區 (Taipei CBD)"
  },
  analysisPoint: {
    lat: 25.0339,
    lng: 121.5644
  }
};
