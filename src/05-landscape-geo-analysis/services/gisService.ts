import { MicroClimateData, LandscapeDesignData, ZoningCategory, PlantRecommendation } from '../types';

// ============================================================
// Zone + Town Cache（避免重複打 NLSC 慢 API）
// key = "lat3,lng3"（四捨五入至 3 位小數，~110m 精度）
// ============================================================
type ZoneTownCache = { zone: string; town: AdminResult | null };
const _zoneTownCache = new Map<string, ZoneTownCache>();
const _zoneTownInFlight = new Map<string, Promise<ZoneTownCache>>();

function _zoneKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

async function fetchZoneAndTownCached(lat: number, lng: number): Promise<ZoneTownCache> {
  const key = _zoneKey(lat, lng);
  if (_zoneTownCache.has(key)) return _zoneTownCache.get(key)!;
  if (_zoneTownInFlight.has(key)) return _zoneTownInFlight.get(key)!;

  const promise = Promise.allSettled([
    fetchNLSCTownVillage(lat, lng),
    fetchUrbanPlanningZone(lat, lng),
  ]).then(([townResult, zoneResult]) => {
    const data: ZoneTownCache = {
      zone: zoneResult.status === 'fulfilled' ? zoneResult.value : '查詢失敗',
      town: townResult.status === 'fulfilled' ? townResult.value : null,
    };
    _zoneTownCache.set(key, data);
    _zoneTownInFlight.delete(key);
    if (_zoneTownCache.size > 60) {
      _zoneTownCache.delete(_zoneTownCache.keys().next().value!);
    }
    return data;
  });

  _zoneTownInFlight.set(key, promise);
  return promise;
}

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
  county: string; town: string; village: string; sectName: string;
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
// API 1a：Open-Meteo — 即時氣象（免費，無需 Key，全球覆蓋）
// 作為主要天氣來源，精確到格點（約 1km），每個點回傳不同數值
// 若失敗再嘗試 CWA（台灣限定，需 Key）
// ============================================================
async function fetchOpenMeteoWeather(lat: number, lng: number): Promise<WeatherResult> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,relative_humidity_2m` +
    `&wind_speed_unit=ms&timezone=auto`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`Open-Meteo 錯誤：${res.status}`);
  const json = await res.json();
  const c = json.current;
  return {
    lat, lng,
    temp:          c.temperature_2m,
    humidity:      c.relative_humidity_2m,
    windSpeed:     c.wind_speed_10m,
    windDirection: c.wind_direction_10m ?? 0,
    rainfall:      c.precipitation ?? 0,
    stationName:   'Open-Meteo 格點資料',
  };
}

// ============================================================
// API 1b：中央氣象署 CWA — 自動氣象站觀測（需 Key，台灣優先）
// 申請：https://opendata.cwa.gov.tw/
// Env: VITE_CWA_API_KEY
// ============================================================
async function fetchCWAWeather(lat: number, lng: number): Promise<WeatherResult> {
  const key = localStorage.getItem('VITE_CWA_API_KEY') || import.meta.env.VITE_CWA_API_KEY;
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
  const key = localStorage.getItem('VITE_EPA_API_KEY') || import.meta.env.VITE_EPA_API_KEY;
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
  // 透過 Vite proxy /pvgis → https://re.jrc.ec.europa.eu，繞過瀏覽器 CORS 限制
  const res = await fetch(
    `/pvgis/api/v5_2/PVcalc?lat=${lat}&lon=${lng}` +
    `&peakpower=1&loss=14&outputformat=json&mountingplace=free&optimalangles=1&raddatabase=PVGIS-ERA5`
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

  // 透過 Vite proxy /open-elevation → https://api.open-elevation.com
  const res = await fetch('/open-elevation/api/v1/lookup', {
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
// API 5：NLSC 國土測繪中心 — 行政區 / 地籍查詢
// 端點：TownVillagePointQuery（公開，無需 Key，回傳 XML）
// 文件：https://api.nlsc.gov.tw/other/TownVillagePointQuery/{X}/{Y}/{CoordinateTypeCode}
// ============================================================
async function fetchNLSCTownVillage(lat: number, lng: number): Promise<AdminResult> {
  // Vite proxy: /nlsc-api → https://api.nlsc.gov.tw
  const res = await fetch(`/nlsc-api/other/TownVillagePointQuery/${lng}/${lat}/4326`);
  if (!res.ok) throw new Error(`NLSC 地籍 API 錯誤：${res.status}`);
  const text = await res.text();
  const xml  = new DOMParser().parseFromString(text, 'text/xml');
  if (xml.querySelector('error')) throw new Error('查無地籍資料（非都市計畫區或海域）');
  const get = (tag: string) => xml.querySelector(tag)?.textContent ?? '';
  return {
    county:   get('ctyName')     || '未知縣市',
    town:     get('townName')    || '未知鄉鎮',
    village:  get('villageName') || '',
    sectName: get('sectName')    || '',
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

// NLSC LUIMAP sampled pixel colours → zone name
// Sampled from known locations: 大安住宅/信義商業/林口工業/台大學校/大安森林公園/苗栗農業/山區非都市
const LUIMAP_COLORS: [number, number, number, string][] = [
  [227, 180,  39, '住宅區'],
  [247, 186,  71, '住宅區'],
  [216,  13,  63, '商業區'],
  [209, 152,  84, '工業區'],
  [223, 176,  88, '工業區'],
  [134, 171,  85, '農業區'],
  [147, 255,  47, '公園用地'],
  [209, 101, 235, '學校用地'],
  [ 56, 168,   0, '非都市計畫區'],
];

function nearestZoneByColor(r: number, g: number, b: number, a: number): string {
  if (a < 10) return '非都市計畫區';
  let bestDist = Infinity, bestZone = '計畫分區';
  for (const [zr, zg, zb, zone] of LUIMAP_COLORS) {
    const dist = Math.sqrt((r - zr) ** 2 + (g - zg) ** 2 + (b - zb) ** 2);
    if (dist < bestDist) { bestDist = dist; bestZone = zone; }
  }
  return bestDist < 70 ? bestZone : '計畫分區';
}

async function fetchUrbanPlanningZone(lat: number, lng: number): Promise<string> {
  // NLSC WMS GetFeatureInfo 回傳 Capabilities XML（不支援）
  // 改用 WMS GetMap 3×3px，讀中心像素 RGB → 比對 LUIMAP 色碼對應分區
  // Vite proxy: /nlsc-wms → https://wms.nlsc.gov.tw/wms
  try {
    const d = 0.001; // ~111m radius — 精準點位
    const params = new URLSearchParams({
      SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap',
      LAYERS: 'LUIMAP', STYLES: '', SRS: 'EPSG:4326',
      BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
      WIDTH: '3', HEIGHT: '3',
      FORMAT: 'image/png', TRANSPARENT: 'true',
    });
    const res = await fetch(`/nlsc-wms?${params}`);
    if (!res.ok) throw new Error(`WMS ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 3; canvas.height = 3;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const [r, g, b, a] = ctx.getImageData(1, 1, 1, 1).data;
          resolve(nearestZoneByColor(r, g, b, a));
        } catch {
          resolve('非都市計畫區');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve('非都市計畫區'); };
      img.src = objectUrl;
    });
  } catch {
    return '非都市計畫區';
  }
}

