/**
 * OSM 3D buildings without Cesium Ion.
 *
 * Cesium OSM Buildings (Ion asset 96188) needs a valid Ion token. When there
 * is none, footprints come from Overpass instead and are extruded by their
 * `height` / `building:levels` tags, so the layer still shows the same OSM data.
 */
import { useEffect, useRef } from 'react';
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  EllipsoidTerrainProvider,
  GeometryInstance,
  Material,
  Math as CesiumMath,
  MaterialAppearance,
  Matrix4,
  PolygonGeometry,
  PolygonHierarchy,
  Primitive,
  ShadowMode,
  sampleTerrain,
  sampleTerrainMostDetailed,
} from 'cesium';
import { fetchOverpass } from '../utils/fetchOverpass';
import { waitForViewer, removePrim } from '../transport/cesiumPrimitiveHelpers';
import { haversineM } from '../utils/geo';

const RADIUS_M = 600;
const MAX_CAMERA_HEIGHT_M = 15_000; // individual buildings are not visible from higher up
const MAX_BUILDINGS = 3000;
const METERS_PER_LEVEL = 3.2;
const DEFAULT_HEIGHT_M = 9; // untagged buildings: ~3 floors

interface OverpassBuilding {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

function buildingHeight(tags: Record<string, string> = {}): number {
  const height = parseFloat(tags.height); // "12", "12 m"
  if (Number.isFinite(height) && height > 0) return height;
  const levels = parseFloat(tags['building:levels']);
  if (Number.isFinite(levels) && levels > 0) return levels * METERS_PER_LEVEL;
  return DEFAULT_HEIGHT_M;
}

function footprint(geometry: OverpassBuilding['geometry']): Cartesian3[] | null {
  if (!geometry) return null;
  const pts = geometry.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first && last && first.lat === last.lat && first.lon === last.lon) pts.pop();
  if (pts.length < 3) return null;
  return pts.map(p => Cartesian3.fromDegrees(p.lon, p.lat));
}

function buildingColor(hue: number, opacity: number): Color {
  return Color.fromCssColorString(`hsl(${hue},45%,62%)`).withAlpha(opacity);
}

/** Lift the batch onto the terrain surface at the area centre (identity on the ellipsoid). */
async function groundOffset(viewer: any, lat: number, lng: number): Promise<Matrix4> {
  const provider = viewer.terrainProvider;
  if (!provider || provider instanceof EllipsoidTerrainProvider) return Matrix4.IDENTITY.clone();
  const carto = Cartographic.fromDegrees(lng, lat);
  let sampled: Cartographic | undefined;
  try {
    [sampled] = await sampleTerrainMostDetailed(provider, [carto]);
  } catch {
    try { [sampled] = await sampleTerrain(provider, 13, [carto]); } catch { /* keep identity */ }
  }
  const h = sampled?.height;
  if (!Number.isFinite(h) || Math.abs(h as number) < 0.1) return Matrix4.IDENTITY.clone();
  const surface = Cartesian3.fromDegrees(lng, lat, 0);
  const lifted = Cartesian3.fromDegrees(lng, lat, h as number);
  return Matrix4.fromTranslation(Cartesian3.subtract(lifted, surface, new Cartesian3()));
}

type LatLng = { lat: number; lng: number };

/** Ground point at the centre of the screen (camera position when looking at the sky). */
function viewCenter(viewer: any): LatLng {
  const { scene, camera } = viewer;
  const screenCenter = new Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2);
  const ray = camera.getPickRay(screenCenter);
  const hit = (ray && scene.globe.pick(ray, scene)) || camera.pickEllipsoid(screenCenter);
  const carto = hit ? Cartographic.fromCartesian(hit) : camera.positionCartographic;
  return { lat: CesiumMath.toDegrees(carto.latitude), lng: CesiumMath.toDegrees(carto.longitude) };
}

/**
 * Loads footprints around the centre of the view and reloads after the camera
 * moves away — like the Ion tileset, buildings appear wherever you look.
 */
