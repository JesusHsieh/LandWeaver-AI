import { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { fetchOverpass } from '../utils/fetchOverpass';

export function useBuildingDensity(settings: MapSettings): { buildingGrid: { lat: number; lng: number; count: number }[] } {
  const [buildingGrid, setBuildingGrid] = useState<{ lat: number; lng: number; count: number }[]>([]);

  useEffect(() => {
    if (!settings.showBuildingDensity || !settings.analysisPoint) { setBuildingGrid([]); return; }
    const { lat, lng } = settings.analysisPoint;
    const r = 0.007;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:12];(way["building"](${bbox});node["building"](${bbox}););out center 400;`;
    fetchOverpass<any>(q)
      .then(elements => {
        const pts = elements.map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
        })).filter((f: any) => f.lat && f.lng);
        // 5×5 grid
        const CELLS = 5;
        const cellSize = (r * 2) / CELLS;
        const grid: { lat: number; lng: number; count: number }[] = [];
        for (let row = 0; row < CELLS; row++) {
          for (let col = 0; col < CELLS; col++) {
            const cLat = (lat - r) + (row + 0.5) * cellSize;
            const cLng = (lng - r) + (col + 0.5) * cellSize;
            const count = pts.filter((p: any) =>
              Math.abs(p.lat - cLat) < cellSize / 2 &&
              Math.abs(p.lng - cLng) < cellSize / 2
            ).length;
            if (count > 0) grid.push({ lat: cLat, lng: cLng, count });
          }
        }
        setBuildingGrid(grid);
      })
      .catch(() => {});
  }, [settings.showBuildingDensity, settings.analysisPoint]);

  return { buildingGrid };
}
