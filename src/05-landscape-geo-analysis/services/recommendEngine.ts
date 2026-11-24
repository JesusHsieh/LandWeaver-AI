// ============================================================
// 景觀決策規則：全部以固定門檻判讀 MicroClimateData，不產生任何估算數值。
// 所需資料缺漏時回傳 null（畫面顯示「無資料」），不以預設值代替。
// ============================================================

import { MicroClimateData, LandscapeDesignData, ZoningCategory, PlantMatch, Level, SiteHazards } from '../types';
import { designFlood, floodDepth, scenarioLabel } from './hazards';

// ── 植栽清單：一般園藝資料的光照、需水特性 ─────────────────────────────────────
const PLANT_DB: Omit<PlantMatch, 'reasons'>[] = [
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

const known = (...vals: (number | null)[]): boolean => vals.every(v => v !== null);
const f1 = (n: number) => n.toFixed(1);

/** 微氣候分區（規則）：以 PVGIS 峰值日照為主，再看風速、氣溫、雨量與坡度 */
export function classifyZone(m: MicroClimateData): LandscapeDesignData['zoning'] {
  const { peakSunHours: ph, windSpeed: ws, temp: t, rainfall: rr, slopePct: sl, elevation: el } = m;
  if (ph === null || ws === null || t === null || rr === null || sl === null || el === null) return null;

  const zone = (category: ZoningCategory, basis: string) => ({ category, basis });
  if (ph >= 4.5) return zone('高熱曝曬區', `峰值日照 ${f1(ph)} h/d ≥ 4.5`);
  if (ph < 3.2) {
    return rr < 5 && ws > 3
      ? zone('乾陰區', `峰值日照 ${f1(ph)} h/d < 3.2，雨量 ${f1(rr)} mm < 5、風速 ${f1(ws)} m/s > 3`)
      : zone('陰影區', `峰值日照 ${f1(ph)} h/d < 3.2`);
  }
  if (ws > 5) return zone('強風區', `風速 ${f1(ws)} m/s > 5`);
  if (t > 28 && el < 200) return zone('高溫低地區', `氣溫 ${f1(t)}°C > 28 且海拔 ${el.toFixed(0)} m < 200`);
  if (rr > 10 || sl < 4) {
    return zone('潮濕積水區', rr > 10 ? `雨量 ${f1(rr)} mm > 10` : `坡度 ${f1(sl)}% < 4，地表排水慢`);
  }
  return zone('半日照區', '峰值日照 3.2–4.5 h/d，且無強風、高溫低地或積水條件');
}

/** 地表溫度（Open-Meteo 模式值）與風環境規則 */
export function calcUrbanStress(m: MicroClimateData): LandscapeDesignData['urbanStress'] {
  const { windSpeed: ws, slopePct: sl, elevation: el } = m;
  return {
    surfaceTemp: m.surfaceTemp,
    stagnantLowland: known(ws, sl, el) ? ws! < 3 && el! < 80 && sl! < 5 : null,
    windySlope: known(ws, sl) ? ws! > 5 && sl! > 10 : null,
  };
}

/** 地表排水：依坡度分級；積水風險再看當下雨量與濕度 */
export function calcDrainage(m: MicroClimateData): LandscapeDesignData['drainage'] {
  const sl = m.slopePct;
  const speed = sl === null ? null : sl > 20 ? '快' : sl > 5 ? '中' : '慢';
  let waterloggingRisk: Level | null = null;
  if (speed === '快') waterloggingRisk = '低';
  else if (speed && known(m.rainfall, m.humidity)) {
    waterloggingRisk = speed === '慢' && (m.rainfall! > 3 || m.humidity! > 80) ? '高' : '中';
  }
  return { speed, waterloggingRisk, flowDirection: m.aspectDeg };
}

/** 夏至、春秋分、冬至的正午太陽高度角與晝長（天文公式） */
export function calcSeasonalSun(lat: number): LandscapeDesignData['seasonalSun'] {
  const rad = Math.PI / 180;
  return [
    { label: '夏至', decl: 23.44 },
    { label: '春秋分', decl: 0 },
    { label: '冬至', decl: -23.44 },
  ].map(({ label, decl }) => {
    const cosH = Math.min(1, Math.max(-1, -Math.tan(lat * rad) * Math.tan(decl * rad)));
    return {
      label,
      noonAltitude: 90 - Math.abs(lat - decl),
      dayLength: (2 * Math.acos(cosH) / rad) / 15,
    };
  });
}

/** 植栽篩選用的環境等級 */
export function calcTraits(m: MicroClimateData, waterloggingRisk: Level | null): LandscapeDesignData['traits'] {
  const lvl = (v: number | null, hi: number, mid: number): Level | null =>
    v === null ? null : v > hi ? '高' : v > mid ? '中' : '低';
  let water: Level | null = null;
  if (m.rainfall !== null) {
    water = m.rainfall > 20 || waterloggingRisk === '高' ? '高' : m.rainfall > 5 ? '中' : '低';
  }
  return {
    sun:  lvl(m.peakSunHours, 4.5, 3.2),
    temp: lvl(m.temp, 28, 20),
    wind: lvl(m.windSpeed, 6, 3),
    water,
  };
}

export function buildRecommendations(
  m: MicroClimateData,
  zoning: LandscapeDesignData['zoning'],
  traits: LandscapeDesignData['traits'],
  drainage: LandscapeDesignData['drainage'],
  urbanStress: LandscapeDesignData['urbanStress'],
  hazards: SiteHazards,
): LandscapeDesignData['recommendations'] {
  const avoidPlants: { name: string; reason: string }[] = [];
  if (traits.sun   === '高') avoidPlants.push({ name: '蕨類',   reason: '強光曝曬會導致葉片枯死' });
  if (traits.sun   === '高') avoidPlants.push({ name: '姑婆芋', reason: '高溫曝曬易使葉面焦灼' });
  if (traits.temp  === '高') avoidPlants.push({ name: '杜鵑',   reason: '對高溫環境適應力弱' });
  if (traits.water === '高') avoidPlants.push({ name: '虎尾蘭', reason: '根系易因積水腐爛' });
  const avoided = (name: string) => avoidPlants.some(a => name.startsWith(a.name));

  const plants: PlantMatch[] = PLANT_DB.filter(p => !avoided(p.name)).map(p => {
    const reasons: string[] = [];
    if (traits.sun === '高' && p.lightLimit === 'Full Sun')       reasons.push('全日照');
    if (traits.sun === '低' && p.lightLimit.startsWith('Shade'))  reasons.push('耐陰');
    if (traits.sun === '中' && p.lightLimit.includes('Partial'))  reasons.push('半日照');
    if (traits.water === '高' && p.waterLimit === 'High')         reasons.push('耐濕');
    if (zoning?.category === '乾陰區' && p.waterLimit === 'Low')   reasons.push('耐旱');
    if (drainage.speed === '快' && p.waterLimit === 'Low')        reasons.push('排水快、耐旱');
    if (traits.temp === '高' && p.name.includes('樟樹'))          reasons.push('耐高溫');
    if (traits.wind === '高' && p.name.includes('大葉欖仁'))      reasons.push('抗風');
    return { ...p, reasons };
  })
    .filter(p => p.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const designSuggestions: string[] = [];
  const riskWarnings: string[] = [];
  switch (zoning?.category) {
    case '高熱曝曬區': designSuggestions.push('增設複層植栽遮蔭', '使用高反照率鋪面'); break;
    case '陰影區':     designSuggestions.push('選用耐陰植栽（蕨類/虎尾蘭）', '善用散射光提升植栽多樣性'); break;
    case '乾陰區':     designSuggestions.push('需設置自動點滴灌溉系統', '選用極低需水性耐陰植物'); break;
    case '強風區':     designSuggestions.push('設置防風林帶或擋風牆', '選用深根性抗風喬木'); break;
    case '高溫低地區': designSuggestions.push('屋頂/牆面綠化降低蓄熱', '增設水景蒸散降溫'); break;
    case '潮濕積水區': designSuggestions.push('規劃雨水花園(Rain Garden)', '設置地下盲溝加強排水'); break;
    case '半日照區':   designSuggestions.push('混植喜陽與耐陰植栽', '善用地形變化增加生態多樣性'); break;
  }
  if (drainage.waterloggingRisk === '高') designSuggestions.push('增設浮水植栽與滯洪空間');
  if (m.slopePct !== null && m.slopePct > 20) designSuggestions.push('陡坡需設置截水溝防沖蝕', '建議使用根系固坡植物');

  // 官方災害潛勢圖資優先列出
  const flood = hazards.flood && designFlood(hazards.flood);
  if (flood?.floodClass) riskWarnings.push(`位於淹水潛勢區（${scenarioLabel(flood)} 模擬淹水 ${floodDepth(flood.floodClass)}）`);
  if (hazards.liquefaction === '高') riskWarnings.push('土壤液化高潛勢區，構造物與大型喬木基礎需評估');
  if (hazards.debrisSlide)            riskWarnings.push('位於岩屑崩滑潛勢區，邊坡穩定與排水需評估');

  if (drainage.waterloggingRisk === '高') riskWarnings.push('強降雨期間存在顯著積水風險', '根系易因缺氧腐爛');
  if (urbanStress.windySlope)      riskWarnings.push('強風坡地，植栽易傾倒');
  if (urbanStress.stagnantLowland) riskWarnings.push('低風速平坦低地，通風不良，病蟲害風險上升');
  if (urbanStress.surfaceTemp !== null && urbanStress.surfaceTemp > 35) riskWarnings.push('地表高溫，植物水分蒸散量大');
  if (m.pm25 !== null && m.pm25 > 35) riskWarnings.push('PM2.5 偏高，建議選用耐汙染植栽');

  return {
    plants,
    avoidPlants,
    designSuggestions: designSuggestions.slice(0, 3),
    riskWarnings:      riskWarnings.slice(0, 4),
  };
}
