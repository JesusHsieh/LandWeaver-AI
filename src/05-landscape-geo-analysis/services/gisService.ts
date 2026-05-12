import { MicroClimateData, LandscapeDesignData } from '../types';
import { fetchOpenMeteoWeather, fetchCWAWeather, fetchEPAAirQuality } from './clients/weatherClient';
import { fetchPVGISSolar } from './clients/solarClient';
import { fetchElevationData } from './clients/elevationClient';
import { fetchNLSCTownVillage, fetchUrbanPlanningZone, AdminResult } from './clients/nlscClient';
import { calculateSolarPosition } from './solarCalc';
import { getZoningRegulation } from './zoningTable';
import {
  classifyZone, calcUrbanStress, calcSoil, calcHydrology, buildRecommendations,
} from './recommendEngine';

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
// Main GISService Export
// ============================================================
export const GISService = {

  // 提前啟動 zone+town 查詢，與 getMicroClimateData 並行
  prefetchZone(lat: number, lng: number): void {
    fetchZoneAndTownCached(lat, lng);
  },

  calculateSolarPosition(lat: number, lng: number, date: Date) {
    const h = date.getHours() + date.getMinutes() / 60;
    return calculateSolarPosition(lat, lng, date.getFullYear(), date.getMonth(), date.getDate(), h);
  },

  getSolarPath(lat: number, lng: number, date: Date) {
    return Array.from({ length: 15 }, (_, i) => i + 5)
      .map(h => {
        const pos = calculateSolarPosition(lat, lng, date.getFullYear(), date.getMonth(), date.getDate(), h);
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

    const { category, intensity } = classifyZone(microClimate);

    // --- Seasonal Sun (from real solar geometry) ---
    const seasonalSun = {
      summerSolstice: Math.max(0,   microClimate.shadowCoverage - 15),
      winterSolstice: Math.min(100, microClimate.shadowCoverage + 25),
      equinox:        microClimate.shadowCoverage,
    };

    const urbanStress = calcUrbanStress(microClimate);
    const soil = calcSoil(microClimate);
    const hydrology = calcHydrology(microClimate, soil.waterloggingRisk);

    // --- AI Summary ---
    const aiSummary = {
      traits: {
        sun:   microClimate.peakSunHours > 6 ? '高' : microClimate.peakSunHours > 3 ? '中' : '低',
        temp:  microClimate.temp  > 28 ? '高' : microClimate.temp  > 20 ? '中' : '低',
        wind:  microClimate.windSpeed > 6 ? '高' : microClimate.windSpeed > 3 ? '中' : '低',
        water: (microClimate.rainfall > 20 || soil.waterloggingRisk === '高') ? '高' :
               microClimate.rainfall > 5 ? '中' : '低',
      } as { sun: '高'|'中'|'低'; temp: '高'|'中'|'低'; wind: '高'|'中'|'低'; water: '高'|'中'|'低' }
    };

    const recommendations = buildRecommendations(
      microClimate, category, soil.drainageSpeed, soil.waterloggingRisk, urbanStress, zone
    );

    const zoningRegulation = getZoningRegulation(zone);

    return {
      zoning:      { category, intensity },
      urbanStress,
      soil,
      hydrology,
      seasonalSun,
      aiSummary,
      landUseZone,
      zoningRegulation,
      _sources: {
        admin:  town !== null          ? 'nlsc'    : 'fallback',
        zoning: zone !== '查詢失敗'   ? 'nlscWms' : 'fallback',
      } as const,
      recommendations,
    };
  },
};
