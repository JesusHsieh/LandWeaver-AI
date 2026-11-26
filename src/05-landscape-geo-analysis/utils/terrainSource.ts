import {
  ArcGISTiledElevationTerrainProvider,
  Cartographic,
  createWorldTerrainAsync,
  sampleTerrain,
  type TerrainProvider,
} from 'cesium';
import { checkIonAccess } from './ionStatus';

// Esri World Elevation 3D: public, keyless and CORS-enabled.
export const ESRI_TERRAIN_URL =
  'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer';

/** Cesium World Terrain when the Ion token works, otherwise Esri World Elevation. */
export async function createTerrainProvider(): Promise<TerrainProvider> {
  if (await checkIonAccess()) {
    try {
      return await createWorldTerrainAsync();
    } catch (e) {
      console.warn('[Terrain] Cesium World Terrain 載入失敗，改用 Esri World Elevation', e);
    }
  }
  return ArcGISTiledElevationTerrainProvider.fromUrl(ESRI_TERRAIN_URL);
}

let esriTerrain: Promise<TerrainProvider> | null = null;

/**
 * 地面高程（公尺），供搜尋定位時把相機放在地面以上，避免在山區鑽進地形或 3D 模型。
 * 用 Esri World Elevation（免金鑰）；逾時或失敗時拋錯，由呼叫端改用保守高度。
 */
export async function sampleGroundHeight(lat: number, lng: number, timeoutMs = 4000): Promise<number> {
  esriTerrain ??= ArcGISTiledElevationTerrainProvider.fromUrl(ESRI_TERRAIN_URL)
    .catch(e => { esriTerrain = null; throw e; });
  const sample = esriTerrain.then(tp => sampleTerrain(tp, 12, [Cartographic.fromDegrees(lng, lat)], true));
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('地面高程查詢逾時')), timeoutMs));
  const [pt] = await Promise.race([sample, timeout]);
  if (!Number.isFinite(pt.height)) throw new Error('地面高程無資料');
  return pt.height;
}
