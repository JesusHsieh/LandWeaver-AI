// ============================================================
// Pure landscape recommendation / zone classification logic
// ============================================================

import { MicroClimateData, ZoningCategory, PlantRecommendation } from '../types';
import { getZoningRegulation } from './zoningTable';

// ============================================================
// Plant Database
// ============================================================
const PLANT_DB: Omit<PlantRecommendation, 'score'>[] = [
  { id: '1',  name: '樟樹 (Camphor)',         type: '喬木', lightLimit: 'Full Sun',       waterLimit: 'Medium' },
  { id: '2',  name: '楓香 (Sweetgum)',         type: '喬木', lightLimit: 'Full Sun',       waterLimit: 'Medium' },
  { id: '3',  name: '姑婆芋 (Elephant Ear)',   type: '地被', lightLimit: 'Shade',          waterLimit: 'High'   },
  { id: '4',  name: '虎尾蘭 (Snake Plant)',    type: '灌木', lightLimit: 'Shade/Partial',  waterLimit: 'Low'    },
  { id: '5',  name: '仙人掌 (Cactus)',         type: '灌木', lightLimit: 'Full Sun',       waterLimit: 'Low'    },
  { id: '6',  name: '苦楝 (Melia)',            type: '喬木', lightLimit: 'Full Sun',       waterLimit: 'Low'    },
  { id: '7',  name: '大葉欖仁 (Terminalia)',   type: '喬木', lightLimit: 'Full Sun',       waterLimit: 'Any'    },
  { id: '8',  name: '七里香 (Orange Jasmine)', type: '灌木', lightLimit: 'Full/Partial',   waterLimit: 'Medium' },
  { id: '9',  name: '海桐 (Pittosporum)',      type: '灌木', lightLimit: 'Full/Partial',   waterLimit: 'Medium' },
  { id: '10', name: '馬尼拉草 (Manila Grass)', type: '地被', lightLimit: 'Full Sun',       waterLimit: 'Low'    },
  { id: '11', name: '蕨類 (Ferns)',            type: '地被', lightLimit: 'Shade',          waterLimit: 'High'   },
  { id: '12', name: '杜鵑 (Azalea)',           type: '灌木', lightLimit: 'Partial Sun',    waterLimit: 'Medium' },
];

export interface ZoneClassification {
  category: ZoningCategory;
  intensity: number;
}

export interface UrbanStressResult {
  surfaceHeatIndex: number;
  albedo: number;
  surfaceTemp: number;
  windAdjustment: number;
  canyonEffect: boolean;
  downdraftRisk: boolean;
}

export interface SoilResult {
  infiltrationRate: number;
  drainageSpeed: '快' | '中' | '慢';
  waterloggingRisk: '低' | '中' | '高';
}

export interface HydrologyResult {
  flowDirection: number;
  catchmentArea: number;
  pondingDepth: number;
}

export interface RecommendationResult {
  topPlants: PlantRecommendation[];
  avoidPlants: { name: string; reason: string }[];
  designSuggestions: string[];
  riskWarnings: string[];
}

export function classifyZone(microClimate: MicroClimateData): ZoneClassification {
  let category: ZoningCategory = '半日照區';
  let intensity = 0.5;

  const ph = microClimate.peakSunHours;
  const ws = microClimate.windSpeed;
  const t  = microClimate.temp;
  const rr = microClimate.rainfall;
  const dc = microClimate.drainageCoeff;
  const el = microClimate.elevation;

  if (ph >= 4.5) {
    category = '高熱曝曬區';     intensity = 0.72 + (ph - 4.5) / 10;
  } else if (ph < 3.2) {
    category = (rr < 5 && ws > 3) ? '乾陰區' : '陰影區';
    intensity = 0.60 + (3.2 - ph) / 10;
  } else if (ws > 5.0) {
    category = '強風區';         intensity = 0.60 + ws / 30;
  } else if (t > 28 && el < 200) {
    category = '都市熱島區';     intensity = 0.65 + (t - 28) / 30;
  } else if (rr > 10 || dc < 0.28) {
    category = '潮濕積水區';     intensity = 0.60 + Math.min(rr, 50) / 200;
  } else {
    intensity = 0.45 + ph / 20;
  }
  intensity = Math.min(intensity, 1);

  return { category, intensity };
}

