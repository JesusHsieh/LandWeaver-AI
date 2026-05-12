/**
 * useRailRouteLayer — shared hook for loading/unloading a single-colour
 * rail route + station dot collection into the Cesium viewer.
 *
 * Used by TRA, 桃捷, 中捷 (single colour, flat geometry array).
 */

import React, { useEffect, useRef } from 'react';
import {
  GroundPolylinePrimitive,
  PointPrimitiveCollection,
  Color,
  Cartesian3,
  NearFarScalar,
} from 'cesium';
import { SimpleStation } from '../data/transportData';
import { waitForViewer, removePrim, makeGroundLine } from './cesiumPrimitiveHelpers';

export function useRailRouteLayer(
  viewerRef: React.RefObject<any>,
  enabled: boolean,
  color: string,
  lineWidth: number,
  loadFn: () => Promise<[number, number][][]>,
  stations: SimpleStation[],
  stationPixelSize: number,
  label?: string,
): void {
  const routeRef   = useRef<GroundPolylinePrimitive | null>(null);
  const stPtsRef   = useRef<PointPrimitiveCollection | null>(null);
  const geoCache   = useRef<[number, number][][] | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, routeRef.current);
    routeRef.current = null;
    removePrim(vNow, stPtsRef.current);
    stPtsRef.current = null;

    if (!enabled) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !enabled) return;

      if (!geoCache.current) {
        if (label) console.log(`[Transport] 載入 ${label} (OSM way)...`);
        geoCache.current = await loadFn();
      }
      if (cancelled || !enabled) return;

      const prim = makeGroundLine(geoCache.current, color, lineWidth);
      if (prim) {
        v.scene.primitives.add(prim);
        routeRef.current = prim;
      }

      if (stations.length > 0) {
        const pts = new PointPrimitiveCollection();
        stations.forEach(s => pts.add({
          position:    Cartesian3.fromDegrees(s.coords[0], s.coords[1], 2),
          pixelSize:   stationPixelSize,
          color:       Color.WHITE.withAlpha(0.9),
          outlineColor: Color.fromCssColorString(color).withAlpha(0.85),
          outlineWidth: 2,
          scaleByDistance: new NearFarScalar(1e4, 1.4, 4e5, 0.3),
        }));
        v.scene.primitives.add(pts);
        stPtsRef.current = pts;
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
