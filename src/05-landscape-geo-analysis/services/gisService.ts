import { MicroClimateData, LandscapeDesignData, ZoningCategory, PlantRecommendation } from '../types';

// ============================================================
// Internal API Return Types
// ============================================================
interface WeatherResult {
  lat: number; lng: number;
  temp: number; humidity: number;
  windSpeed: number; windDirection: number;
  rainfall: number; stationName: string;
}
interface AirQualityResult {
  lat: number; lng: number;
  pm25: number; aqi: number; stationName: string;
}
interface SolarResult {
  annualIrradiance: number;
  monthlyIrradiance: number[];
  peakSunHours: number;
  recommendedTilt: number;
}
interface ElevationResult {
  elevation: number;
  slopePct: number;
  aspectDeg: number;
  aspectDir: string;
  drainageCoeff: number;
  planCurvature: number;  // m⁻¹, Laplacian of elevation
}
interface AdminResult {
  county: string; town: string; village: string;
}

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

// ============================================================
// Utilities
// ============================================================
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest<T extends { lat: number; lng: number }>(
  lat: number, lng: number, items: T[]
): T | null {
  if (!items.length) return null;
  return items.reduce((best, cur) =>
    haversineKm(lat, lng, cur.lat, cur.lng) < haversineKm(lat, lng, best.lat, best.lng) ? cur : best
  );
}

// ============================================================
// API 1：中央氣象署 CWA — 自動氣象站觀測
// 申請：https://opendata.cwa.gov.tw/
// Env: VITE_CWA_API_KEY
// ============================================================
async function fetchCWAWeather(lat: number, lng: number): Promise<WeatherResult> {
  const key = import.meta.env.VITE_CWA_API_KEY;
  if (!key) throw new Error('尚未設定 VITE_CWA_API_KEY（請至 opendata.cwa.gov.tw 免費申請）');

  const res = await fetch(
    `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${key}&format=JSON&limit=150`
  );
  if (!res.ok) throw new Error(`CWA API 錯誤：${res.status}`);
  const json = await res.json();

  const stations: WeatherResult[] = (json.records?.Station ?? [])
    .map((s: any): WeatherResult => {
      const coord = s.GeoInfo?.Coordinates?.find((c: any) => c.CoordinateName === 'WGS84');
      return {
        lat:           parseFloat(coord?.StationLatitude),
        lng:           parseFloat(coord?.StationLongitude),
        temp:          parseFloat(s.WeatherElement?.AirTemperature),
        humidity:      parseFloat(s.WeatherElement?.RelativeHumidity),
        windSpeed:     parseFloat(s.WeatherElement?.WindSpeed),
        windDirection: parseFloat(s.WeatherElement?.WindDirection),
        rainfall:      parseFloat(s.WeatherElement?.Now?.Precipitation ?? 0),
        stationName:   s.StationName as string,
      };
    })
    .filter((s: WeatherResult) =>
      !isNaN(s.lat) && !isNaN(s.lng) && !isNaN(s.temp) && s.temp > -50
    );

  const nearest = findNearest(lat, lng, stations);
  if (!nearest) throw new Error('找不到附近的氣象站');
  return nearest;
}

// ============================================================
// API 2：環境部 — 即時空氣品質 (PM2.5 / AQI)
// 申請：https://data.moenv.gov.tw/
// Env: VITE_EPA_API_KEY
// ============================================================
async function fetchEPAAirQuality(lat: number, lng: number): Promise<AirQualityResult> {
  const key = import.meta.env.VITE_EPA_API_KEY;
  if (!key) throw new Error('尚未設定 VITE_EPA_API_KEY（請至 data.moenv.gov.tw 免費申請）');

  const res = await fetch(
    `https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=${key}&format=json&limit=100`
  );
  if (!res.ok) throw new Error(`環境部 API 錯誤：${res.status}`);
  const json = await res.json();

  const stations: AirQualityResult[] = (json.records ?? [])
    .map((s: any): AirQualityResult => ({
      lat:         parseFloat(s.latitude),
      lng:         parseFloat(s.longitude),
      pm25:        parseFloat(s['pm2.5'] ?? s.pm25 ?? 0),
      aqi:         parseInt(s.aqi ?? '0', 10),
      stationName: s.sitename as string,
    }))
    .filter((s: AirQualityResult) => !isNaN(s.lat) && !isNaN(s.lng) && !isNaN(s.pm25));

  const nearest = findNearest(lat, lng, stations);
  if (!nearest) throw new Error('找不到附近的空氣品質測站');
  return nearest;
}

