import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { fetchOverpass } from '../utils/fetchOverpass';

export type RoadKind = 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential';
export type RoadFeature = { pts: { lat: number; lng: number }[]; kind: RoadKind; name: string };

export function useRoadLayer(settings: MapSettings): { roadFeatures: RoadFeature[] } {
  const [roadFeatures, setRoadFeatures] = useState<RoadFeature[]>([]);

  useEffect(() => {
    if (!settings.showRoadLayer || !settings.analysisPoint) { setRoadFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;
    const r = 0.007;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:15];(way["highway"~"^(trunk|primary|secondary|tertiary|residential|unclassified)$"](${bbox}););out geom 300;`;
    fetchOverpass<any>(q)
      .then(elements => {
        if (cancelled) return;
        const kindMap: Record<string, RoadKind> = {
          trunk: 'trunk', primary: 'primary', secondary: 'secondary',
          tertiary: 'tertiary', residential: 'residential', unclassified: 'residential',
        };
        const roads: RoadFeature[] = elements
          .filter((el: any) => el.type === 'way' && el.geometry?.length >= 2)
          .map((el: any) => ({
            pts: (el.geometry as { lat: number; lon: number }[]).map(g => ({ lat: g.lat, lng: g.lon })),
            kind: kindMap[el.tags?.highway] ?? 'residential',
            name: el.tags?.['name:zh'] ?? el.tags?.name ?? '',
          }));
        setRoadFeatures(roads);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [settings.showRoadLayer, settings.analysisPoint]);

  return { roadFeatures };
}