export function calcUrbanStress(microClimate: MicroClimateData): UrbanStressResult {
  const el = microClimate.elevation;

  const lapseCorrection  = microClimate.elevation * 0.0065;
  const aspectCorrection = Math.cos((microClimate.aspectDeg - 180) * Math.PI / 180) * 2.0;
  const slopeCorrection  = -Math.min(2.0, microClimate.slopePct * 0.06);
  const localTemp        = microClimate.temp - lapseCorrection + aspectCorrection + slopeCorrection;

  const solarFactor  = Math.min(1, microClimate.peakSunHours / 6.5);
  const exposeFactor = 1 - microClimate.shadowCoverage / 100;
  const tempFactor   = Math.max(0, (localTemp - 24) / 14);
  const surfaceHeatIndex = Math.min(0.90, Math.max(0.10,
    solarFactor * 0.40 + exposeFactor * 0.30 + tempFactor * 0.30
  ));

  const surfaceTemp   = localTemp + surfaceHeatIndex * 10;
  const albedo        = surfaceHeatIndex > 0.60 ? 0.15 : surfaceHeatIndex > 0.40 ? 0.25 : 0.35;

  const topoWindBoost = microClimate.slopePct > 30 ? 1.3 : 1.0;
  const localWindSpeed = microClimate.windSpeed * topoWindBoost;
  const windAdjustment = 1.0 + (localWindSpeed > 5 ? 0.4 : -0.1);

  const isUrbanLowland = el < 80 && microClimate.slopePct < 5;
  const canyonEffect   = localWindSpeed < 3.0 && isUrbanLowland;
  const downdraftRisk  = localWindSpeed > 5.0 && microClimate.slopePct > 10;

  return { surfaceHeatIndex, albedo, surfaceTemp, windAdjustment, canyonEffect, downdraftRisk };
}

export function calcSoil(microClimate: MicroClimateData): SoilResult {
  const baseInfRate   = 50 * (1 - microClimate.drainageCoeff * 0.9);
  const slopeCorr     = Math.max(0.3, 1 - microClimate.slopePct * 0.015);
  const moistureCorr  = microClimate.rainfall > 30 ? 0.5
                      : microClimate.rainfall > 10 ? 0.75 : 1.0;
  const humidityCorr  = microClimate.humidity > 85 ? 0.75
                      : microClimate.humidity > 70 ? 0.90 : 1.0;
  const infiltrationRate = Math.max(1, Math.round(baseInfRate * slopeCorr * moistureCorr * humidityCorr * 10) / 10);

  const drainageSpeed: '快' | '中' | '慢' =
    microClimate.drainageCoeff > 0.6 ? '快' : microClimate.drainageCoeff > 0.3 ? '中' : '慢';
  const waterloggingRisk: '低' | '中' | '高' =
    drainageSpeed === '快' ? '低'
    : drainageSpeed === '慢' && (microClimate.rainfall > 3 || microClimate.humidity > 80)
      ? '高'
    : '中';

  return { infiltrationRate, drainageSpeed, waterloggingRisk };
}

export function calcHydrology(microClimate: MicroClimateData, waterloggingRisk: '低' | '中' | '高'): HydrologyResult {
  const slopeRad      = Math.atan(microClimate.slopePct / 100);
  const baseSCA       = Math.round(50 / Math.max(Math.tan(slopeRad), 0.005));
  const curvFactor    = Math.max(0.15, Math.min(6, 1 + microClimate.planCurvature * 8000));
  const catchmentArea = Math.min(5000, Math.max(10, Math.round(baseSCA * curvFactor)));

  const flowDirection = microClimate.aspectDeg;
  const humidityIndex = Math.max(0, (microClimate.humidity - 60) / 40);
  const pondingDepth  =
    waterloggingRisk === '高'
      ? Math.max(1, Math.round(microClimate.rainfall * 5 + humidityIndex * 25))
    : waterloggingRisk === '中'
      ? Math.max(0, Math.round(microClimate.rainfall * 2))
    : 0;

  return { flowDirection, catchmentArea, pondingDepth };
}

