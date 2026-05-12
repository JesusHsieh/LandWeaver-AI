import { useState, useEffect, useRef } from 'react';
import { MapSettings } from '../types';
import { haversineM, twd97ToWgs84, isInTaipeiCity } from '../utils/geo';
import { fetchOverpass } from '../utils/fetchOverpass';

type TreeFeature = { lat: number; lng: number; species: string; src: 'tpe' | 'osm' };

export function useTreeLayer(settings: MapSettings): { treeFeatures: TreeFeature[] } {
  const [treeFeatures, setTreeFeatures] = useState<TreeFeature[]>([]);
  const tpeCacheRef = useRef<TreeFeature[] | null>(null);

  useEffect(() => {
    if (!settings.showStreetTreeLayer) { setTreeFeatures([]); return; }
    if (!settings.analysisPoint) { setTreeFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;

    const loadOsm = () => {
      const r = 0.006;
      const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
      const q = `[out:json][timeout:15];(node["natural"="tree"](${bbox});node["natural"="tree_row"](${bbox});node["street_tree"="yes"](${bbox});way["natural"="tree_row"](${bbox}););out center 400;`;
      fetchOverpass<any>(q)
        .then(elements => {
          if (cancelled) return;
          const trees: TreeFeature[] = elements.map((el: any) => ({
            lat: (el.lat ?? el.center?.lat) as number,
            lng: (el.lon ?? el.center?.lon) as number,
            species: el.tags?.['species:zh'] ?? el.tags?.species ?? el.tags?.name ?? '樹木',
            src: 'osm' as const,
          })).filter((f: TreeFeature) => f.lat && f.lng).slice(0, 400);
          setTreeFeatures(trees);
        })
        .catch(() => {});
    };

    if (isInTaipeiCity(lat, lng)) {
      if (tpeCacheRef.current) {
        const nearby = tpeCacheRef.current
          .filter(t => haversineM(lat, lng, t.lat, t.lng) < 800)
          .sort((a, b) => haversineM(lat, lng, a.lat, a.lng) - haversineM(lat, lng, b.lat, b.lng))
          .slice(0, 1200);
        setTreeFeatures(nearby);
        return () => { cancelled = true; };
      }
      const ctrl = new AbortController();
      fetch('/tpe-tree/TaipeiTree.json', { signal: ctrl.signal })
        .then(res => res.json())
        .then((data: any[]) => {
          if (cancelled) return;
          const all: TreeFeature[] = data
            .map((item: any) => {
              const { lat: tLat, lng: tLng } = twd97ToWgs84(Number(item.TWD97X), Number(item.TWD97Y));
              return { lat: tLat, lng: tLng, species: item.TreeType ?? '行道樹', src: 'tpe' as const };
            })
            .filter((f: TreeFeature) => f.lat > 24 && f.lat < 26 && f.lng > 120 && f.lng < 122.5);
          tpeCacheRef.current = all;
          const nearby = all
            .filter(t => haversineM(lat, lng, t.lat, t.lng) < 800)
            .sort((a, b) => haversineM(lat, lng, a.lat, a.lng) - haversineM(lat, lng, b.lat, b.lng))
            .slice(0, 1200);
          setTreeFeatures(nearby);
        })
        .catch(() => { if (!cancelled) loadOsm(); });
      return () => { cancelled = true; ctrl.abort(); };
    } else {
      loadOsm();
      return () => { cancelled = true; };
    }
  }, [settings.showStreetTreeLayer, settings.analysisPoint]);

  return { treeFeatures };
}