export function useOsmBuildingsFallback(
  viewerRef: React.RefObject<any>,
  enabled: boolean,
  hue: number,
  opacity: number,
): void {
  const primRef = useRef<Primitive | null>(null);
  const colorRef = useRef({ hue, opacity });
  colorRef.current = { hue, opacity };

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let controller: AbortController | null = null;
    let loadedCenter: LatLng | null = null;
    let pendingCenter: LatLng | null = null;
    const removers: (() => void)[] = [];

    const applyOffset = async (viewer: any) => {
      const prim = primRef.current;
      const center = loadedCenter;
      if (!prim || !center) return;
      const matrix = await groundOffset(viewer, center.lat, center.lng);
      if (!cancelled && primRef.current === prim) prim.modelMatrix = matrix;
    };

    const load = async (viewer: any, center: LatLng) => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      pendingCenter = center;

      const dLat = RADIUS_M / 111_320;
      const dLng = RADIUS_M / (111_320 * Math.cos((center.lat * Math.PI) / 180));
      const bbox = `${center.lat - dLat},${center.lng - dLng},${center.lat + dLat},${center.lng + dLng}`;
      const query = `[out:json][timeout:25];way["building"](${bbox});out geom ${MAX_BUILDINGS};`;

      let buildings: OverpassBuilding[];
      try {
        buildings = await fetchOverpass<OverpassBuilding>(query, {
          signal: request.signal,
          label: 'OSM 3D 建物',
          timeoutMs: 30_000,
        });
      } catch (e) {
        if (!cancelled && !request.signal.aborted) {
          pendingCenter = null;
          console.warn('[OSM 3D] 建物輪廓載入失敗', e);
        }
        return;
      }
      if (cancelled || request.signal.aborted) return;
      pendingCenter = null;

      const instances: GeometryInstance[] = [];
      for (const b of buildings) {
        const positions = footprint(b.geometry);
        if (!positions) continue;
        instances.push(new GeometryInstance({
          id: b.id,
          geometry: new PolygonGeometry({
            polygonHierarchy: new PolygonHierarchy(positions),
            height: 0,
            extrudedHeight: buildingHeight(b.tags),
            vertexFormat: MaterialAppearance.MaterialSupport.BASIC.vertexFormat,
          }),
        }));
      }

      removePrim(viewer, primRef.current);
      primRef.current = null;
      loadedCenter = center;
      if (!instances.length) return;

      const { hue: h, opacity: o } = colorRef.current;
      const prim = new Primitive({
        geometryInstances: instances,
        appearance: new MaterialAppearance({
          material: Material.fromType('Color', { color: buildingColor(h, o) }),
          translucent: true,
          closed: true,
        }),
        shadows: ShadowMode.ENABLED,
      });
      viewer.scene.primitives.add(prim);
      primRef.current = prim;
      console.log(`[OSM 3D] Ion 無效，改用 Overpass 建物輪廓：${instances.length} 棟`);
      applyOffset(viewer);
    };

    const maybeLoad = (viewer: any) => {
      if (viewer.camera.positionCartographic.height > MAX_CAMERA_HEIGHT_M) return;
      const center = viewCenter(viewer);
      const current = pendingCenter ?? loadedCenter;
      if (current && haversineM(current.lat, current.lng, center.lat, center.lng) < RADIUS_M / 2) return;
      load(viewer, center);
    };

    waitForViewer(viewerRef).then(viewer => {
      if (cancelled) return;
      maybeLoad(viewer);
      removers.push(viewer.camera.moveEnd.addEventListener(() => maybeLoad(viewer)));
      removers.push(viewer.scene.globe.terrainProviderChanged.addEventListener(() => applyOffset(viewer)));
    });

    return () => {
      cancelled = true;
      controller?.abort();
      removers.forEach(remove => remove());
      removePrim(viewerRef.current?.cesiumElement, primRef.current);
      primRef.current = null;
    };
  }, [enabled]);

  // Colour / opacity sliders: update the material uniform, no rebuild.
  useEffect(() => {
    const prim = primRef.current as any;
    if (!prim?.appearance?.material) return;
    prim.appearance.material.uniforms.color = buildingColor(hue, opacity);
  }, [hue, opacity]);
}
