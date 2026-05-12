import React, { useRef } from 'react';
import { MapSettings } from '../types';
import { fetchElevationProfile } from '../services/clients/elevationClient';

const SAMPLES = 12;

export function useMapInteractions(
  viewerRef: React.RefObject<any>,
  settings: MapSettings,
  onLocationClick: (lat: number, lng: number) => void,
  measurePts: { lat: number; lng: number }[],
  setMeasurePts: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>,
  elevState: {
    setElevPts: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
    setElevData: React.Dispatch<React.SetStateAction<{ d: number; e: number }[]>>;
    setElevLoading: React.Dispatch<React.SetStateAction<boolean>>;
  }
) {
  const { setElevPts, setElevData, setElevLoading } = elevState;

  // Abort controller ref — cancels in-flight elevation requests when the user
  // clicks again before the previous fetch completes.
  const elevAbortRef = useRef<AbortController | null>(null);

  const handleLeftClick = (movement: any) => {
    if (!viewerRef.current?.cesiumElement) return;
    const viewer = viewerRef.current.cesiumElement;
    let cartesian = viewer.scene.pickPosition(movement.position);
    if (!cartesian) cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
    if (!cartesian) return;

    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    const lat = cartographic.latitude * (180 / Math.PI);
    const lng = cartographic.longitude * (180 / Math.PI);

    // ── 距離量測模式 ──
    if (settings.showMeasureTool) {
      setMeasurePts(prev => [...prev, { lat, lng }]);
      return;
    }

    // ── 高程剖面模式 ──
    if (settings.showElevProfile) {
      setElevPts(prev => {
        const next = prev.length >= 2 ? [{ lat, lng }] : [...prev, { lat, lng }];
        if (next.length === 2) {
          const samplePoints = Array.from({ length: SAMPLES }, (_, i) => ({
            lat: next[0].lat + (next[1].lat - next[0].lat) * (i / (SAMPLES - 1)),
            lng: next[0].lng + (next[1].lng - next[0].lng) * (i / (SAMPLES - 1)),
          }));

          // Cancel any previous in-flight request
          elevAbortRef.current?.abort();
          elevAbortRef.current = new AbortController();
          const signal = elevAbortRef.current.signal;

          setElevLoading(true);
          fetchElevationProfile(samplePoints, signal)
            .then(results => { setElevData(results); })
            .catch(() => {})
            .finally(() => setElevLoading(false));
        } else {
          setElevData([]);
        }
        return next;
      });
      return;
    }

    onLocationClick(lat, lng);
  };

  return { handleLeftClick };
}
