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
  Cartesian3,
} from 'cesium';

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
