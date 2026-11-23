/**
 * Cesium Ion token check, shared by the map and the sidebar.
 *
 * Without VITE_CESIUM_ION_TOKEN, Cesium uses the token bundled with its
 * release, which expires a few months later. After that every Ion asset
 * (World Terrain, OSM Buildings, Google 3D) fails with 401 and the layers
 * silently show nothing — so check once and let callers fall back.
 */
import { useEffect, useState } from 'react';
import { Ion, IonResource } from 'cesium';

export type IonStatus = 'checking' | 'ok' | 'invalid';

// Captured at import time, before main.tsx applies the user's token.
const BUNDLED_TOKEN = Ion.defaultAccessToken;

let pending: Promise<boolean> | null = null;
let current: IonStatus = 'checking';
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

export function checkIonAccess(): Promise<boolean> {
  if (!pending) {
    current = 'checking';
    // Asset 1 (Cesium World Terrain) is readable with any valid token.
    const request = IonResource.fromAssetId(1).then(() => true, () => false);
    pending = request;
    request.then(ok => {
      if (pending !== request) return; // a newer token replaced this check
      current = ok ? 'ok' : 'invalid';
      if (!ok) console.warn('[LandWeaver] Cesium Ion Token 無效或未設定：地形改用 Esri，3D 建物改用 OSM Overpass，Google 3D 無法顯示。');
      notify();
    });
  }
  return pending;
}

/** Apply a token saved in ⚙ 設定 without reloading the page, then re-check. */
export function setIonToken(token: string): void {
  Ion.defaultAccessToken = token || BUNDLED_TOKEN;
  pending = null;
  checkIonAccess();
  notify();
}

export function useIonStatus(): IonStatus {
  const [status, setStatus] = useState<IonStatus>(current);
  useEffect(() => {
    const update = () => setStatus(current);
    listeners.add(update);
    checkIonAccess();
    update();
    return () => { listeners.delete(update); };
  }, []);
  return status;
}
