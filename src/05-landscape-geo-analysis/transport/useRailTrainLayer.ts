/**
 * useRailTrainLayer — shared hook for timetable-interpolated train animation.
 *
 * Handles fetching a daily timetable once, computing interpolated train
 * positions, rendering them as PointPrimitiveCollection, and refreshing
 * on a setInterval. Cleans up on unmount or when disabled.
 */

import React, { useEffect, useRef } from 'react';
import {
  PointPrimitiveCollection,
  Color,
  Cartesian3,
} from 'cesium';
import { waitForViewer, removePrim } from './cesiumPrimitiveHelpers';

interface TrainPosition {
  lng: number;
  lat: number;
}

interface UseRailTrainLayerOptions {
  viewerRef: React.RefObject<any>;
  enabled: boolean;
  /** Pixel size for the train dot */
  pixelSize: number;
  /** RGBA bytes [r, g, b] — alpha is fixed at 240 */
  dotColorBytes: [number, number, number];
  /** Fetch the timetable once; returned value is passed to interpolateFn each tick */
  fetchTimetable: () => Promise<any[]>;
  /** Derive current train positions from the timetable */
  interpolateFn: (timetable: any[]) => TrainPosition[];
  /** Refresh interval in ms (default 30 000) */
  intervalMs?: number;
}

export function useRailTrainLayer({
  viewerRef,
  enabled,
  pixelSize,
  dotColorBytes,
  fetchTimetable,
  interpolateFn,
  intervalMs = 30_000,
}: UseRailTrainLayerOptions): void {
  const trainsRef = useRef<PointPrimitiveCollection | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, trainsRef.current);
    trainsRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    if (!enabled) return;

    let cancelled = false;

    const updateTrains = (timetable: any[], v: any) => {
      if (cancelled) return;
      removePrim(v, trainsRef.current);
      const positions = interpolateFn(timetable);

      const pts = new PointPrimitiveCollection();
      positions.forEach((p: TrainPosition) => pts.add({
        position:    Cartesian3.fromDegrees(p.lng, p.lat, 5),
        pixelSize,
        color:       Color.fromBytes(...dotColorBytes, 240),
        outlineColor: Color.WHITE.withAlpha(0.85),
        outlineWidth: 2,
      }));
      v.scene.primitives.add(pts);
      trainsRef.current = pts;
    };

    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !enabled) return;

      const tt = await fetchTimetable();
      if (cancelled || !enabled) return;

      updateTrains(tt, v);
      timerRef.current = setInterval(() => updateTrains(tt, v), intervalMs);
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