// ============================================================
// API 3：EU PVGIS — 太陽輻射量資料（免費，無需 Key）
// 覆蓋台灣全境
// ============================================================
async function fetchPVGISSolar(lat: number, lng: number): Promise<SolarResult> {
  const res = await fetch(
    `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lng}` +
    `&peakpower=1&loss=14&outputformat=json&mountingplace=free&optimalangles=1`
  );
  if (!res.ok) throw new Error(`PVGIS API 錯誤：${res.status}`);
  const json = await res.json();

  const monthly: number[] = json.outputs.monthly.fixed.map((m: any) => m.E_m);
  const annualKWh: number  = json.outputs.totals.fixed.E_y;
  const optTilt: number    = json.inputs.mounting_system?.fixed?.tilt?.value ?? Math.abs(lat);

  const maxM = Math.max(...monthly);
  const normalizedMonthly = monthly.map(v => Math.round((v / maxM) * 100));
  const peakSunHours = Math.round((annualKWh / 365) * 10) / 10;

  return {
    annualIrradiance:  Math.round(annualKWh),
    monthlyIrradiance: normalizedMonthly,
    peakSunHours:      Math.min(peakSunHours, 9),
    recommendedTilt:   Math.round(optTilt),
  };
}

// ============================================================
// API 4：Open-Elevation — DEM 高程 / 坡度 / 坡向（免費，無需 Key）
// ============================================================
async function fetchElevationData(lat: number, lng: number): Promise<ElevationResult> {
  const d = 0.001; // ~111 m
  const points = [
    { latitude: lat,     longitude: lng     }, // center
    { latitude: lat + d, longitude: lng     }, // N
    { latitude: lat - d, longitude: lng     }, // S
    { latitude: lat,     longitude: lng + d }, // E
    { latitude: lat,     longitude: lng - d }, // W
  ];

  const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations: points }),
  });
  if (!res.ok) throw new Error(`Open-Elevation 錯誤：${res.status}`);
  const json = await res.json();

  const [center, north, south, east, west] = json.results.map((r: any) => r.elevation as number);
  const mPerStep = 111000 * d;

  // Slope gradient (first-order finite difference)
  const slopeNS  = (north - south) / (2 * mPerStep);
  const slopeEW  = (east  - west)  / (2 * mPerStep);
  const slopePct = Math.round(Math.sqrt(slopeNS ** 2 + slopeEW ** 2) * 1000) / 10;

  // Aspect
  const aspectDeg = Math.round(((Math.atan2(east - west, north - south) * 180 / Math.PI) + 360) % 360);
  const aspectDir = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round(aspectDeg / 45) % 8];

  // Drainage coefficient from slope (rational method C value)
  const drainageCoeff = Math.round(Math.min(0.2 + slopePct * 0.02, 0.95) * 100) / 100;

  // Plan Curvature (discrete Laplacian, 2nd-order finite difference)
  // (∂²z/∂x² + ∂²z/∂y²) / mPerStep²
  // Positive = concave hollow (水匯聚), Negative = convex ridge (水發散)
  const planCurvature = (north + south + east + west - 4 * center) / (mPerStep * mPerStep);

  return { elevation: center, slopePct, aspectDeg, aspectDir, drainageCoeff, planCurvature };
}

// ============================================================
// API 5：NLSC 國土測繪中心 — 行政區查詢（免費，無需 Key）
// ============================================================
async function fetchNLSCTownVillage(lat: number, lng: number): Promise<AdminResult> {
  const res = await fetch(`https://api.nlsc.gov.tw/other/TownVillage/${lng}/${lat}`);
  if (!res.ok) throw new Error(`NLSC API 錯誤：${res.status}`);
  const json = await res.json();
  return {
    county:  json.ctyName  ?? '未知縣市',
    town:    json.townName ?? '未知鄉鎮',
    village: json.villName ?? '',
  };
}

// ============================================================
// API 6：NLSC WFS — 都市計畫使用分區（透過 Vite proxy 解決 CORS）
// ============================================================
const ZONE_CODE_MAP: Record<string, string> = {
  'R': '住宅區',  'R1': '住一 (住宅區)', 'R2': '住二 (住宅區)', 'R3': '住三 (住宅區)',
  'C': '商業區',  'C1': '商一 (商業區)', 'C2': '商二 (商業區)', 'C3': '商三 (商業區)',
  'I': '工業區',  'I1': '工一 (工業區)', 'I2': '工二 (工業區)', 'I3': '工三 (工業區)',
  'P': '公園用地', 'G': '綠地',          'S': '學校用地',       'A': '行政區',
  'E': '文教區',  'F': '農業區',         'WP': '保護區',        'WA': '農業區',
};

