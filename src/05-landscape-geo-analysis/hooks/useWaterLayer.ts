import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { fetchOverpass } from '../utils/fetchOverpass';

export function useWaterLayer(settings: MapSettings): { waterFeatures: { lat: number; lng: number; name: string }[] } {
  const [waterFeatures, setWaterFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);

  useEffect(() => {
    if (!settings.showDrinkingWater) { setWaterFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.6;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["landuse"="reservoir"](${bbox});node["natural"="water"]["name"](${bbox});way["landuse"="reservoir"](${bbox});relation["landuse"="reservoir"](${bbox}););out center 120;`;
    fetchOverpass<any>(q)
      .then(elements => {
        const features = elements.map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '水源地',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08G] OSM water loaded:', features.length);
        setWaterFeatures(features);
      })
      .catch((e) => console.warn('[08G] OSM fetch failed:', e));
  }, [settings.showDrinkingWater, settings.analysisPoint]);

  return { waterFeatures };
}
