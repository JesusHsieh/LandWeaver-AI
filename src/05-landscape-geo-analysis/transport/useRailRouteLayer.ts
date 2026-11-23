/**
 * useRailRouteLayer — shared hook for loading/unloading a single-colour
 * rail route + its stations (dots and names) into the Cesium viewer.
 *
 * Used by TRA, 桃捷, 中捷 (single colour, flat geometry array).
 */

import React, { useEffect, useRef } from 'react';
import { GroundPolylinePrimitive } from 'cesium';
import type { LineRoute } from '../data/transportData';
import {
  waitForViewer, removePrim, makeGroundLine,
  makeStations, addStations, removeStations, type StationPrims,
} from './cesiumPrimitiveHelpers';

export function useRailRouteLayer(
  viewerRef: React.RefObject<any>,
  enabled: boolean,
  color: string,
  lineWidth: number,
  loadFn: () => Promise<LineRoute>,
  stationPixelSize: number,
  labelMaxDistance: number,
): void {
  const routeRef    = useRef<GroundPolylinePrimitive | null>(null);
  const stationsRef = useRef<StationPrims | null>(null);
  const cache       = useRef<LineRoute | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, routeRef.current);
    routeRef.current = null;
    removeStations(vNow, stationsRef.current);
    stationsRef.current = null;

    if (!enabled) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !enabled) return;

      const route = cache.current ?? await loadFn();
      if (route.lines.length) cache.current = route; // an empty result is retried next time
      if (cancelled || !enabled) return;

      const prim = makeGroundLine(route.lines, color, lineWidth);
      if (prim) {
        v.scene.primitives.add(prim);
        routeRef.current = prim;
      }

      const stations = makeStations(route.stations, { outline: color, pixelSize: stationPixelSize, labelMaxDistance });
      addStations(v, stations);
      stationsRef.current = stations;
    })();

    return () => { cancelled = true; };
  }, [enabled]);

  // Unmount
  useEffect(() => () => {
    const v = getV();
    removePrim(v, routeRef.current);
    removeStations(v, stationsRef.current);
  }, []);
}
