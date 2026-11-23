import { useRef, useEffect, useCallback } from 'react';
import {
  EllipsoidTerrainProvider,
  Matrix4,
  Cartographic,
  Cartesian3,
  sampleTerrainMostDetailed,
} from 'cesium';
import { MapSettings } from '../types';
import { createTerrainProvider } from '../utils/terrainSource';
import { useIonStatus } from '../utils/ionStatus';

export function useCesiumTerrain(
  viewerRef: React.RefObject<any>,
  osmTilesetRef: React.RefObject<any>,
  settings: MapSettings
) {
  // A hidden terrain provider (World Terrain, or Esri without Ion) kept only for height-sampling — never assigned to viewer
  const terrainSamplerRef = useRef<any>(null);
  const ionStatus = useIonStatus();

  // Load the sampler terrain once on mount so we can always know the real ground height
  useEffect(() => {
    createTerrainProvider()
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

  // ── Effect A — Terrain provider switching ─────────────────────────────────
  // Waits for the Ion check so an invalid token falls back to Esri instead of
  // failing silently; re-runs if a token saved in ⚙ 設定 changes the result.
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;
    if (!viewer) return;

    if (!settings.showTerrain) {
      viewer.terrainProvider = new EllipsoidTerrainProvider();
      return;
    }
    if (ionStatus === 'checking') return;

    let cancelled = false;
    createTerrainProvider()
      .then(tp => { if (!cancelled) viewer.terrainProvider = tp; })
      .catch(e => { console.error('無法載入地形', e); });
    return () => { cancelled = true; };
  }, [settings.showTerrain, ionStatus]);

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
