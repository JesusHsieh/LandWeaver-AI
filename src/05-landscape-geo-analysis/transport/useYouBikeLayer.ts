/**
 * useYouBikeLayer — renders YouBike station dots coloured by availability.
 */

import React, { useEffect, useRef } from 'react';
import {
  PointPrimitiveCollection,
  Color,
  Cartesian3,
  NearFarScalar,
  DistanceDisplayCondition,
} from 'cesium';
import { fetchYouBikeStations, YouBikeStation } from '../services/tdxService';
import { waitForViewer, removePrim } from './cesiumPrimitiveHelpers';

export function useYouBikeLayer(
  viewerRef: React.RefObject<any>,
  enabled: boolean,
): void {
  const youbikeRef = useRef<PointPrimitiveCollection | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, youbikeRef.current);
    youbikeRef.current = null;

    if (!enabled) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !enabled) return;

      const stations = await fetchYouBikeStations();
      if (cancelled || !enabled) return;

      const pts = new PointPrimitiveCollection();
      stations.forEach((s: YouBikeStation) => {
        const ratio = s.sbi / Math.max(1, s.tot);
        const color = ratio > 0.5
          ? Color.fromBytes(76, 175, 80, 200)
          : ratio > 0.2
          ? Color.fromBytes(255, 193, 7, 200)
          : Color.fromBytes(244, 67, 54, 200);

        pts.add({
          position:    Cartesian3.fromDegrees(s.lng, s.lat, 2),
          pixelSize:   Math.max(5, Math.min(14, s.tot * 0.15)),
          color,
          outlineColor: Color.WHITE.withAlpha(0.55),
          outlineWidth: 1,
          distanceDisplayCondition: new DistanceDisplayCondition(0, 2.5e4),
          scaleByDistance: new NearFarScalar(1e3, 1.2, 2e4, 0.6),
        });
      });
      v.scene.primitives.add(pts);
      youbikeRef.current = pts;
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
