import { MicroClimateData, LandscapeDesignData } from '../types';
import { fetchOpenMeteoWeather, fetchCWAWeather, fetchEPAAirQuality, fetchOpenMeteoAirQuality } from './clients/weatherClient';
import { fetchPVGISSolar } from './clients/solarClient';
import { fetchElevationData } from './clients/elevationClient';
import { fetchNLSCTownVillage, fetchUrbanPlanningZone, AdminResult } from './clients/nlscClient';
import { calculateSolarPosition } from './solarCalc';
import {
  classifyZone, calcUrbanStress, calcDrainage, calcSeasonalSun, calcTraits, buildRecommendations,
} from './recommendEngine';

// ============================================================
// Zone + Town Cache（避免重複打 NLSC 慢 API）
// key = "lat5,lng5"（四捨五入至 5 位小數，約 1m 精度）
// ============================================================
type ZoneTownCache = { zone: string; town: AdminResult | null };
const _zoneTownCache = new Map<string, ZoneTownCache>();
const _zoneTownInFlight = new Map<string, Promise<ZoneTownCache>>();

function _zoneKey(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
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
    // 只快取查詢成功的結果；失敗的下次點選再重查
    if (zoneResult.status === 'fulfilled' && townResult.status === 'fulfilled') _zoneTownCache.set(key, data);
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
  // getMicroClimateData — 整合所有即時 API；失敗的項目為 null，不填估算值
  // -------------------------------------------------------
  async getMicroClimateData(
    lat: number,
    lng: number,
    date: Date,
    signal?: AbortSignal,
  ): Promise<MicroClimateData> {
    const sunPos = this.calculateSolarPosition(lat, lng, date);

    // 氣象：Open-Meteo（主）失敗時才補 CWA，避免成功時仍等待 CWA。
    const weatherPromise = fetchOpenMeteoWeather(lat, lng, signal)
      .catch(openMeteoError =>
        fetchCWAWeather(lat, lng, signal)
          .catch(cwaError => {
            throw new Error(
              `Open-Meteo: ${openMeteoError?.message ?? openMeteoError}; CWA: ${cwaError?.message ?? cwaError}`
            );
          })
      );
    // 空品：環境部測站（需 Key）優先，否則 Open-Meteo CAMS 模式值
    const airPromise = fetchEPAAirQuality(lat, lng, signal)
      .catch(epaError =>
        fetchOpenMeteoAirQuality(lat, lng, signal)
          .catch(omError => {
            throw new Error(`環境部: ${epaError?.message ?? epaError}; Open-Meteo: ${omError?.message ?? omError}`);
          })
      );

    const [weather, air, solar, elevation] = await Promise.allSettled([
      weatherPromise,
      airPromise,
      fetchPVGISSolar(lat, lng, signal),
      fetchElevationData(lat, lng, signal),
    ]);

    const w = weather.status   === 'fulfilled' ? weather.value   : null;
    const a = air.status       === 'fulfilled' ? air.value       : null;
    const s = solar.status     === 'fulfilled' ? solar.value     : null;
    const e = elevation.status === 'fulfilled' ? elevation.value : null;

    if (!w) console.warn('[GIS] 氣象 API 失敗:', (weather as PromiseRejectedResult).reason?.message);
    if (!a) console.warn('[GIS] 空品 API 失敗:', (air as PromiseRejectedResult).reason?.message);
    if (!s) console.warn('[GIS] PVGIS 太陽能 API 失敗:', (solar as PromiseRejectedResult).reason?.message);
    if (!e) console.warn('[GIS] Open-Elevation API 失敗:', (elevation as PromiseRejectedResult).reason?.message);

    return {
      temp:          w?.temp ?? null,
      humidity:      w?.humidity ?? null,
      windSpeed:     w?.windSpeed ?? null,
      windDirection: w?.windDirection ?? null,
      rainfall:      w?.rainfall ?? null,
      surfaceTemp:   w?.surfaceTemp ?? null,

      pm25: a?.pm25 ?? null,
      aqi:  a?.aqi ?? null,

      solarAzimuth:  sunPos.azimuth,
      solarAltitude: sunPos.altitude,

      annualIrradiance:  s?.annualIrradiance ?? null,
      monthlyIrradiance: s?.monthlyIrradiance ?? null,
      peakSunHours:      s?.peakSunHours ?? null,
      recommendedTilt:   s?.recommendedTilt ?? null,

      elevation:     e?.elevation ?? null,
      slopePct:      e?.slopePct ?? null,
      aspectDeg:     e?.aspectDeg ?? null,
      aspectDir:     e?.aspectDir ?? null,
      planCurvature: e?.planCurvature ?? null,

      _sources: {
        weather:    w ? (w.stationName === 'Open-Meteo 格點資料' ? 'openMeteo' : 'cwa') : 'none',
        airQuality: a?.source ?? 'none',
        solar:      s ? 'pvgis' : 'none',
        elevation:  e ? 'openElevation' : 'none',
      },
    };
  },

  // -------------------------------------------------------
  // getLandscapeDecisionData — 以固定規則判讀上述資料（不產生估算數值）
  // -------------------------------------------------------
  async getLandscapeDecisionData(
    lat: number, lng: number, microClimate: MicroClimateData
  ): Promise<LandscapeDesignData> {

    // Zone + town: use cache (pre-warmed by prefetchZone in App.tsx)
    const { zone, town } = await fetchZoneAndTownCached(lat, lng);

    const landUseZone = town
      ? `${zone}（${town.county}${town.town}${town.sectName ? '·' + town.sectName : ''}）`
      : zone;

    const zoning      = classifyZone(microClimate);
    const urbanStress = calcUrbanStress(microClimate);
    const drainage    = calcDrainage(microClimate);
    const traits      = calcTraits(microClimate, drainage.waterloggingRisk);

    return {
      zoning,
      urbanStress,
      drainage,
      seasonalSun: calcSeasonalSun(lat),
      traits,
      landUseZone,
      _sources: {
        admin:  town !== null        ? 'nlsc'    : 'none',
        zoning: zone !== '查詢失敗' ? 'nlscWms' : 'none',
      },
      recommendations: buildRecommendations(microClimate, zoning, traits, drainage, urbanStress),
    };
  },
};
