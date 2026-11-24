// ============================================================
// Solar API client — PVGIS
// ============================================================

import { withTimeout } from '../../utils/withTimeout';

export interface SolarResult {
  /** 最佳傾角斜面的年日射量 kWh/m² */
  annualIrradiance: number;
  /** 12 個月斜面日射量，以最大月 = 100 正規化 */
  monthlyIrradiance: number[];
  /** 日均峰值日照時數（斜面日均日射量 kWh/m²/day） */
  peakSunHours: number;
  /** PVGIS 算出的最佳傾角 */
  recommendedTilt: number;
}

// ============================================================
// API 3：EU PVGIS — 太陽輻射量資料（免費，無需 Key）
// 覆蓋台灣全境；用斜面日射量 H(i)，不是 1 kWp 系統的發電量 E
// ============================================================
export async function fetchPVGISSolar(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<SolarResult> {
  // 透過 Vite proxy /pvgis → https://re.jrc.ec.europa.eu，繞過瀏覽器 CORS 限制
  const res = await fetch(
    `/pvgis/api/v5_2/PVcalc?lat=${lat}&lon=${lng}` +
    `&peakpower=1&loss=14&outputformat=json&mountingplace=free&optimalangles=1&raddatabase=PVGIS-ERA5`,
    { signal: withTimeout(signal, 8000) }
  );
  if (!res.ok) throw new Error(`PVGIS API 錯誤：${res.status}`);
  const json = await res.json();

  const monthly: number[] = json.outputs.monthly.fixed.map((m: any) => m['H(i)_m']);
  const annual: number = json.outputs.totals.fixed['H(i)_y'];
  const dailyMean: number = json.outputs.totals.fixed['H(i)_d'];
  const tilt: number = json.inputs.mounting_system?.fixed?.slope?.value;
  if (monthly.length !== 12 || ![annual, dailyMean, tilt].every(Number.isFinite)) {
    throw new Error('PVGIS 回傳格式不符');
  }

  const maxM = Math.max(...monthly);
  return {
    annualIrradiance:  Math.round(annual),
    monthlyIrradiance: monthly.map(v => Math.round((v / maxM) * 100)),
    peakSunHours:      Math.round(dailyMean * 10) / 10,
    recommendedTilt:   Math.round(tilt),
  };
}
