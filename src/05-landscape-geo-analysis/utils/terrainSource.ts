import {
  ArcGISTiledElevationTerrainProvider,
  createWorldTerrainAsync,
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
