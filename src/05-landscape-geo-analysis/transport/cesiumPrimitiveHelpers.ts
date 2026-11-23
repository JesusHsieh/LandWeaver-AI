/**
 * cesiumPrimitiveHelpers — standalone helper functions for creating/removing
 * Cesium primitives (no React, no hooks).
 */

import {
  GroundPolylinePrimitive,
  GroundPolylineGeometry,
  GeometryInstance,
  PolylineMaterialAppearance,
  Material,
  Color,
  Cartesian2,
  Cartesian3,
  PointPrimitiveCollection,
  LabelCollection,
  LabelStyle,
  VerticalOrigin,
  NearFarScalar,
  DistanceDisplayCondition,
} from 'cesium';

// ── 站點：白點 + 路線色外框，拉近才顯示站名 ────────────────────────────────────
export interface StationStyle {
  /** 外框顏色（路線色） */
  outline: string;
  pixelSize: number;
  /** 相機距離（公尺）小於此值才顯示站名，避免拉遠時文字疊成一團 */
  labelMaxDistance: number;
}

export interface StationPrims {
  points: PointPrimitiveCollection;
  labels: LabelCollection;
}

export function makeStations(
  stations: { name: string; coords: [number, number] }[],
  { outline, pixelSize, labelMaxDistance }: StationStyle,
): StationPrims {
  const points = new PointPrimitiveCollection();
  const labels = new LabelCollection();
  const outlineColor = Color.fromCssColorString(outline).withAlpha(0.9);
  const pointScale = new NearFarScalar(1e4, 1.2, 1e6, 0.5);
  const showLabel = new DistanceDisplayCondition(0, labelMaxDistance);
  for (const { name, coords: [lng, lat] } of stations) {
    const position = Cartesian3.fromDegrees(lng, lat, 2);
    points.add({
      position,
      pixelSize,
      color: Color.WHITE.withAlpha(0.95),
      outlineColor,
      outlineWidth: 2,
      scaleByDistance: pointScale,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不被地形或 3D 建物遮住
    });
    labels.add({
      position,
      text: name,
      font: '600 12px sans-serif',
      fillColor: Color.WHITE,
      outlineColor: Color.fromBytes(20, 20, 20, 230),
      outlineWidth: 3,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -8),
      distanceDisplayCondition: showLabel,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    });
  }
  return { points, labels };
}

export function addStations(viewer: any, prims: StationPrims) {
  viewer.scene.primitives.add(prims.points);
  viewer.scene.primitives.add(prims.labels);
}

export function removeStations(viewer: any, prims: StationPrims | null) {
  removePrim(viewer, prims?.points);
  removePrim(viewer, prims?.labels);
}

// ── 等待 Cesium Viewer 就緒 ────────────────────────────────────────────────────
export function waitForViewer(viewerRef: React.RefObject<any>): Promise<any> {
  return new Promise(resolve => {
    const check = () => {
      const v = viewerRef.current?.cesiumElement;
      if (v?.scene) { resolve(v); return; }
      setTimeout(check, 150);
    };
    check();
  });
}

// ── 安全移除 primitive ────────────────────────────────────────────────────────
export function removePrim(viewer: any, prim: any) {
  if (!prim || !viewer?.scene?.primitives) return;
  try { viewer.scene.primitives.remove(prim); } catch { /* already removed */ }
}

// ── 建立 GroundPolylinePrimitive（貼地路線）───────────────────────────────────
export function makeGroundLine(
  segments: [number, number][][],
  colorHex: string,
  width: number,
): GroundPolylinePrimitive | null {
  const validSegs = segments.filter(s => s.length >= 2);
  if (!validSegs.length) return null;

  const instances = validSegs.map(seg =>
    new GeometryInstance({
      geometry: new GroundPolylineGeometry({
        positions: seg.map(([lng, lat]) => Cartesian3.fromDegrees(lng, lat)),
        width,
      }),
    })
  );

  return new GroundPolylinePrimitive({
    geometryInstances: instances,
    appearance: new PolylineMaterialAppearance({
      material: Material.fromType('Color', {
        color: Color.fromCssColorString(colorHex).withAlpha(0.92),
      }),
    }),
    asynchronous: false,
  });
}