async function fetchUrbanPlanningZone(lat: number, lng: number): Promise<string> {
  try {
    // Vite proxy: /nlsc-wfs → https://wfs.nlsc.gov.tw/wfs
    const params = new URLSearchParams({
      SERVICE: 'WFS', VERSION: '1.1.0', REQUEST: 'GetFeature',
      TYPENAME: 'CP:LandUse', SRSNAME: 'EPSG:4326',
      CQL_FILTER: `INTERSECTS(wkb_geometry,POINT(${lng} ${lat}))`,
      outputFormat: 'application/json', maxFeatures: '1',
    });
    const res = await fetch(`/nlsc-wfs?${params}`);
    if (!res.ok) throw new Error('WFS 無法使用');
    const json = await res.json();
    const code: string = json.features?.[0]?.properties?.ZONE_CODE ?? '';
    return ZONE_CODE_MAP[code] ?? (code ? `${code} (都市計畫區)` : '非都市計畫區');
  } catch {
    // Fallback: return administrative zone info instead
    return '都市計畫分區查詢中...';
  }
}

// ============================================================
// Solar Position Calculation (天文公式，無需外部 API)
// ============================================================
function _solarAtTime(lat: number, lng: number, year: number, month: number, day: number, decimalHour: number) {
  const dayOfYear = Math.floor(
    (new Date(year, month, day).getTime() - new Date(year, 0, 0).getTime()) / 86400000
  );
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const hourAngle   = 15 * (decimalHour - 12);
  const φ = lat * (Math.PI / 180);
  const δ = declination * (Math.PI / 180);
  const ω = hourAngle   * (Math.PI / 180);
  const altitude = Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(ω));
  const azimuth  = Math.atan2(-Math.sin(ω), Math.cos(φ) * Math.tan(δ) - Math.sin(φ) * Math.cos(ω));
  return {
    azimuth:  (azimuth  * 180 / Math.PI + 360) % 360,
    altitude: altitude  * 180 / Math.PI,
  };
}

