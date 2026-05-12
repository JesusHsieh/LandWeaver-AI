import { useRef, useEffect, useCallback } from 'react';
import {
  createWorldTerrainAsync,
  EllipsoidTerrainProvider,
  Matrix4,
  Cartographic,
  Cartesian3,
  sampleTerrainMostDetailed,
} from 'cesium';
import { MapSettings } from '../types';

export function useCesiumTerrain(
  viewerRef: React.RefObject<any>,
  osmTilesetRef: React.RefObject<any>,
  settings: MapSettings
) {
  // A hidden WorldTerrain provider kept only for height-sampling — never assigned to viewer
  const terrainSamplerRef = useRef<any>(null);

  // Load the sampler terrain once on mount so we can always know the real ground height
  useEffect(() => {
    createWorldTerrainAsync()
      .then(tp => { terrainSamplerRef.current = tp; })
      .catch(() => {});
  }, []);

  // Compute and apply the vertical offset that makes OSM buildings land on the visible ground.
  const applyBuildingOffset = useCallback(async (showTerrain: boolean, lat: number, lng: number) => {
    const tileset = osmTilesetRef.current;
    if (!tileset) return;

    if (showTerrain) {
      tileset.modelMatrix = Matrix4.IDENTITY.clone();
      return;
    }

    const sampler = terrainSamplerRef.current;
    if (!sampler) return;
    try {
      const carto = Cartographic.fromDegrees(lng, lat);
      const [sampled] = await sampleTerrainMostDetailed(sampler, [carto]);
      const h = sampled.height ?? 0;
      if (Math.abs(h) < 0.1) return;
      const surface  = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0.0);
      const shifted  = Cartesian3.fromRadians(carto.longitude, carto.latitude, -h);
      const translation = Cartesian3.subtract(shifted, surface, new Cartesian3());
      tileset.modelMatrix = Matrix4.fromTranslation(translation);
    } catch (e) {
      console.warn('Building offset sampling failed', e);
    }
  }, [osmTilesetRef]);

  // ── Effect A — Terrain provider switching (only depends on settings.showTerrain) ──
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;
    if (!viewer) return;

    if (settings.showTerrain) {
      createWorldTerrainAsync()
        .then(tp => { viewer.terrainProvider = tp; })
        .catch(e => { console.error('無法載入地形', e); });
    } else {
      viewer.terrainProvider = new EllipsoidTerrainProvider();
    }
  }, [settings.showTerrain]); // ONLY this dependency

  // ── Effect B — OSM buildings vertical offset ──────────────────────────────
  // Re-run whenever analysis point changes OR terrain changes OR tileset becomes ready
  useEffect(() => {
    if (!viewerRef.current || !osmTilesetRef.current) return;
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;
    applyBuildingOffset(settings.showTerrain, lat, lng);
  }, [settings.showTerrain, settings.analysisPoint, applyBuildingOffset]);

  const handleTilesetReady = async (tileset: any) => {
    osmTilesetRef.current = tileset;
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;
    await applyBuildingOffset(settings.showTerrain, lat, lng);
  };

  return { handleTilesetReady };
}
