// ============================================================
// Elevation API client — open-elevation
// ============================================================

import { haversineM } from '../../utils/geo';
import { withTimeout } from '../../utils/withTimeout';

export interface ElevationResult {
  elevation: number;
  slopePct: number;
  /** 坡面朝向（下坡方向），平坦時為 null */
  aspectDeg: number | null;
  /** 「東南」等，平坦時為「平坦」 */
  aspectDir: string;
  planCurvature: number;  // m⁻¹, Laplacian of elevation
}

/** 坡度低於此值視為平坦，不判定坡向 */
const FLAT_SLOPE_PCT = 1;

// ============================================================
// API 4：Open-Elevation — DEM 高程 / 坡度 / 坡向（免費，無需 Key）
// 中心點與東西南北各約 111 m 共 5 點，以中央差分計算
// ============================================================
export async function fetchElevationData(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ElevationResult> {
  const d = 0.001;
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
    signal: withTimeout(signal, 8000),
  });
  if (!res.ok) throw new Error(`Open-Elevation 錯誤：${res.status}`);
  const json = await res.json();

  const elev = (json.results ?? []).map((r: any) => r.elevation as number);
  if (elev.length !== 5 || !elev.every(Number.isFinite)) throw new Error('Open-Elevation 回傳不完整');
  const [center, north, south, east, west] = elev;
  const mNS = 111_320 * d;                                   // 南北 1 步的距離
  const mEW = 111_320 * d * Math.cos(lat * Math.PI / 180);   // 東西 1 步的距離（隨緯度縮短）

  // 高程梯度（中央差分）：dzdx 向東為正、dzdy 向北為正
  const dzdx = (east - west) / (2 * mEW);
  const dzdy = (north - south) / (2 * mNS);
  const slopePct = Math.round(Math.hypot(dzdx, dzdy) * 1000) / 10;

  // 坡向 = 下坡方向（梯度反方向），以北為 0° 順時針
  const flat = slopePct < FLAT_SLOPE_PCT;
  const aspectDeg = flat ? null : Math.round((Math.atan2(-dzdx, -dzdy) * 180 / Math.PI + 360) % 360);
  const aspectDir = aspectDeg === null
    ? '平坦'
    : ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round(aspectDeg / 45) % 8];

  // Plan Curvature（離散 Laplacian）：正 = 凹地（水匯聚）、負 = 凸地（水發散）
  const planCurvature = (east + west - 2 * center) / (mEW * mEW) + (north + south - 2 * center) / (mNS * mNS);

  return { elevation: center, slopePct, aspectDeg, aspectDir, planCurvature };
}

// ============================================================
// fetchElevationProfile — sample an elevation cross-section
// between two lat/lng points (used by the elevation profile tool)
// ============================================================
export async function fetchElevationProfile(
  points: { lat: number; lng: number }[],
  signal?: AbortSignal,
): Promise<{ d: number; e: number }[]> {
  const locations = points.map(p => ({ latitude: p.lat, longitude: p.lng }));

  const res = await fetch('/open-elevation/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
    signal: withTimeout(signal, 8000),
  });
  if (!res.ok) throw new Error(`Open-Elevation 錯誤：${res.status}`);
  const json = await res.json();

  const origin = points[0];
  return (json.results as any[]).map((r: any, i: number) => ({
    d: haversineM(origin.lat, origin.lng, points[i].lat, points[i].lng),
    e: r.elevation as number,
  }));
}
