import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { haversineM } from '../utils/geo';
import { fetchOverpass } from '../utils/fetchOverpass';

export type PoiCat = 'school' | 'park' | 'market' | 'medical' | 'bus' | 'public';
export type PoiFeature = { lat: number; lng: number; cat: PoiCat; name: string };
export type PoiStats = Record<PoiCat, number>;

export function usePoiLayer(settings: MapSettings): { poiFeatures: PoiFeature[]; poiStats: PoiStats | null } {
  const [poiFeatures, setPoiFeatures] = useState<PoiFeature[]>([]);
  const [poiStats, setPoiStats] = useState<PoiStats | null>(null);

  useEffect(() => {
    if (!settings.showPoiLayer || !settings.analysisPoint) { setPoiFeatures([]); setPoiStats(null); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;
    const r = 0.006;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:18];(
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
    );out center 500;`;
    fetchOverpass<any>(q)
      .then(elements => {
        if (cancelled) return;
        const catOf = (el: any): PoiCat | null => {
          const a = el.tags?.amenity, l = el.tags?.leisure, s = el.tags?.shop, h = el.tags?.highway;
          if (['school','kindergarten','university','college'].includes(a)) return 'school';
          if (['park','playground','garden'].includes(l)) return 'park';
          if (a === 'marketplace' || ['supermarket','convenience','market'].includes(s)) return 'market';
          if (['hospital','clinic','pharmacy','dentist'].includes(a)) return 'medical';
          if (h === 'bus_stop') return 'bus';
          if (['library','post_office','community_centre','police','fire_station','townhall'].includes(a)) return 'public';
          return null;
        };
        const pois: PoiFeature[] = elements
          .map((el: any) => {
            const cat = catOf(el);
            if (!cat) return null;
            const plat = el.lat ?? el.center?.lat;
            const plng = el.lon ?? el.center?.lon;
            if (!plat || !plng) return null;
            return { lat: plat, lng: plng, cat, name: el.tags?.['name:zh'] ?? el.tags?.name ?? '' };
          })
          .filter(Boolean) as PoiFeature[];
        setPoiFeatures(pois);
        // 500m circle stats
        const stats: PoiStats = { school: 0, park: 0, market: 0, medical: 0, bus: 0, public: 0 };
        pois.forEach(p => { if (haversineM(lat, lng, p.lat, p.lng) <= 500) stats[p.cat]++; });
        setPoiStats(stats);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [settings.showPoiLayer, settings.analysisPoint]);

  return { poiFeatures, poiStats };
}
