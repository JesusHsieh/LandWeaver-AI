// Haversine distance in metres
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

// TWD97 TM2 Zone 121 (EPSG:3826) → WGS84 using standard TM inverse projection (USGS algorithm)
export function twd97ToWgs84(E: number, N: number): { lat: number; lng: number } {
  const a   = 6378137.0;
  const f   = 1.0 / 298.257222101;
  const k0  = 0.9999;
  const E0  = 250000.0;
  const lon0 = 121.0 * Math.PI / 180.0;
  const b   = a * (1 - f);
  const e2  = (a * a - b * b) / (a * a);
  const ep2 = (a * a - b * b) / (b * b);
  const e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M   = N / k0;
  const mu  = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  const phi1 = mu
    + (3/2*e1 - 27/32*e1**3)     * Math.sin(2*mu)
    + (21/16*e1**2 - 55/32*e1**4) * Math.sin(4*mu)
    + (151/96*e1**3)               * Math.sin(6*mu)
    + (1097/512*e1**4)             * Math.sin(8*mu);
  const sinP = Math.sin(phi1), cosP = Math.cos(phi1), tanP = Math.tan(phi1);
  const N1 = a / Math.sqrt(1 - e2*sinP*sinP);
  const R1 = a*(1-e2) / Math.pow(1 - e2*sinP*sinP, 1.5);
  const T1 = tanP*tanP, C1 = ep2*cosP*cosP;
  const D  = (E - E0) / (N1 * k0);
  const lat = phi1 - N1*tanP/R1 * (
    D*D/2
    - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*ep2)               * D**4/24
    + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*ep2 - 3*C1*C1) * D**6/720
  );
  const lon = lon0 + (
    D
    - (1 + 2*T1 + C1)                                               * D**3/6
    + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*ep2 + 24*T1*T1) * D**5/120
  ) / cosP;
  return { lat: lat * 180 / Math.PI, lng: lon * 180 / Math.PI };
}

export function isInTaipeiCity(lat: number, lng: number): boolean {
  return lat >= 24.97 && lat <= 25.21 && lng >= 121.46 && lng <= 121.66;
}