// ============================================================
// 08I：容積率 / 建蔽率 查表
// 來源：都市計畫法施行細則及各縣市都市計畫通則典型值
// ============================================================
const ZONE_FAR_BCR: Record<string, { far: number; bcr: number }> = {
  '住宅區':   { far: 160, bcr: 45 },
  '住一':     { far:  80, bcr: 30 },
  '住二':     { far: 160, bcr: 45 },
  '住三':     { far: 225, bcr: 50 },
  '住四':     { far: 300, bcr: 55 },
  '住五':     { far: 360, bcr: 60 },
  '住六':     { far: 400, bcr: 65 },
  '商業區':   { far: 560, bcr: 70 },
  '商一':     { far: 360, bcr: 60 },
  '商二':     { far: 560, bcr: 70 },
  '商三':     { far: 630, bcr: 70 },
  '商四':     { far: 800, bcr: 80 },
  '工業區':   { far: 200, bcr: 55 },
  '工一':     { far: 140, bcr: 50 },
  '工二':     { far: 200, bcr: 55 },
  '工三':     { far: 300, bcr: 60 },
  '農業區':   { far:  10, bcr: 10 },
  '公園用地': { far:  15, bcr: 15 },
  '學校用地': { far: 150, bcr: 50 },
  '文教區':   { far: 120, bcr: 40 },
  '保護區':   { far:   5, bcr:  5 },
  '行政區':   { far: 150, bcr: 50 },
  '綠地':     { far:  10, bcr: 10 },
};