// ============================================================
// Main GISService Export
// ============================================================
export const GISService = {

  calculateSolarPosition(lat: number, lng: number, date: Date) {
    const h = date.getHours() + date.getMinutes() / 60;
    return _solarAtTime(lat, lng, date.getFullYear(), date.getMonth(), date.getDate(), h);
  },

  getSolarPath(lat: number, lng: number, date: Date) {
    return Array.from({ length: 15 }, (_, i) => i + 5)
      .map(h => {
        const pos = _solarAtTime(lat, lng, date.getFullYear(), date.getMonth(), date.getDate(), h);
        return { ...pos, hourLabel: h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p` };
      })
      .filter(p => p.altitude >= -5);
  },

  // -------------------------------------------------------
  // getMicroClimateData — 整合所有即時 API
  // -------------------------------------------------------
  async getMicroClimateData(lat: number, lng: number, date: Date): Promise<MicroClimateData> {
    const sunPos = this.calculateSolarPosition(lat, lng, date);

    // Run all real API calls in parallel
    const [weather, air, solar, elevation] = await Promise.allSettled([
      fetchCWAWeather(lat, lng),
      fetchEPAAirQuality(lat, lng),
      fetchPVGISSolar(lat, lng),
      fetchElevationData(lat, lng),
    ]);

    // Extract values with fallback indicators
    const w = weather.status === 'fulfilled' ? weather.value : null;
    const a = air.status     === 'fulfilled' ? air.value     : null;
    const s = solar.status   === 'fulfilled' ? solar.value   : null;
    const e = elevation.status === 'fulfilled' ? elevation.value : null;

    // Shadow coverage estimated from solar altitude (real solar geometry)
    const shadowCoverage = Math.max(0, Math.min(100, 90 - sunPos.altitude * 1.8));

    // Log any API failures to console for debugging
    if (!w) console.warn('[GIS] CWA 氣象 API 失敗:', (weather as PromiseRejectedResult).reason?.message);
    if (!a) console.warn('[GIS] EPA 空品 API 失敗:', (air as PromiseRejectedResult).reason?.message);
    if (!s) console.warn('[GIS] PVGIS 太陽能 API 失敗:', (solar as PromiseRejectedResult).reason?.message);
    if (!e) console.warn('[GIS] Open-Elevation API 失敗:', (elevation as PromiseRejectedResult).reason?.message);

    return {
      // CWA real data (fallback: Taiwan annual averages)
      temp:          w?.temp          ?? 25.5,
      humidity:      w?.humidity      ?? 75,
      windSpeed:     w?.windSpeed     ?? 3.5,
      windDirection: w?.windDirection ?? 135,
      rainfall:      w?.rainfall      ?? 0,

      // EPA real data (fallback: moderate values)
      pm25: a?.pm25 ?? 20,
      aqi:  a?.aqi  ?? 65,

      // PVGIS real data (fallback: Taiwan average solar)
      annualIrradiance:  s?.annualIrradiance  ?? 1350,
      monthlyIrradiance: s?.monthlyIrradiance ?? Array.from({length:12},(_,i)=>50+Math.sin(i/11*Math.PI)*40),
      peakSunHours:      s?.peakSunHours      ?? 3.8,
      recommendedTilt:   s?.recommendedTilt   ?? Math.round(Math.abs(lat) * 0.9),

      // Real solar geometry
      solarAzimuth:  sunPos.azimuth,
      solarAltitude: sunPos.altitude,
      shadowCoverage,

      // Open-Elevation real data (fallback: flat terrain)
      elevation:       e?.elevation     ?? 20,
      slopePct:        e?.slopePct      ?? 0,
      aspectDeg:       e?.aspectDeg     ?? 0,
      aspectDir:       e?.aspectDir     ?? '--',
      drainageCoeff:   e?.drainageCoeff ?? 0.35,
      planCurvature:   e?.planCurvature ?? 0,

      // API source flags (for UI to show real/fallback indicator)
      _sources: {
        weather:    weather.status   === 'fulfilled' ? 'cwa'           : 'fallback',
        airQuality: air.status       === 'fulfilled' ? 'epa'           : 'fallback',
        solar:      solar.status     === 'fulfilled' ? 'pvgis'         : 'fallback',
        elevation:  elevation.status === 'fulfilled' ? 'openElevation' : 'fallback',
      } as const,
    };
  },

  // -------------------------------------------------------
  // getLandscapeDecisionData — 景觀決策引擎（基於真實數據推導）
  // -------------------------------------------------------
  async getLandscapeDecisionData(
    lat: number, lng: number, microClimate: MicroClimateData
  ): Promise<LandscapeDesignData> {

    // Fetch location-specific real data in parallel
    const [townResult, zoneResult] = await Promise.allSettled([
      fetchNLSCTownVillage(lat, lng),
      fetchUrbanPlanningZone(lat, lng),
    ]);

    const town = townResult.status === 'fulfilled' ? townResult.value : null;
    const zone = zoneResult.status === 'fulfilled' ? zoneResult.value : '查詢失敗';

    const landUseZone = town
      ? `${zone}（${town.county}${town.town}）`
      : zone;

    // --- Microclimate Zoning (derived from real weather data) ---
    let category: ZoningCategory = '半日照區';
    let intensity = 0.5;

    if (microClimate.peakSunHours > 6 && microClimate.shadowCoverage < 20) {
      category = '高熱曝曬區';     intensity = 0.75 + microClimate.peakSunHours / 40;
    } else if (microClimate.shadowCoverage > 65) {
      category = (microClimate.rainfall < 10 && microClimate.windSpeed > 4) ? '乾陰區' : '陰影區';
      intensity = 0.6 + microClimate.shadowCoverage / 300;
    } else if (microClimate.windSpeed > 6) {
      category = '強風區';         intensity = 0.6 + microClimate.windSpeed / 30;
    } else if (microClimate.temp > 30) {
      category = '都市熱島區';     intensity = 0.7 + (microClimate.temp - 30) / 20;
    } else if (microClimate.rainfall > 20) {
      category = '潮濕積水區';     intensity = 0.6 + microClimate.rainfall / 200;
    }
    intensity = Math.min(intensity, 1);

    // --- Seasonal Sun (from real solar geometry) ---
    const seasonalSun = {
      summerSolstice: Math.max(0,   microClimate.shadowCoverage - 15),
      winterSolstice: Math.min(100, microClimate.shadowCoverage + 25),
      equinox:        microClimate.shadowCoverage,
    };

    // --- Urban Stress (derived from real temp + slope data) ---
    const heatFactor      = Math.max(0, (microClimate.temp - 28) / 10);
    const surfaceHeatIndex = Math.min(0.9, 0.3 + heatFactor * 0.5);
    const surfaceTemp      = microClimate.temp + surfaceHeatIndex * 8;
    const albedo           = surfaceHeatIndex > 0.6 ? 0.15 : 0.35;
    const windAdjustment   = 1.0 + (microClimate.windSpeed > 5 ? 0.4 : -0.1);
    const canyonEffect     = microClimate.windSpeed < 2 && microClimate.temp > 28;
    const downdraftRisk    = microClimate.windSpeed > 8 && canyonEffect;

    // --- Soil & Drainage (SCS Rational Method, multi-factor) ---
    // Base infiltration inversely proportional to drainage coefficient (C):
    //   C ≈ 0.9 (impervious urban) → very low infiltration
    //   C ≈ 0.2 (forested/open)   → high infiltration
    const baseInfRate   = 50 * (1 - microClimate.drainageCoeff * 0.9);
    // Slope correction: steeper slope = faster runoff = less infiltration time
    const slopeCorr     = Math.max(0.3, 1 - microClimate.slopePct * 0.015);
    // Antecedent moisture: recent rain saturates soil → reduced subsequent infiltration
    const moistureCorr  = microClimate.rainfall > 30 ? 0.5
                        : microClimate.rainfall > 10 ? 0.75 : 1.0;
    const infiltrationRate = Math.max(1, Math.round(baseInfRate * slopeCorr * moistureCorr * 10) / 10);

    const drainageSpeed: '快' | '中' | '慢' =
      microClimate.drainageCoeff > 0.6 ? '快' : microClimate.drainageCoeff > 0.3 ? '中' : '慢';
    const waterloggingRisk: '低' | '中' | '高' =
      drainageSpeed === '慢' ? '高' : drainageSpeed === '中' ? '中' : '低';

    // --- Hydrology (SCA formula + Plan Curvature) ---
    // Specific Catchment Area (SCA): estimated contributing area per contour length
    //   Based on D∞ approximation: SCA ≈ L / tan(slope)
    //   Plan curvature (Laplacian) adjusts for terrain convergence/divergence
    const slopeRad      = Math.atan(microClimate.slopePct / 100);
    const baseSCA       = Math.round(50 / Math.max(Math.tan(slopeRad), 0.005)); // m²
    const curvFactor    = Math.max(0.15, Math.min(6, 1 + microClimate.planCurvature * 8000));
    const catchmentArea = Math.min(5000, Math.max(10, Math.round(baseSCA * curvFactor)));

    const flowDirection = microClimate.aspectDeg;
    const pondingDepth  = waterloggingRisk === '高' ? Math.round(microClimate.rainfall * 3) : 0;

    // --- AI Summary ---
    const aiSummary = {
      traits: {
        sun:   microClimate.peakSunHours > 6 ? '高' : microClimate.peakSunHours > 3 ? '中' : '低',
        temp:  microClimate.temp  > 28 ? '高' : microClimate.temp  > 20 ? '中' : '低',
        wind:  microClimate.windSpeed > 6 ? '高' : microClimate.windSpeed > 3 ? '中' : '低',
        water: (microClimate.rainfall > 20 || waterloggingRisk === '高') ? '高' :
               microClimate.rainfall > 5 ? '中' : '低',
      } as { sun: '高'|'中'|'低'; temp: '高'|'中'|'低'; wind: '高'|'中'|'低'; water: '高'|'中'|'低' }
    };

    // --- Plant Matching ---
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
    if (category === '乾陰區')         designSuggestions.push('需設置自動點滴灌溉系統', '選用極低需水性耐陰植物');
    if (waterloggingRisk === '高')     designSuggestions.push('規劃雨水花園(Rain Garden)', '設置地下盲溝加強排水');
    if (waterloggingRisk === '高')     riskWarnings.push('強降雨期間存在顯著積水風險', '根系易因缺氧腐爛');
    if (downdraftRisk)                 riskWarnings.push('受建築高壓風切影響，植栽易傾倒');
    if (surfaceTemp > 35)              riskWarnings.push('熱島效應顯著，植物水分蒸散量大');
    if (microClimate.pm25 > 35)        riskWarnings.push('PM2.5 超標，建議選用耐汙染植栽');

    return {
      zoning:      { category, intensity },
      urbanStress: { surfaceHeatIndex, albedo, surfaceTemp, windAdjustment, canyonEffect, downdraftRisk },
      soil:        { infiltrationRate, drainageSpeed, waterloggingRisk },
      hydrology:   { flowDirection, catchmentArea, pondingDepth },
      seasonalSun,
      aiSummary,
      landUseZone,
      _sources: {
        admin:  townResult.status  === 'fulfilled' ? 'nlsc'    : 'fallback',
        zoning: zoneResult.status  === 'fulfilled' ? 'nlscWfs' : 'fallback',
      } as const,
      recommendations: {
        topPlants,
        avoidPlants,
        designSuggestions: designSuggestions.slice(0, 3),
        riskWarnings:       riskWarnings.slice(0, 3),
      },
    };
  },
};
