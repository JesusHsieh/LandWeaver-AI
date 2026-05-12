import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { haversineM } from '../utils/geo';
import { fetchOverpass } from '../utils/fetchOverpass';

export type PoiCat = 'school' | 'park' | 'market' | 'medical' | 'bus' | 'public';
export type PoiFeature = { lat: number; lng: number; cat: PoiCat; name: string };
export type PoiStats = Record<PoiCat, number>;

type OverpassPoiElement = {
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type PoiCacheEntry = {
  features: PoiFeature[];
  stats: PoiStats;
};

const POI_QUERY_RADIUS_DEG = 0.006;
const POI_QUERY_LIMIT = 350;
const POI_CACHE_LIMIT = 24;
const poiCache = new Map<string, PoiCacheEntry>();

function poiCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function rememberPoiCache(key: string, entry: PoiCacheEntry) {
  if (poiCache.has(key)) poiCache.delete(key);
  poiCache.set(key, entry);
  while (poiCache.size > POI_CACHE_LIMIT) {
    const oldest = poiCache.keys().next().value;
    if (!oldest) break;
    poiCache.delete(oldest);
  }
}

function poiCatOf(el: OverpassPoiElement): PoiCat | null {
  const amenity = el.tags?.amenity ?? '';
  const leisure = el.tags?.leisure ?? '';
  const shop = el.tags?.shop ?? '';
  const highway = el.tags?.highway ?? '';
  if (['school', 'kindergarten', 'university', 'college'].includes(amenity)) return 'school';
  if (['park', 'playground', 'garden'].includes(leisure)) return 'park';
  if (amenity === 'marketplace' || ['supermarket', 'convenience', 'market'].includes(shop)) return 'market';
  if (['hospital', 'clinic', 'pharmacy', 'dentist'].includes(amenity)) return 'medical';
  if (highway === 'bus_stop') return 'bus';
  if (['library', 'post_office', 'community_centre', 'police', 'fire_station', 'townhall'].includes(amenity)) return 'public';
  return null;
}

function buildPoiQuery(lat: number, lng: number) {
  const r = POI_QUERY_RADIUS_DEG;
  const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
  return `[out:json][timeout:8];(
    node["amenity"~"^(school|kindergarten|university|college)$"](${bbox});
    way["amenity"~"^(school|kindergarten|university|college)$"](${bbox});
    node["leisure"~"^(park|playground|garden)$"](${bbox});
    way["leisure"~"^(park|playground|garden)$"](${bbox});
    node["amenity"="marketplace"](${bbox});
    node["shop"~"^(supermarket|convenience|market)$"](${bbox});
    node["amenity"~"^(hospital|clinic|pharmacy|dentist)$"](${bbox});
    node["highway"="bus_stop"](${bbox});
    node["amenity"~"^(library|post_office|community_centre|police|fire_station|townhall)$"](${bbox});
    way["amenity"~"^(library|community_centre|police|townhall)$"](${bbox});
  );out center qt ${POI_QUERY_LIMIT};`;
}

function parsePoiElements(elements: OverpassPoiElement[]) {
  return elements
    .map((el): PoiFeature | null => {
      const cat = poiCatOf(el);
      if (!cat) return null;
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      if (plat == null || plng == null) return null;
      return { lat: plat, lng: plng, cat, name: el.tags?.['name:zh'] ?? el.tags?.name ?? '' };
    })
    .filter((poi): poi is PoiFeature => poi !== null);
}

function countPoiStats(lat: number, lng: number, pois: PoiFeature[]) {
  const stats: PoiStats = { school: 0, park: 0, market: 0, medical: 0, bus: 0, public: 0 };
  pois.forEach(p => {
    if (haversineM(lat, lng, p.lat, p.lng) <= 500) stats[p.cat]++;
  });
  return stats;
}

export function usePoiLayer(settings: MapSettings): { poiFeatures: PoiFeature[]; poiStats: PoiStats | null } {
  const [poiFeatures, setPoiFeatures] = useState<PoiFeature[]>([]);
  const [poiStats, setPoiStats] = useState<PoiStats | null>(null);

  useEffect(() => {
    if (!settings.analysisPoint) {
      setPoiFeatures([]);
      setPoiStats(null);
      return;
    }
    if (!settings.showPoiLayer) return;

    const { lat, lng } = settings.analysisPoint;
    const key = poiCacheKey(lat, lng);
    const cached = poiCache.get(key);
    if (cached) {
      setPoiFeatures(cached.features);
      setPoiStats(cached.stats);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setPoiFeatures([]);
    setPoiStats(null);

    fetchOverpass<OverpassPoiElement>(buildPoiQuery(lat, lng), {
      label: '生活機能 POI',
      signal: controller.signal,
      timeoutMs: 7_000,
      hedgeRequests: true,
      hedgeDelayMs: 650,
      retryDelayMs: 250,
    })
      .then(elements => {
        if (cancelled || controller.signal.aborted) return;
        const pois = parsePoiElements(elements);
        const stats = countPoiStats(lat, lng, pois);
        rememberPoiCache(key, { features: pois, stats });
        setPoiFeatures(pois);
        setPoiStats(stats);
      })
      .catch(err => {
        if (!controller.signal.aborted) console.warn('[POI] fetch failed:', err);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [settings.showPoiLayer, settings.analysisPoint?.lat, settings.analysisPoint?.lng]);

  return { poiFeatures, poiStats };
}