export function buildRecommendations(
  microClimate: MicroClimateData,
  category: ZoningCategory,
  drainageSpeed: '快' | '中' | '慢',
  waterloggingRisk: '低' | '中' | '高',
  urbanStress: UrbanStressResult,
  zone: string
): RecommendationResult {
  const aiSummary = {
    traits: {
      sun:   microClimate.peakSunHours > 6 ? '高' : microClimate.peakSunHours > 3 ? '中' : '低',
      temp:  microClimate.temp  > 28 ? '高' : microClimate.temp  > 20 ? '中' : '低',
      wind:  microClimate.windSpeed > 6 ? '高' : microClimate.windSpeed > 3 ? '中' : '低',
      water: (microClimate.rainfall > 20 || waterloggingRisk === '高') ? '高' :
             microClimate.rainfall > 5 ? '中' : '低',
    } as { sun: '高'|'中'|'低'; temp: '高'|'中'|'低'; wind: '高'|'中'|'低'; water: '高'|'中'|'低' }
  };

  const topPlants: PlantRecommendation[] = PLANT_DB.map(p => {
    let score = 60;
    if (aiSummary.traits.sun   === '高' && p.lightLimit === 'Full Sun')       score += 20;
    if (aiSummary.traits.sun   === '低' && p.lightLimit === 'Shade')          score += 20;
    if (aiSummary.traits.sun   === '中' && p.lightLimit.includes('Partial'))  score += 15;
    if (aiSummary.traits.water === '高' && p.waterLimit === 'High')           score += 25;
    if (category === '乾陰區'           && p.waterLimit === 'Low')             score += 20;
    if (drainageSpeed === '快'           && p.waterLimit === 'Low')            score += 10;
    if (aiSummary.traits.temp  === '高' && p.name.includes('樟樹'))           score += 10;
    if (aiSummary.traits.wind  === '高' && p.name.includes('大葉欖仁'))       score += 10;
    return { ...p, score: Math.min(score, 100) };
  }).sort((a, b) => b.score - a.score).slice(0, 10);

  const avoidPlants: { name: string; reason: string }[] = [];
  if (aiSummary.traits.sun   === '高') avoidPlants.push({ name: '蕨類',   reason: '強光曝曬會導致葉片枯死' });
  if (aiSummary.traits.sun   === '高') avoidPlants.push({ name: '姑婆芋', reason: '高溫曝曬易使葉面焦灼' });
  if (aiSummary.traits.temp  === '高') avoidPlants.push({ name: '杜鵑',   reason: '對高溫環境適應力弱' });
  if (aiSummary.traits.water === '高') avoidPlants.push({ name: '虎尾蘭', reason: '根系易因積水腐爛' });

  const designSuggestions: string[] = [];
  const riskWarnings: string[] = [];

  if (category === '高熱曝曬區')    designSuggestions.push('增設複層植栽遮蔭', '使用高反照率(Albedo)鋪面');
  if (category === '陰影區')         designSuggestions.push('選用耐陰植栽（蕨類/虎尾蘭）', '善用散射光提升植栽多樣性');
  if (category === '乾陰區')         designSuggestions.push('需設置自動點滴灌溉系統', '選用極低需水性耐陰植物');
  if (category === '強風區')         designSuggestions.push('設置防風林帶或擋風牆', '選用深根性抗風喬木');
  if (category === '都市熱島區')     designSuggestions.push('屋頂/牆面綠化降低蓄熱', '增設水景蒸散降溫');
  if (category === '潮濕積水區')     designSuggestions.push('規劃雨水花園(Rain Garden)', '設置地下盲溝加強排水');
  if (category === '半日照區')       designSuggestions.push('混植喜陽與耐陰植栽', '善用地形變化增加生態多樣性');
  if (waterloggingRisk === '高')     designSuggestions.push('增設浮水植栽與滯洪空間');
  if (microClimate.slopePct > 20)   designSuggestions.push('陡坡需設置截水溝防沖蝕', '建議使用根系固坡植物');

  if (waterloggingRisk === '高')     riskWarnings.push('強降雨期間存在顯著積水風險', '根系易因缺氧腐爛');
  if (urbanStress.downdraftRisk)     riskWarnings.push('受山地風切影響，植栽易傾倒');
  if (urbanStress.canyonEffect)      riskWarnings.push('都市街谷導致通風不良，病蟲害風險上升');
  if (urbanStress.surfaceTemp > 35)  riskWarnings.push('熱島效應顯著，植物水分蒸散量大');
  if (microClimate.pm25 > 35)        riskWarnings.push('PM2.5 超標，建議選用耐汙染植栽');
  if (designSuggestions.length === 0) designSuggestions.push('選用適應當地氣候的原生植栽');

  return {
    topPlants,
    avoidPlants,
    designSuggestions: designSuggestions.slice(0, 3),
    riskWarnings:       riskWarnings.slice(0, 3),
  };
}

export { getZoningRegulation };
