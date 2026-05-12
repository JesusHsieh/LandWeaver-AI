import React, { useState, useEffect } from 'react';
import { MapSettings } from '../types';

export function useMeasureTool(settings: MapSettings): {
  measurePts: { lat: number; lng: number }[];
  setMeasurePts: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
} {
  const [measurePts, setMeasurePts] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!settings.showMeasureTool) { setMeasurePts([]); }
  }, [settings.showMeasureTool]);

  return { measurePts, setMeasurePts };
}