function lookupZoningRegulation(zone: string): { far: number | null; bcr: number | null; note: string } {
  if (ZONE_FAR_BCR[zone]) return { ...ZONE_FAR_BCR[zone], note: '都市計畫通則（典型值）' };
  for (const [key, val] of Object.entries(ZONE_FAR_BCR)) {
    if (zone.includes(key)) return { ...val, note: '都市計畫通則（典型值）' };
  }
  if (zone.includes('非都市') || zone === '計畫分區' || zone === '查詢失敗') {
    return { far: null, bcr: null, note: '非都市計畫區，依土地使用管制規則' };
  }
  return { far: null, bcr: null, note: '分區資料不足，請洽當地主管機關' };
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

  // 提前啟動 zone+town 查詢，與 getMicroClimateData 並行
  prefetchZone(lat: number, lng: number): void {
    fetchZoneAndTownCached(lat, lng);
  },

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
    // 氣象：Open-Meteo（主）→ CWA（台灣備用，需 Key）
    const [openMeteo, cwa, air, solar, elevation] = await Promise.allSettled([
      fetchOpenMeteoWeather(lat, lng),
      fetchCWAWeather(lat, lng),
      fetchEPAAirQuality(lat, lng),
      fetchPVGISSolar(lat, lng),
      fetchElevationData(lat, lng),
    ]);

    // Weather: Open-Meteo first, CWA fallback, then constants
    const om = openMeteo.status === 'fulfilled' ? openMeteo.value : null;
    const cwaW = cwa.status === 'fulfilled' ? cwa.value : null;
    const w = om ?? cwaW;  // Open-Meteo preferred (global, no key)
    const a = air.status       === 'fulfilled' ? air.value       : null;
    const s = solar.status     === 'fulfilled' ? solar.value     : null;
    const e = elevation.status === 'fulfilled' ? elevation.value : null;

    // Shadow coverage estimated from solar altitude (real solar geometry)
    const shadowCoverage = Math.max(0, Math.min(100, 90 - sunPos.altitude * 1.8));

    if (!om)  console.warn('[GIS] Open-Meteo 失敗:', (openMeteo as PromiseRejectedResult).reason?.message);
    if (!cwaW) console.info('[GIS] CWA 未使用（無 Key 或 Open-Meteo 已成功）');
    if (!a)   console.warn('[GIS] EPA 空品 API 失敗:', (air as PromiseRejectedResult).reason?.message);
    if (!s)   console.warn('[GIS] PVGIS 太陽能 API 失敗:', (solar as PromiseRejectedResult).reason?.message);
    if (!e)   console.warn('[GIS] Open-Elevation API 失敗:', (elevation as PromiseRejectedResult).reason?.message);

    return {
      // Weather: Open-Meteo (格點即時，每點不同) → CWA → 常數 fallback
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
        weather:    om ? 'openMeteo' : (cwaW ? 'cwa' : 'fallback'),
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

    // Zone + town: use cache (pre-warmed by prefetchZone in App.tsx)
    const { zone, town } = await fetchZoneAndTownCached(lat, lng);

    const landUseZone = town
      ? `${zone}（${town.county}${town.town}${town.sectName ? '·' + town.sectName : ''}）`
      : zone;

    // --- Microclimate Zoning ---
    // 主判斷依據：PVGIS peakSunHours（年均，依經緯度變化）
    //   台灣範圍：北部 ~3.0 h/d → 南部 ~5.5 h/d（PVGIS 失敗時 fallback=3.8）
    // 不使用瞬時 shadowCoverage 作主判斷（夜間=100%，導致所有點都是"陰影區"）
    let category: ZoningCategory = '半日照區';
    let intensity = 0.5;

    const ph = microClimate.peakSunHours;   // annual peak sun hours (location-specific)
    const ws = microClimate.windSpeed;
    const t  = microClimate.temp;
    const rr = microClimate.rainfall;
    const dc = microClimate.drainageCoeff;
    const el = microClimate.elevation;

    if (ph >= 4.5) {
      // 南台灣 / 西部平原高日照 → 高熱曝曬
      category = '高熱曝曬區';     intensity = 0.72 + (ph - 4.5) / 10;
    } else if (ph < 3.2) {
      // 北台灣 / 山區低日照 → 陰影（濕）或乾陰
      category = (rr < 5 && ws > 3) ? '乾陰區' : '陰影區';
      intensity = 0.60 + (3.2 - ph) / 10;
    } else if (ws > 5.0) {
      // 沿海 / 山脊強風帶
      category = '強風區';         intensity = 0.60 + ws / 30;
    } else if (t > 28 && el < 200) {
      // 低海拔高溫 → 都市熱島
      category = '都市熱島區';     intensity = 0.65 + (t - 28) / 30;
    } else if (rr > 10 || dc < 0.28) {
      // 近期降雨 / 低排水係數（平坦地形）→ 潮濕積水
      category = '潮濕積水區';     intensity = 0.60 + Math.min(rr, 50) / 200;
    } else {
      // 溫帶半日照（台灣北部春秋平均條件）
      intensity = 0.45 + ph / 20;
    }
    intensity = Math.min(intensity, 1);

    // --- Seasonal Sun (from real solar geometry) ---
    const seasonalSun = {
      summerSolstice: Math.max(0,   microClimate.shadowCoverage - 15),
      winterSolstice: Math.min(100, microClimate.shadowCoverage + 25),
      equinox:        microClimate.shadowCoverage,
    };

    // --- Urban Stress ---
    // 優先使用不需 API Key 的資料：
    //   PVGIS peakSunHours（按經緯度不同，南台灣>北台灣）
    //   太陽幾何 shadowCoverage（按時刻/季節不同）
    //   Open-Elevation 地形（高程/坡向/坡度，每點不同）
    // CWA 氣溫只作第三層修正（未設 Key 時為 fallback，仍有上述兩層差異）

    // 1) 地形修正：高度遞減率 + 坡向日射 + 坡度散熱
    const lapseCorrection  = microClimate.elevation * 0.0065;    // -0.65°C / 100m
    const aspectCorrection = Math.cos((microClimate.aspectDeg - 180) * Math.PI / 180) * 2.0; // 南向+2°C, 北向-2°C
    const slopeCorrection  = -Math.min(2.0, microClimate.slopePct * 0.06);  // 陡坡最多 -2°C
    const localTemp        = microClimate.temp - lapseCorrection + aspectCorrection + slopeCorrection;

    // 2) surfaceHeatIndex：三個免費資料源加權
    //    PVGIS 年均峰值日射（南高北低，無 Key 仍差異）— 權重 0.40
    const solarFactor  = Math.min(1, microClimate.peakSunHours / 6.5);
    //    當前遮蔭覆蓋率（太陽幾何算出，時刻/季節差異）— 權重 0.30
    const exposeFactor = 1 - microClimate.shadowCoverage / 100;
    //    地表溫度離 28°C 基準距離 — 權重 0.30
    const tempFactor   = Math.max(0, (localTemp - 24) / 14);
    const surfaceHeatIndex = Math.min(0.90, Math.max(0.10,
      solarFactor * 0.40 + exposeFactor * 0.30 + tempFactor * 0.30
    ));

    const surfaceTemp   = localTemp + surfaceHeatIndex * 10;
    const albedo        = surfaceHeatIndex > 0.60 ? 0.15 : surfaceHeatIndex > 0.40 ? 0.25 : 0.35;

    // 3) 風：地形加速（稜線）
    const topoWindBoost = microClimate.slopePct > 30 ? 1.3 : 1.0;
    const localWindSpeed = microClimate.windSpeed * topoWindBoost;
    const windAdjustment = 1.0 + (localWindSpeed > 5 ? 0.4 : -0.1);

    // 4) 街谷/下衝：低風 + 建成環境 → 街谷效應；強風 + 陡坡 → 下衝風險
    // 使用高度與坡度作為都市環境代理指標（不依賴瞬時遮蔭）
    const isUrbanLowland = el < 80 && microClimate.slopePct < 5;  // 低海拔平坦 → 都市環境
    const canyonEffect   = localWindSpeed < 3.0 && isUrbanLowland;
    const downdraftRisk  = localWindSpeed > 5.0 && microClimate.slopePct > 10;

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
    // Humidity correction: high ambient humidity → soil closer to saturation
    const humidityCorr  = microClimate.humidity > 85 ? 0.75
                        : microClimate.humidity > 70 ? 0.90 : 1.0;
    const infiltrationRate = Math.max(1, Math.round(baseInfRate * slopeCorr * moistureCorr * humidityCorr * 10) / 10);

    const drainageSpeed: '快' | '中' | '慢' =
      microClimate.drainageCoeff > 0.6 ? '快' : microClimate.drainageCoeff > 0.3 ? '中' : '慢';
    // waterloggingRisk 同時考量坡度（排水速度）與大氣濕度
    // 平地高濕（台北）與平地低濕（高雄）應有不同評估
    const waterloggingRisk: '低' | '中' | '高' =
      drainageSpeed === '快' ? '低'
      : drainageSpeed === '慢' && (microClimate.rainfall > 3 || microClimate.humidity > 80)
        ? '高'
      : '中';

    // --- Hydrology (SCA formula + Plan Curvature) ---
    // Specific Catchment Area (SCA): estimated contributing area per contour length
    //   Based on D∞ approximation: SCA ≈ L / tan(slope)
    //   Plan curvature (Laplacian) adjusts for terrain convergence/divergence
    const slopeRad      = Math.atan(microClimate.slopePct / 100);
    const baseSCA       = Math.round(50 / Math.max(Math.tan(slopeRad), 0.005)); // m²
    const curvFactor    = Math.max(0.15, Math.min(6, 1 + microClimate.planCurvature * 8000));
    const catchmentArea = Math.min(5000, Math.max(10, Math.round(baseSCA * curvFactor)));

    const flowDirection = microClimate.aspectDeg;
    // pondingDepth：降雨 + 濕度共同驅動（台北高濕即使少雨仍有積水潛勢）
    const humidityIndex = Math.max(0, (microClimate.humidity - 60) / 40); // 0@60%, 1@100%
    const pondingDepth  =
      waterloggingRisk === '高'
        ? Math.max(1, Math.round(microClimate.rainfall * 5 + humidityIndex * 25))
      : waterloggingRisk === '中'
        ? Math.max(0, Math.round(microClimate.rainfall * 2))
      : 0;

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

    // 依分區給出主設計建議
    if (category === '高熱曝曬區')    designSuggestions.push('增設複層植栽遮蔭', '使用高反照率(Albedo)鋪面');
    if (category === '陰影區')         designSuggestions.push('選用耐陰植栽（蕨類/虎尾蘭）', '善用散射光提升植栽多樣性');
    if (category === '乾陰區')         designSuggestions.push('需設置自動點滴灌溉系統', '選用極低需水性耐陰植物');
    if (category === '強風區')         designSuggestions.push('設置防風林帶或擋風牆', '選用深根性抗風喬木');
    if (category === '都市熱島區')     designSuggestions.push('屋頂/牆面綠化降低蓄熱', '增設水景蒸散降溫');
    if (category === '潮濕積水區')     designSuggestions.push('規劃雨水花園(Rain Garden)', '設置地下盲溝加強排水');
    if (category === '半日照區')       designSuggestions.push('混植喜陽與耐陰植栽', '善用地形變化增加生態多樣性');
    // 土壤/地形附加建議
    if (waterloggingRisk === '高')     designSuggestions.push('增設浮水植栽與滯洪空間');
    if (microClimate.slopePct > 20)   designSuggestions.push('陡坡需設置截水溝防沖蝕', '建議使用根系固坡植物');
    // 風險警告
    if (waterloggingRisk === '高')     riskWarnings.push('強降雨期間存在顯著積水風險', '根系易因缺氧腐爛');
    if (downdraftRisk)                 riskWarnings.push('受山地風切影響，植栽易傾倒');
    if (canyonEffect)                  riskWarnings.push('都市街谷導致通風不良，病蟲害風險上升');
    if (surfaceTemp > 35)              riskWarnings.push('熱島效應顯著，植物水分蒸散量大');
    if (microClimate.pm25 > 35)        riskWarnings.push('PM2.5 超標，建議選用耐汙染植栽');
    // 保底：確保至少一條建議（避免空引號顯示）
    if (designSuggestions.length === 0) designSuggestions.push('選用適應當地氣候的原生植栽');

    const zoningRegulation = lookupZoningRegulation(zone);

    return {
      zoning:      { category, intensity },
      urbanStress: { surfaceHeatIndex, albedo, surfaceTemp, windAdjustment, canyonEffect, downdraftRisk },
      soil:        { infiltrationRate, drainageSpeed, waterloggingRisk },
      hydrology:   { flowDirection, catchmentArea, pondingDepth },
      seasonalSun,
      aiSummary,
      landUseZone,
      zoningRegulation,
      _sources: {
        admin:  town !== null          ? 'nlsc'    : 'fallback',
        zoning: zone !== '查詢失敗'   ? 'nlscWms' : 'fallback',
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
