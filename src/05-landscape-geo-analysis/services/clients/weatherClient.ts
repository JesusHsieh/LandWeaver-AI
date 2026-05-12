// ============================================================
// Weather API clients — Open-Meteo, CWA, EPA
// ============================================================

export interface WeatherResult {
  lat: number; lng: number;
  temp: number; humidity: number;
  windSpeed: number; windDirection: number;
  rainfall: number; stationName: string;
}
export interface AirQualityResult {
  lat: number; lng: number;
  pm25: number; aqi: number; stationName: string;
}

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
export async function fetchOpenMeteoWeather(lat: number, lng: number): Promise<WeatherResult> {
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
export async function fetchCWAWeather(lat: number, lng: number): Promise<WeatherResult> {
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
export async function fetchEPAAirQuality(lat: number, lng: number): Promise<AirQualityResult> {
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
