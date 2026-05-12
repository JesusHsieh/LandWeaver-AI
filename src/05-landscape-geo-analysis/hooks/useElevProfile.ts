import React, { useState, useEffect } from 'react';
import { MapSettings } from '../types';
import { haversineM } from '../utils/geo';

export function useElevProfile(settings: MapSettings): {
  elevPts: { lat: number; lng: number }[];
  setElevPts: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
  elevData: { d: number; e: number }[];
  setElevData: React.Dispatch<React.SetStateAction<{ d: number; e: number }[]>>;
  elevLoading: boolean;
  setElevLoading: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const [elevPts, setElevPts] = useState<{ lat: number; lng: number }[]>([]);
  const [elevData, setElevData] = useState<{ d: number; e: number }[]>([]);
  const [elevLoading, setElevLoading] = useState(false);

  useEffect(() => {
    if (!settings.showElevProfile) { setElevPts([]); setElevData([]); }
  }, [settings.showElevProfile]);

  return { elevPts, setElevPts, elevData, setElevData, elevLoading, setElevLoading };
}
