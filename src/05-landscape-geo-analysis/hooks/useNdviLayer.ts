import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { fetchOverpass } from '../utils/fetchOverpass';

export function useNdviLayer(settings: MapSettings): { ndviFeatures: { lat: number; lng: number }[] } {
  const [ndviFeatures, setNdviFeatures] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!settings.showNdviLayer || !settings.analysisPoint) { setNdviFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    const r = 0.008; // ~900m
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:12];(node["leisure"~"^(park|garden)$"](${bbox});node["natural"~"^(wood|tree|scrub)$"](${bbox});node["landuse"~"^(forest|grass|meadow|orchard|vineyard)$"](${bbox});way["leisure"="park"](${bbox});way["landuse"~"^(forest|grass)$"](${bbox}););out center 250;`;
    fetchOverpass<any>(q)
      .then(elements => {
        const pts = elements.map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
        })).filter((f: any) => f.lat && f.lng).slice(0, 250);
        setNdviFeatures(pts);
      })
      .catch(() => {});
  }, [settings.showNdviLayer, settings.analysisPoint]);

  return { ndviFeatures };
}
