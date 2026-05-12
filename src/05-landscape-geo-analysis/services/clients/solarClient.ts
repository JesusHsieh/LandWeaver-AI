// ============================================================
// Solar API client — PVGIS
// ============================================================

export interface SolarResult {
  annualIrradiance: number;
  monthlyIrradiance: number[];
  peakSunHours: number;
  recommendedTilt: number;
}

// ============================================================
// API 3：EU PVGIS — 太陽輻射量資料（免費，無需 Key）
// 覆蓋台灣全境
// ============================================================
export async function fetchPVGISSolar(lat: number, lng: number): Promise<SolarResult> {
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
