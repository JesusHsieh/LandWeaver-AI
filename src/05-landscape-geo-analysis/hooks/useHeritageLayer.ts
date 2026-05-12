import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { fetchOverpass } from '../utils/fetchOverpass';

export function useHeritageLayer(settings: MapSettings): { heritageFeatures: { lat: number; lng: number; name: string }[] } {
  const [heritageFeatures, setHeritageFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);

  useEffect(() => {
    if (!settings.showCulturalHeritage) { setHeritageFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.12;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["historic"](${bbox});node["tourism"="museum"](${bbox});node["heritage"](${bbox});way["historic"](${bbox}););out center 200;`;
    fetchOverpass<any>(q)
      .then(elements => {
        const features = elements.map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '文化資產',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08H] OSM heritage loaded:', features.length);
        setHeritageFeatures(features);
      })
      .catch((e) => console.warn('[08H] OSM fetch failed:', e));
  }, [settings.showCulturalHeritage, settings.analysisPoint]);

  return { heritageFeatures };
}
