// ============================================================
// Elevation API client — open-elevation
// ============================================================

import { haversineM } from '../../utils/geo';

export interface ElevationResult {
  elevation: number;
  slopePct: number;
  aspectDeg: number;
  aspectDir: string;
  drainageCoeff: number;
  planCurvature: number;  // m⁻¹, Laplacian of elevation
}

// ============================================================
// API 4：Open-Elevation — DEM 高程 / 坡度 / 坡向（免費，無需 Key）
// ============================================================
export async function fetchElevationData(lat: number, lng: number): Promise<ElevationResult> {
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
    signal,
  });
  if (!res.ok) throw new Error(`Open-Elevation 錯誤：${res.status}`);
  const json = await res.json();

  const origin = points[0];
  return (json.results as any[]).map((r: any, i: number) => ({
    d: haversineM(origin.lat, origin.lng, points[i].lat, points[i].lng),
    e: r.elevation as number,
  }));
}
