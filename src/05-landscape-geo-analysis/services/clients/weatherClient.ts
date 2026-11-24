// ============================================================
// Weather / air quality clients — Open-Meteo, CWA, EPA
// ============================================================

import { haversineM } from '../../utils/geo';
import { withTimeout } from '../../utils/withTimeout';

export interface WeatherResult {
  lat: number; lng: number;
  temp: number; humidity: number;
  windSpeed: number; windDirection: number | null;
  rainfall: number | null;
  /** 地表 0 cm 溫度，只有 Open-Meteo 提供 */
  surfaceTemp: number | null;
  stationName: string;
}
export interface AirQualityResult {
  pm25: number;
  /** 台灣 AQI，只有環境部測站提供 */
  aqi: number | null;
  source: 'epa' | 'openMeteo';
  stationName: string;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

function findNearest<T extends { lat: number; lng: number }>(
  lat: number, lng: number, items: T[]
): T | null {
  if (!items.length) return null;
  return items.reduce((best, cur) =>
    haversineM(lat, lng, cur.lat, cur.lng) < haversineM(lat, lng, best.lat, best.lng) ? cur : best
  );
}

// ============================================================
// API 1a：Open-Meteo — 即時氣象（免費，無需 Key，全球覆蓋）
// 主要天氣來源，格點約 1–2 km；失敗再嘗試 CWA（台灣限定，需 Key）
// ============================================================
export async function fetchOpenMeteoWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherResult> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,relative_humidity_2m,soil_temperature_0cm` +
    `&wind_speed_unit=ms&timezone=auto`,
    { signal: withTimeout(signal, 6000) }
  );
  if (!res.ok) throw new Error(`Open-Meteo 錯誤：${res.status}`);
  const c = (await res.json()).current ?? {};
  const temp = num(c.temperature_2m), humidity = num(c.relative_humidity_2m), windSpeed = num(c.wind_speed_10m);
  if (temp === null || humidity === null || windSpeed === null) throw new Error('Open-Meteo 回傳缺少氣溫、濕度或風速');
  return {
    lat, lng, temp, humidity, windSpeed,
    windDirection: num(c.wind_direction_10m),
    rainfall:      num(c.precipitation),
    surfaceTemp:   num(c.soil_temperature_0cm),
    stationName:   'Open-Meteo 格點資料',
  };
}

// ============================================================
// API 1b：中央氣象署 CWA — 自動氣象站觀測（需 Key，台灣優先）
// 申請：https://opendata.cwa.gov.tw/
// Env: VITE_CWA_API_KEY
// ============================================================
export async function fetchCWAWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherResult> {
  const key = localStorage.getItem('VITE_CWA_API_KEY') || import.meta.env.VITE_CWA_API_KEY;
  if (!key) throw new Error('尚未設定 VITE_CWA_API_KEY（請至 opendata.cwa.gov.tw 免費申請）');

  const res = await fetch(
    `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${key}&format=JSON&limit=150`,
    { signal: withTimeout(signal, 6000) }
  );
  if (!res.ok) throw new Error(`CWA API 錯誤：${res.status}`);
  const json = await res.json();

  // 測站缺測時欄位為 -99 等負值
  const valid = (v: number | null, min: number) => (v !== null && v > min ? v : null);
  const stations: WeatherResult[] = (json.records?.Station ?? [])
    .map((s: any) => {
      const coord = s.GeoInfo?.Coordinates?.find((c: any) => c.CoordinateName === 'WGS84');
      const w = s.WeatherElement ?? {};
      return {
        lat:           num(coord?.StationLatitude) ?? NaN,
        lng:           num(coord?.StationLongitude) ?? NaN,
        temp:          valid(num(w.AirTemperature), -50),
        humidity:      valid(num(w.RelativeHumidity), -1),
        windSpeed:     valid(num(w.WindSpeed), -1),
        windDirection: valid(num(w.WindDirection), -1),
        rainfall:      valid(num(w.Now?.Precipitation), -1),
        surfaceTemp:   null,
        stationName:   String(s.StationName ?? ''),
      };
    })
    .filter((s: any): s is WeatherResult =>
      Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.temp !== null && s.humidity !== null && s.windSpeed !== null
    );

  const nearest = findNearest(lat, lng, stations);
  if (!nearest) throw new Error('找不到附近的氣象站');
  return nearest;
}

// ============================================================
// API 2a：環境部 — 即時空氣品質測站 (PM2.5 / AQI)
// 申請：https://data.moenv.gov.tw/
// Env: VITE_EPA_API_KEY
// ============================================================
export async function fetchEPAAirQuality(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AirQualityResult> {
  const key = localStorage.getItem('VITE_EPA_API_KEY') || import.meta.env.VITE_EPA_API_KEY;
  if (!key) throw new Error('尚未設定 VITE_EPA_API_KEY（請至 data.moenv.gov.tw 免費申請）');

  const res = await fetch(
    `https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=${key}&format=json&limit=100`,
    { signal: withTimeout(signal, 6000) }
  );
  if (!res.ok) throw new Error(`環境部 API 錯誤：${res.status}`);
  const json = await res.json();

  type Station = { lat: number; lng: number; pm25: number; aqi: number | null; stationName: string };
  const stations: Station[] = (json.records ?? [])
    .map((s: any) => ({
      lat:  num(s.latitude) ?? NaN,
      lng:  num(s.longitude) ?? NaN,
      pm25: num(s['pm2.5'] ?? s.pm25),
      aqi:  num(s.aqi),
      stationName: String(s.sitename ?? ''),
    }))
    .filter((s: any) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.pm25 !== null);

  const nearest = findNearest(lat, lng, stations);
  if (!nearest) throw new Error('找不到附近的空氣品質測站');
  return { pm25: nearest.pm25, aqi: nearest.aqi, source: 'epa', stationName: nearest.stationName };
}

// ============================================================
// API 2b：Open-Meteo Air Quality — CAMS 模式 PM2.5（免費，無需 Key）
// 沒有環境部 Key 或測站查詢失敗時使用；屬模式值，非測站觀測，不提供台灣 AQI
// ============================================================
export async function fetchOpenMeteoAirQuality(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AirQualityResult> {
  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm2_5&timezone=auto`,
    { signal: withTimeout(signal, 6000) }
  );
  if (!res.ok) throw new Error(`Open-Meteo 空品錯誤：${res.status}`);
  const pm25 = num((await res.json()).current?.pm2_5);
  if (pm25 === null) throw new Error('Open-Meteo 空品回傳缺少 PM2.5');
  return { pm25, aqi: null, source: 'openMeteo', stationName: 'Open-Meteo CAMS 模式' };
}
