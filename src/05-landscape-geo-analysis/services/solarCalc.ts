// ============================================================
// Solar Position Calculation (天文公式，無需外部 API)
// ============================================================

export function calculateSolarPosition(lat: number, lng: number, year: number, month: number, day: number, decimalHour: number) {
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
