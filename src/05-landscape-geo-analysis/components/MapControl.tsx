import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Viewer, CameraFlyTo, Entity, PointGraphics, Cesium3DTileset, ImageryLayer, PolylineGraphics, LabelGraphics, ScreenSpaceEventHandler, ScreenSpaceEvent, BillboardGraphics, EllipseGraphics } from 'resium';
import { Cartesian2, Cartesian3, Color, JulianDate, ShadowMode, createWorldTerrainAsync, IonResource, OpenStreetMapImageryProvider, UrlTemplateImageryProvider, WebMapTileServiceImageryProvider, WebMapServiceImageryProvider, Matrix4, Cartographic, sampleTerrainMostDetailed, EllipsoidTerrainProvider, ScreenSpaceEventType, VerticalOrigin, LabelStyle, HorizontalOrigin, Cesium3DTileStyle } from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';
import { GISService } from '../services/gisService';
import { TransportCesiumLayer } from './TransportCesiumLayer';

interface MapControlProps {
  settings: MapSettings;
  onLocationClick: (lat: number, lng: number) => void;
  landscapeData: LandscapeDesignData | null;
}

// Haversine distance in metres
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

// TWD97 TM2 Zone 121 (EPSG:3826) → WGS84 using standard TM inverse projection (USGS algorithm)
function twd97ToWgs84(E: number, N: number): { lat: number; lng: number } {
  const a   = 6378137.0;
  const f   = 1.0 / 298.257222101;
  const k0  = 0.9999;
  const E0  = 250000.0;
  const lon0 = 121.0 * Math.PI / 180.0;
  const b   = a * (1 - f);
  const e2  = (a * a - b * b) / (a * a);
  const ep2 = (a * a - b * b) / (b * b);
  const e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M   = N / k0;
  const mu  = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  const phi1 = mu
    + (3/2*e1 - 27/32*e1**3)     * Math.sin(2*mu)
    + (21/16*e1**2 - 55/32*e1**4) * Math.sin(4*mu)
    + (151/96*e1**3)               * Math.sin(6*mu)
    + (1097/512*e1**4)             * Math.sin(8*mu);
  const sinP = Math.sin(phi1), cosP = Math.cos(phi1), tanP = Math.tan(phi1);
  const N1 = a / Math.sqrt(1 - e2*sinP*sinP);
  const R1 = a*(1-e2) / Math.pow(1 - e2*sinP*sinP, 1.5);
  const T1 = tanP*tanP, C1 = ep2*cosP*cosP;
  const D  = (E - E0) / (N1 * k0);
  const lat = phi1 - N1*tanP/R1 * (
    D*D/2
    - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*ep2)               * D**4/24
    + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*ep2 - 3*C1*C1) * D**6/720
  );
  const lon = lon0 + (
    D
    - (1 + 2*T1 + C1)                                               * D**3/6
    + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*ep2 + 24*T1*T1) * D**5/120
  ) / cosP;
  return { lat: lat * 180 / Math.PI, lng: lon * 180 / Math.PI };
}

function isInTaipeiCity(lat: number, lng: number): boolean {
  return lat >= 24.97 && lat <= 25.21 && lng >= 121.46 && lng <= 121.66;
}

// Simple SVG elevation profile
function ElevProfilePanel({ data, onClose }: { data: { d: number; e: number }[]; onClose: () => void }) {
  if (!data.length) return null;
  const minE = Math.min(...data.map(p => p.e));
  const maxE = Math.max(...data.map(p => p.e));
  const totalD = data[data.length - 1].d;
  const W = 220; const H = 80; const PAD = 16;
  const iW = W - PAD * 2; const iH = H - PAD * 2;
  const scaleX = (d: number) => PAD + (d / totalD) * iW;
  const scaleY = (e: number) => PAD + iH - ((e - minE) / Math.max(maxE - minE, 1)) * iH;
  const pts = data.map(p => `${scaleX(p.d).toFixed(1)},${scaleY(p.e).toFixed(1)}`).join(' ');
  const area = `M${scaleX(0)},${scaleY(data[0].e)} ` +
    data.map(p => `L${scaleX(p.d).toFixed(1)},${scaleY(p.e).toFixed(1)}`).join(' ') +
    ` L${scaleX(totalD)},${H - PAD} L${scaleX(0)},${H - PAD} Z`;
  return (
    <div style={{
      position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(14,14,14,0.92)', border: '1px solid rgba(139,195,74,0.35)',
      borderRadius: 6, padding: '8px 10px', zIndex: 40, pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: '#8BC34A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          高程剖面 · {fmtDist(totalD)}
        </span>
        <button onClick={onClose} style={{ fontSize: 10, color: '#555', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 8 }}>✕</button>
      </div>
      <svg width={W} height={H}>
        <path d={area} fill="rgba(139,195,74,0.15)" />
        <polyline points={pts} fill="none" stroke="#8BC34A" strokeWidth={1.5} />
        {data.map((p, i) => (
          <circle key={i} cx={scaleX(p.d)} cy={scaleY(p.e)} r={2} fill="#8BC34A" />
        ))}
        <text x={PAD} y={PAD - 4} fontSize={8} fill="#666">{maxE.toFixed(0)} m</text>
        <text x={PAD} y={H - 4} fontSize={8} fill="#666">{minE.toFixed(0)} m</text>
      </svg>
    </div>
  );
}

export const MapControl: React.FC<MapControlProps> = ({ settings, onLocationClick, landscapeData }) => {
  const viewerRef        = useRef<any>(null);
  const osmTilesetRef    = useRef<any>(null);
  // A hidden WorldTerrain provider kept only for height-sampling — never assigned to viewer
  const terrainSamplerRef = useRef<any>(null);

  // ── Measure tool state ──────────────────────────────────────────────────────
  const [measurePts, setMeasurePts] = useState<{ lat: number; lng: number }[]>([]);

  // ── Elevation profile state ─────────────────────────────────────────────────
  const [elevPts, setElevPts] = useState<{ lat: number; lng: number }[]>([]);
  const [elevData, setElevData] = useState<{ d: number; e: number }[]>([]);
  const [elevLoading, setElevLoading] = useState(false);

  // ── OSM overlay state ───────────────────────────────────────────────────────
  const [ndviFeatures, setNdviFeatures] = useState<{ lat: number; lng: number }[]>([]);
  const [buildingGrid, setBuildingGrid] = useState<{ lat: number; lng: number; count: number }[]>([]);

  // ── Street tree state ───────────────────────────────────────────────────────
  type TreeFeature = { lat: number; lng: number; species: string; src: 'tpe' | 'osm' };
  const [treeFeatures, setTreeFeatures] = useState<TreeFeature[]>([]);
  const tpeCacheRef = useRef<TreeFeature[] | null>(null);

  // ── Road layer state ─────────────────────────────────────────────────────────
  type RoadKind = 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential';
  type RoadFeature = { pts: { lat: number; lng: number }[]; kind: RoadKind; name: string };
  const [roadFeatures, setRoadFeatures] = useState<RoadFeature[]>([]);

  // ── POI layer state ──────────────────────────────────────────────────────────
  type PoiCat = 'school' | 'park' | 'market' | 'medical' | 'bus' | 'public';
  type PoiFeature = { lat: number; lng: number; cat: PoiCat; name: string };
  const [poiFeatures, setPoiFeatures] = useState<PoiFeature[]>([]);
  type PoiStats = Record<PoiCat, number>;
  const [poiStats, setPoiStats] = useState<PoiStats | null>(null);

  // Reset measure/profile when mode is toggled off
  useEffect(() => {
    if (!settings.showMeasureTool) { setMeasurePts([]); }
  }, [settings.showMeasureTool]);
  useEffect(() => {
    if (!settings.showElevProfile) { setElevPts([]); setElevData([]); }
  }, [settings.showElevProfile]);

  // Fetch NDVI (parks + forests + gardens) from Overpass
  useEffect(() => {
    if (!settings.showNdviLayer || !settings.analysisPoint) { setNdviFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    const r = 0.008; // ~900m
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:12];(node["leisure"~"^(park|garden)$"](${bbox});node["natural"~"^(wood|tree|scrub)$"](${bbox});node["landuse"~"^(forest|grass|meadow|orchard|vineyard)$"](${bbox});way["leisure"="park"](${bbox});way["landuse"~"^(forest|grass)$"](${bbox}););out center 250;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(r => r.json())
      .then(data => {
        const pts = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
        })).filter((f: any) => f.lat && f.lng).slice(0, 250);
        setNdviFeatures(pts);
      })
      .catch(() => {});
  }, [settings.showNdviLayer, settings.analysisPoint]);

  // Fetch buildings from Overpass → compute 5×5 density grid
  useEffect(() => {
    if (!settings.showBuildingDensity || !settings.analysisPoint) { setBuildingGrid([]); return; }
    const { lat, lng } = settings.analysisPoint;
    const r = 0.007;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:12];(way["building"](${bbox});node["building"](${bbox}););out center 400;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        const pts = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
        })).filter((f: any) => f.lat && f.lng);
        // 5×5 grid
        const CELLS = 5;
        const cellSize = (r * 2) / CELLS;
        const grid: { lat: number; lng: number; count: number }[] = [];
        for (let row = 0; row < CELLS; row++) {
          for (let col = 0; col < CELLS; col++) {
            const cLat = (lat - r) + (row + 0.5) * cellSize;
            const cLng = (lng - r) + (col + 0.5) * cellSize;
            const count = pts.filter((p: any) =>
              Math.abs(p.lat - cLat) < cellSize / 2 &&
              Math.abs(p.lng - cLng) < cellSize / 2
            ).length;
            if (count > 0) grid.push({ lat: cLat, lng: cLng, count });
          }
        }
        setBuildingGrid(grid);
      })
      .catch(() => {});
  }, [settings.showBuildingDensity, settings.analysisPoint]);

  // Street tree data fetch — Taipei official blob first, OSM fallback elsewhere
  useEffect(() => {
    if (!settings.showStreetTreeLayer) { setTreeFeatures([]); return; }
    if (!settings.analysisPoint) { setTreeFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;

    const loadOsm = () => {
      const r = 0.006;
      const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
      const q = `[out:json][timeout:15];(node["natural"="tree"](${bbox});node["natural"="tree_row"](${bbox});node["street_tree"="yes"](${bbox});way["natural"="tree_row"](${bbox}););out center 400;`;
      fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
        .then(res => res.json())
        .then(data => {
          if (cancelled) return;
          const trees: TreeFeature[] = (data.elements ?? []).map((el: any) => ({
            lat: (el.lat ?? el.center?.lat) as number,
            lng: (el.lon ?? el.center?.lon) as number,
            species: el.tags?.['species:zh'] ?? el.tags?.species ?? el.tags?.name ?? '樹木',
            src: 'osm' as const,
          })).filter((f: TreeFeature) => f.lat && f.lng).slice(0, 400);
          setTreeFeatures(trees);
        })
        .catch(() => {});
    };

    if (isInTaipeiCity(lat, lng)) {
      if (tpeCacheRef.current) {
        const nearby = tpeCacheRef.current
          .filter(t => haversineM(lat, lng, t.lat, t.lng) < 800)
          .sort((a, b) => haversineM(lat, lng, a.lat, a.lng) - haversineM(lat, lng, b.lat, b.lng))
          .slice(0, 1200);
        setTreeFeatures(nearby);
        return () => { cancelled = true; };
      }
      const ctrl = new AbortController();
      fetch('/tpe-tree/TaipeiTree.json', { signal: ctrl.signal })
        .then(res => res.json())
        .then((data: any[]) => {
          if (cancelled) return;
          const all: TreeFeature[] = data
            .map((item: any) => {
              const { lat: tLat, lng: tLng } = twd97ToWgs84(Number(item.TWD97X), Number(item.TWD97Y));
              return { lat: tLat, lng: tLng, species: item.TreeType ?? '行道樹', src: 'tpe' as const };
            })
            .filter((f: TreeFeature) => f.lat > 24 && f.lat < 26 && f.lng > 120 && f.lng < 122.5);
          tpeCacheRef.current = all;
          const nearby = all
            .filter(t => haversineM(lat, lng, t.lat, t.lng) < 800)
            .sort((a, b) => haversineM(lat, lng, a.lat, a.lng) - haversineM(lat, lng, b.lat, b.lng))
            .slice(0, 1200);
          setTreeFeatures(nearby);
        })
        .catch(() => { if (!cancelled) loadOsm(); });
      return () => { cancelled = true; ctrl.abort(); };
    } else {
      loadOsm();
      return () => { cancelled = true; };
    }
  }, [settings.showStreetTreeLayer, settings.analysisPoint]);

  // Road classification + stress labels
  useEffect(() => {
    if (!settings.showRoadLayer || !settings.analysisPoint) { setRoadFeatures([]); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;
    const r = 0.007;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:15];(way["highway"~"^(trunk|primary|secondary|tertiary|residential|unclassified)$"](${bbox}););out geom 300;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const kindMap: Record<string, RoadKind> = {
          trunk: 'trunk', primary: 'primary', secondary: 'secondary',
          tertiary: 'tertiary', residential: 'residential', unclassified: 'residential',
        };
        const roads: RoadFeature[] = (data.elements ?? [])
          .filter((el: any) => el.type === 'way' && el.geometry?.length >= 2)
          .map((el: any) => ({
            pts: (el.geometry as { lat: number; lon: number }[]).map(g => ({ lat: g.lat, lng: g.lon })),
            kind: kindMap[el.tags?.highway] ?? 'residential',
            name: el.tags?.['name:zh'] ?? el.tags?.name ?? '',
          }));
        setRoadFeatures(roads);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [settings.showRoadLayer, settings.analysisPoint]);

  // POI — schools / parks / markets / medical / bus / public facilities
  useEffect(() => {
    if (!settings.showPoiLayer || !settings.analysisPoint) { setPoiFeatures([]); setPoiStats(null); return; }
    const { lat, lng } = settings.analysisPoint;
    let cancelled = false;
    const r = 0.006;
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`;
    const q = `[out:json][timeout:18];(
      node["amenity"~"^(school|kindergarten|university|college)$"](${bbox});
      way["amenity"~"^(school|kindergarten|university|college)$"](${bbox});
      node["leisure"~"^(park|playground|garden)$"](${bbox});
      way["leisure"~"^(park|playground|garden)$"](${bbox});
      node["amenity"="marketplace"](${bbox});
      node["shop"~"^(supermarket|convenience|market)$"](${bbox});
      node["amenity"~"^(hospital|clinic|pharmacy|dentist)$"](${bbox});
      node["highway"="bus_stop"](${bbox});
      node["amenity"~"^(library|post_office|community_centre|police|fire_station|townhall)$"](${bbox});
      way["amenity"~"^(library|community_centre|police|townhall)$"](${bbox});
    );out center 500;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const catOf = (el: any): PoiCat | null => {
          const a = el.tags?.amenity, l = el.tags?.leisure, s = el.tags?.shop, h = el.tags?.highway;
          if (['school','kindergarten','university','college'].includes(a)) return 'school';
          if (['park','playground','garden'].includes(l)) return 'park';
          if (a === 'marketplace' || ['supermarket','convenience','market'].includes(s)) return 'market';
          if (['hospital','clinic','pharmacy','dentist'].includes(a)) return 'medical';
          if (h === 'bus_stop') return 'bus';
          if (['library','post_office','community_centre','police','fire_station','townhall'].includes(a)) return 'public';
          return null;
        };
        const pois: PoiFeature[] = (data.elements ?? [])
          .map((el: any) => {
            const cat = catOf(el);
            if (!cat) return null;
            const plat = el.lat ?? el.center?.lat;
            const plng = el.lon ?? el.center?.lon;
            if (!plat || !plng) return null;
            return { lat: plat, lng: plng, cat, name: el.tags?.['name:zh'] ?? el.tags?.name ?? '' };
          })
          .filter(Boolean) as PoiFeature[];
        setPoiFeatures(pois);
        // 500m circle stats
        const stats: PoiStats = { school: 0, park: 0, market: 0, medical: 0, bus: 0, public: 0 };
        pois.forEach(p => { if (haversineM(lat, lng, p.lat, p.lng) <= 500) stats[p.cat]++; });
        setPoiStats(stats);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [settings.showPoiLayer, settings.analysisPoint]);

  // Convert Date to JulianDate for Cesium
  const julianDate = JulianDate.fromDate(settings.currentTime);

  // 08G 飲用水保護區 — OSM 水源地 / 水庫 (Cesium Entity，疊在 Google 3D 上)
  const [waterFeatures, setWaterFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);
  useEffect(() => {
    if (!settings.showDrinkingWater) { setWaterFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.6;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["landuse"="reservoir"](${bbox});node["natural"="water"]["name"](${bbox});way["landuse"="reservoir"](${bbox});relation["landuse"="reservoir"](${bbox}););out center 120;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        const features = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '水源地',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08G] OSM water loaded:', features.length);
        setWaterFeatures(features);
      })
      .catch((e) => console.warn('[08G] OSM fetch failed:', e));
  }, [settings.showDrinkingWater, settings.analysisPoint]);

  // 08H 文化資產 — OSM historic 節點 (Cesium Entity，疊在 Google 3D 上)
  const [heritageFeatures, setHeritageFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);
  useEffect(() => {
    if (!settings.showCulturalHeritage) { setHeritageFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.12;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["historic"](${bbox});node["tourism"="museum"](${bbox});node["heritage"](${bbox});way["historic"](${bbox}););out center 200;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        const features = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '文化資產',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08H] OSM heritage loaded:', features.length);
        setHeritageFeatures(features);
      })
      .catch((e) => console.warn('[08H] OSM fetch failed:', e));
  }, [settings.showCulturalHeritage, settings.analysisPoint]);

  // Load the sampler terrain once on mount so we can always know the real ground height
  useEffect(() => {
    createWorldTerrainAsync()
      .then(tp => { terrainSamplerRef.current = tp; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.clock.currentTime = julianDate;
      viewer.shadows = settings.showShadows;
      viewer.terrainShadows = settings.showShadows ? ShadowMode.ENABLED : ShadowMode.DISABLED;
    }
  }, [settings.currentTime, settings.showShadows]);


  // Compute and apply the vertical offset that makes OSM buildings land on the visible ground.
  // OSM Buildings (Ion 96188) use WGS84 ellipsoidal heights — the real terrain height is baked in.
  // • Terrain OFF  → ground is at 0 (EllipsoidTerrainProvider) → shift buildings DOWN by h
  // • Terrain ON   → ground matches the real terrain            → no shift needed
  const applyBuildingOffset = async (showTerrain: boolean, lat: number, lng: number) => {
    const tileset = osmTilesetRef.current;
    if (!tileset) return;

    if (showTerrain) {
      // Terrain surface already matches building base heights — reset any previous offset
      tileset.modelMatrix = Matrix4.IDENTITY.clone();
      return;
    }

    // Terrain is OFF: sample real height via the hidden sampler and shift down
    const sampler = terrainSamplerRef.current;
    if (!sampler) return;
    try {
      const carto = Cartographic.fromDegrees(lng, lat);
      const [sampled] = await sampleTerrainMostDetailed(sampler, [carto]);
      const h = sampled.height ?? 0;
      if (Math.abs(h) < 0.1) return; // already at ellipsoid level
      const surface  = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0.0);
      const shifted  = Cartesian3.fromRadians(carto.longitude, carto.latitude, -h);
      const translation = Cartesian3.subtract(shifted, surface, new Cartesian3());
      tileset.modelMatrix = Matrix4.fromTranslation(translation);
    } catch (e) {
      console.warn('Building offset sampling failed', e);
    }
  };

  useEffect(() => {
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;

    const updateTerrain = async () => {
      if (!viewerRef.current?.cesiumElement) return;
      const viewer = viewerRef.current.cesiumElement;

      if (settings.showTerrain) {
        try {
          viewer.terrainProvider = await createWorldTerrainAsync();
        } catch (e) {
          console.error('無法載入地形', e);
        }
      } else {
        viewer.terrainProvider = new EllipsoidTerrainProvider();
      }
      // Re-apply offset after terrain provider changes
      await applyBuildingOffset(settings.showTerrain, lat, lng);
    };
    updateTerrain();
  }, [settings.showTerrain]);

  // Run once after Viewer mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        // Remove only the auto-added default layer (Bing/ion), keep Resium-managed layers
        // We rely on baseLayer={false} on <Viewer> to prevent default, so this is a safety net
        // only: remove any layer that isn't one we explicitly added via <ImageryLayer>
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.clock.shouldAnimate = false;
        viewer.scene.verticalExaggeration = 1.0;

        // Jump directly to the default base point — skip the default North America view
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(121.5644, 25.0339, 1200),
          orientation: {
            heading: 0.0,
            pitch: -0.4, // ~23° looking down
            roll: 0.0,
          },
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Providers are memoised — never recreated on re-render, so Cesium tile cache stays valid
  // Base theme providers
  const osmOrigProvider = useMemo(() => new OpenStreetMapImageryProvider({
    url: 'https://a.tile.openstreetmap.org/',
  }), []);
  const osmDarkProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    maximumLevel: 19,
    credit: '© CartoDB © OpenStreetMap contributors',
  }), []);
  const osmLightProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    maximumLevel: 19,
    credit: '© CartoDB © OpenStreetMap contributors',
  }), []);
  const osmImageryProvider =
    settings.baseTheme === 'LIGHT' ? osmLightProvider :
    settings.baseTheme === 'DARK'  ? osmDarkProvider  :
    osmOrigProvider;

  const nlscEmapProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: '/nlsc-wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maximumLevel: 19,
    minimumLevel: 1,
    credit: '國土測繪中心 NLSC · 電子地圖',
  }), []);

  const nlscPhotoProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: '/nlsc-wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maximumLevel: 20,
    minimumLevel: 1,
    credit: '國土測繪中心 NLSC · 正射影像',
  }), []);

  // 以下四層改用 WebMapTileServiceImageryProvider（正確的 WMTS KVP 請求格式）
  // Proxy: /nlsc-wmts → https://wmts.nlsc.gov.tw/wmts
  const nlscLandSectProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'LANDSECT',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 19,
    credit: '國土測繪中心 NLSC · 地籍圖 LANDSECT',
  }), []);

  const nlscContourProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'MOI_CONTOUR',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 17,
    credit: '國土測繪中心 NLSC · 等高線 MOI_CONTOUR',
  }), []);

  const nlscHillShadeProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'MOI_HILLSHADE',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 16,
    credit: '國土測繪中心 NLSC · 山體陰影 MOI_HILLSHADE',
  }), []);

  const nlscAdminBoundProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'TOWN',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 15,
    credit: '國土測繪中心 NLSC · 鄉鎮市區界 TOWN',
  }), []);

  // 08A 都市計畫色塊 — NLSC WMS LUIMAP (wms.nlsc.gov.tw)
  // maximumLevel: 縮放超過此層級時 Cesium 改用放大現有 tile，而非請求空白 WMS 回應
  const nlscUrbanPlanProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/nlsc-wms',
    layers: 'LUIMAP',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 9,
    maximumLevel: 14,   // 14 已足夠辨識分區色塊，避免 zoom 15-16 的大量 tile 請求
    tileWidth: 512,     // 512px tile = 4× 減少 HTTP 請求數
    tileHeight: 512,
    credit: '內政部 NLSC · 都市計畫分區 LUIMAP',
  }), []);

  // 08B 地盤液化潛勢 — 地質調查及礦業管理中心 CGS WMS (geomap.gsmma.gov.tw)
  const cgsLiquefactionProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_Soil_liquefatcion_2021',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 土壤液化潛勢 2021',
  }), []);

  // 08D 活動斷層地質敏感區 — CGS WMS
  const cgsFaultProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_fault',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（活動斷層）',
  }), []);

  // 08E 淹水潛勢 — 水利署 WRA ArcGIS WMS (maps.wra.gov.tw) layer 0 = 114年裸地淹水潛勢
  const wraFloodProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/wra-wms/arcgis/services/WMS/GIC_WMS/MapServer/WMSServer',
    layers: '0,1',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '水利署 WRA · 淹水潛勢圖 114年',
  }), []);

  // 08C 土石流/崩塌地 — CGS WMS DebrisSlide 2013（公開 WMS 最接近資料）
  const cgsDebrisProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_DebrisSlide_2013',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 崩塌地 DebrisSlide 2013',
  }), []);

  // 08F 山崩/地滑地質敏感區 — CGS WMS
  const cgsSlopeProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_landslide',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（山崩與地滑）',
  }), []);

  const handleTilesetReady = async (tileset: any) => {
    osmTilesetRef.current = tileset;
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;
    await applyBuildingOffset(settings.showTerrain, lat, lng);
  };

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
          // Sample 10 intermediate + 2 endpoints = 12 total
          const SAMPLES = 12;
          const locations = Array.from({ length: SAMPLES }, (_, i) => ({
            latitude: next[0].lat + (next[1].lat - next[0].lat) * (i / (SAMPLES - 1)),
            longitude: next[0].lng + (next[1].lng - next[0].lng) * (i / (SAMPLES - 1)),
          }));
          setElevLoading(true);
          fetch('/open-elevation/api/v1/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locations }),
          })
            .then(r => r.json())
            .then(json => {
              const results: { d: number; e: number }[] = json.results.map((r: any, i: number) => ({
                d: haversineM(next[0].lat, next[0].lng, locations[i].latitude, locations[i].longitude),
                e: r.elevation as number,
              }));
              setElevData(results);
            })
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

  // Calculate Solar Azimuth Line positions
  const getSolarLinePositions = (distance = 400) => {
    if (!settings.analysisPoint) return [];
    const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
    
    // Convert to ground projection (Azimuth only)
    const azimuthRad = (90 - sunPos.azimuth) * (Math.PI / 180);
    const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2);
    const latOffset = (distance / 111320) * Math.sin(azimuthRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 2);
    
    return [start, end];
  };

  /**
   * Helper to get 3D Cartesian from Topocentric (Azimuth/Altitude)
   */
  const getSunCartesian = (lat: number, lng: number, azimuth: number, altitude: number, distance: number) => {
    const azimuthRad = (90 - azimuth) * (Math.PI / 180);
    const altRad = altitude * (Math.PI / 180);
    
    const hDist = distance * Math.cos(altRad);
    const vDist = distance * Math.sin(altRad);
    
    const latOffset = (hDist / 111320) * Math.sin(azimuthRad);
    const lngOffset = (hDist / (111320 * Math.cos(lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    
    return Cartesian3.fromDegrees(lng + lngOffset, lat + latOffset, vDist + 10);
  };

  const getSunActualPos = () => {
    if (!settings.analysisPoint) return undefined;
    const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
    return getSunCartesian(settings.analysisPoint.lat, settings.analysisPoint.lng, sunPos.azimuth, sunPos.altitude, 400);
  };

  const solarPathPoints = settings.analysisPoint ? GISService.getSolarPath(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime) : [];
  
  const solarPathPositions = solarPathPoints.map(p => 
    getSunCartesian(settings.analysisPoint!.lat, settings.analysisPoint!.lng, p.azimuth, p.altitude, 400)
  );

  const getCompassPosition = (azimuth: number, distance = 400) => {
    if (!settings.analysisPoint) return Cartesian3.ZERO;
    const azimuthRad = (90 - azimuth) * (Math.PI / 180);
    const latOffset = (distance / 111320) * Math.sin(azimuthRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    return Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
  };

  useEffect(() => {
    if (viewerRef.current?.cesiumElement && settings.selectedBase) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          settings.selectedBase.lng,
          settings.selectedBase.lat,
          viewer.camera.positionCartographic.height || 1000
        ),
        duration: 2
      });
    }
  }, [settings.selectedBase?.lat, settings.selectedBase?.lng]);

  const getZoningColor = (cat: string) => {
    switch(cat) {
      case '高熱曝曬區': return Color.ORANGERED;
      case '陰影區': return Color.NAVY;
      case '乾陰區': return Color.BROWN;
      case '潮濕積水區': return Color.AQUA;
      case '強風區': return Color.GHOSTWHITE;
      case '都市熱島區': return Color.CRIMSON;
      default: return Color.LIME;
    }
  };

  const zoningGrid = settings.analysisPoint ? Array.from({ length: 9 }).map((_, i) => {
    const r = Math.floor(i / 3) - 1;
    const c = (i % 3) - 1;
    const lat = settings.analysisPoint!.lat + r * 0.0008;
    const lng = settings.analysisPoint!.lng + c * 0.0008;
    const seed = lat + lng;
    const pseudoRand = (offset: number) => Math.abs(Math.sin(seed + offset));
    
    // Pseudo-zoning for grid visualization
    const cats = ['高熱曝曬區', '半日照區', '陰影區', '強風區', '都市熱島區', '潮濕積水區', '乾陰區'];
    const cat = cats[Math.floor(pseudoRand(10) * cats.length)];
    
    return { lat, lng, cat };
  }) : [];

  const getFlowArrowPositions = (distance = 150) => {
    if (!settings.analysisPoint) return [];
    // Pseudo flow based on point
    const angle = (settings.analysisPoint.lat + settings.analysisPoint.lng) * 1000 % 360;
    const angleRad = (90 - angle) * (Math.PI / 180);
    const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5);
    const latOffset = (distance / 111320) * Math.sin(angleRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(angleRad);
    const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
    return [start, end];
  };

  return (
    <div className="w-full h-full relative">
      <Viewer
        ref={viewerRef}
        full
        className="h-full"
        infoBox={false}
        selectionIndicator={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        shadows={settings.showShadows}
        baseLayer={false as any}
      >
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent action={handleLeftClick} type={ScreenSpaceEventType.LEFT_CLICK} />
          <ScreenSpaceEvent action={() => { if (settings.showMeasureTool) setMeasurePts([]); }} type={ScreenSpaceEventType.RIGHT_CLICK} />
        </ScreenSpaceEventHandler>

        {/* OSM 2D Imagery */}
        {settings.showOsmImagery && (
          <ImageryLayer imageryProvider={osmImageryProvider} />
        )}

        {/* NLSC 國土測繪電子地圖 (wmts.nlsc.gov.tw · EMAP) */}
        {settings.showNlscEmap && (
          <ImageryLayer imageryProvider={nlscEmapProvider} />
        )}

        {/* NLSC 國土測繪正射影像 (wmts.nlsc.gov.tw · PHOTO2) */}
        {settings.showNlscPhoto && (
          <ImageryLayer imageryProvider={nlscPhotoProvider} />
        )}

        {/* 08A · 都市計畫色塊 (NLSC LUIMAP) */}
        {settings.showUrbanPlan && (
          <ImageryLayer imageryProvider={nlscUrbanPlanProvider} alpha={0.65} />
        )}
        {/* 08B · 地盤液化潛勢 (CGS 2021) */}
        {settings.showLiquefaction && (
          <ImageryLayer imageryProvider={cgsLiquefactionProvider} alpha={0.70} />
        )}
        {/* 08C · 崩塌地/土石流相關 (CGS DebrisSlide 2013) */}
        {settings.showDebrisFlow && (
          <ImageryLayer imageryProvider={cgsDebrisProvider} alpha={0.72} />
        )}
        {/* 08D · 活動斷層地質敏感區 (CGS) */}
        {settings.showActiveFault && (
          <ImageryLayer imageryProvider={cgsFaultProvider} alpha={0.75} />
        )}
        {/* 08E · 淹水潛勢 (WRA 114年) */}
        {settings.showFloodPotential && (
          <ImageryLayer imageryProvider={wraFloodProvider} alpha={0.65} />
        )}
        {/* 08F · 山崩/地滑地質敏感區 (CGS) */}
        {settings.showSlopeSensitive && (
          <ImageryLayer imageryProvider={cgsSlopeProvider} alpha={0.70} />
        )}

        {/* 08G · 飲用水保護區 — OSM 水庫/水源地 (disableDepthTest → 永遠可見) */}
        {settings.showDrinkingWater && waterFeatures.map((f, i) => (
          <Entity key={`dw-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 300)} name={`💧 ${f.name}`}>
            <PointGraphics
              pixelSize={16}
              color={Color.fromCssColorString('#00BCD4').withAlpha(0.9)}
              outlineColor={Color.WHITE}
              outlineWidth={2}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        ))}

        {/* 08H · 文化資產 — OSM historic 節點 (disableDepthTest → 永遠可見) */}
        {settings.showCulturalHeritage && heritageFeatures.map((f, i) => (
          <Entity key={`ch-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 300)} name={`🏛 ${f.name}`}>
            <PointGraphics
              pixelSize={13}
              color={Color.fromCssColorString('#9C27B0').withAlpha(0.95)}
              outlineColor={Color.fromCssColorString('#E1BEE7')}
              outlineWidth={2}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        ))}

        {/* 地籍圖 LANDSECT */}
        {settings.showNlscLandSect && (
          <ImageryLayer imageryProvider={nlscLandSectProvider} alpha={0.85} />
        )}
        {/* 等高線 MOI_CONTOUR */}
        {settings.showNlscContour && (
          <ImageryLayer imageryProvider={nlscContourProvider} alpha={0.75} />
        )}
        {/* 山體陰影 MOI_HILLSHADE */}
        {settings.showNlscHillShade && (
          <ImageryLayer imageryProvider={nlscHillShadeProvider} alpha={0.55} />
        )}
        {/* 行政區界 TOWN */}
        {settings.showNlscAdminBound && (
          <ImageryLayer imageryProvider={nlscAdminBoundProvider} alpha={0.80} />
        )}

        {/* OSM 3D Buildings — offset applied via sampleTerrainMostDetailed when terrain is on */}
        {settings.showOsmBuildings && (
          <Cesium3DTileset
            url={IonResource.fromAssetId(96188)}
            onReady={handleTilesetReady}
            style={new Cesium3DTileStyle({
              color: `color('hsl(${settings.osmBuildingHue},45%,62%)', ${settings.osmBuildingOpacity})`,
            })}
          />
        )}

        {/* Selected Base Indicator */}
        {settings.selectedBase && (
          <Entity
            position={Cartesian3.fromDegrees(settings.selectedBase.lng, settings.selectedBase.lat)}
            name={settings.selectedBase.name}
          >
            <PointGraphics pixelSize={10} color={Color.fromCssColorString('#3498DB')} outlineColor={Color.WHITE} outlineWidth={2} />
          </Entity>
        )}

        {/* Google Photorealistic 3D Tiles */}
        {settings.showGoogle3DTiles && (
          <Cesium3DTileset url={IonResource.fromAssetId(2275207)} shadows={settings.showShadows ? ShadowMode.ENABLED : ShadowMode.DISABLED} />
        )}

        {/* Analysis Visualizations */}
        {settings.analysisPoint && (
          <>
            {/* Compass Ring and Labels — each label needs its own Entity */}
            {(['N', 'S', 'E', 'W'] as const).map((dir, i) => (
              <Entity key={dir} position={getCompassPosition([0, 180, 90, 270][i], 420)}>
                <LabelGraphics
                  text={dir}
                  font="bold 20px sans-serif"
                  fillColor={Color.WHITE}
                  outlineColor={Color.fromBytes(0, 0, 0, 230)}
                  outlineWidth={4}
                  style={LabelStyle.FILL_AND_OUTLINE}
                  verticalOrigin={VerticalOrigin.CENTER}
                  showBackground={true}
                  backgroundColor={Color.BLACK.withAlpha(0.55)}
                  backgroundPadding={new Cartesian2(7, 4)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            ))}
            {/* Main Compass Circle */}
            <Entity>
              <PolylineGraphics
                positions={Array.from({ length: 37 }).map((_, i) => getCompassPosition(i * 10, 400))}
                width={1.5}
                material={Color.WHITE.withAlpha(0.3)}
              />
            </Entity>

            {/* Point of interest */}
            <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
              <PointGraphics pixelSize={14} color={Color.YELLOW} outlineColor={Color.BLACK} outlineWidth={2.5} />
              <LabelGraphics
                text="📍 基地位置"
                font="bold 16px sans-serif"
                fillColor={Color.fromCssColorString('#FFEE58')}
                outlineColor={Color.fromBytes(0, 0, 0, 240)}
                outlineWidth={4}
                style={LabelStyle.FILL_AND_OUTLINE}
                pixelOffset={new Cartesian2(0, -30)}
                showBackground={true}
                backgroundColor={Color.BLACK.withAlpha(0.7)}
                backgroundPadding={new Cartesian2(9, 5)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
              />
            </Entity>
            
            {/* Solar Path Arc */}
            {settings.showShadows && (
              <>
                {/* Arc path — must be separate entities: Cesium Entity only allows ONE PolylineGraphics per entity */}
                <Entity>
                  <PolylineGraphics
                    positions={solarPathPositions}
                    width={2}
                    material={Color.ORANGE.withAlpha(0.7)}
                  />
                </Entity>
                {/* Azimuth ground-projection line */}
                <Entity>
                  <PolylineGraphics
                    positions={getSolarLinePositions(400)}
                    width={3}
                    material={Color.ORANGE.withAlpha(0.5)}
                  />
                </Entity>

                {/* Hour Markers along path */}
                {solarPathPoints.map((p, i) => (
                  <Entity key={`marker-${i}`} position={solarPathPositions[i]}>
                    <PointGraphics pixelSize={7} color={Color.ORANGE} outlineColor={Color.BLACK} outlineWidth={1.5} />
                    <LabelGraphics
                      text={p.hourLabel}
                      font="bold 14px sans-serif"
                      fillColor={Color.fromCssColorString('#FFB300')}
                      outlineColor={Color.fromBytes(0, 0, 0, 220)}
                      outlineWidth={3}
                      style={LabelStyle.FILL_AND_OUTLINE}
                      pixelOffset={new Cartesian2(0, -18)}
                      showBackground={true}
                      backgroundColor={Color.BLACK.withAlpha(0.6)}
                      backgroundPadding={new Cartesian2(6, 3)}
                      disableDepthTestDistance={Number.POSITIVE_INFINITY}
                    />
                  </Entity>
                ))}

                {/* Actual Sun position in 3D */}
                <Entity position={getSunActualPos()}>
                   <PointGraphics pixelSize={24} color={Color.YELLOW} outlineColor={Color.ORANGE} outlineWidth={3} />
                   <PolylineGraphics
                    positions={[Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2), getSunActualPos() as Cartesian3]}
                    width={2}
                    material={Color.YELLOW.withAlpha(0.4)}
                  />
                   <LabelGraphics
                    text={`☀ 方位角 ${GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime).azimuth.toFixed(1)}°`}
                    font="bold 15px sans-serif"
                    fillColor={Color.fromCssColorString('#FFE57F')}
                    outlineColor={Color.fromBytes(0, 0, 0, 240)}
                    outlineWidth={4}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    verticalOrigin={VerticalOrigin.BOTTOM}
                    pixelOffset={new Cartesian2(0, -30)}
                    showBackground={true}
                    backgroundColor={Color.fromBytes(40, 30, 0, 185)}
                    backgroundPadding={new Cartesian2(10, 5)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                </Entity>
              </>
            )}

            {/* Landscape Decision Layers */}
            {settings.showZoning && zoningGrid.map((z, i) => (
              <Entity key={`zone-${i}`} position={Cartesian3.fromDegrees(z.lng, z.lat, 10)}>
                <BillboardGraphics 
                  image={`https://api.iconify.design/material-symbols:square-rounded.svg?color=${getZoningColor(z.cat).toCssColorString().replace('#', '%23')}`}
                  width={64}
                  height={64}
                  scale={0.5}
                  color={getZoningColor(z.cat).withAlpha(0.4)}
                />
                <LabelGraphics
                  text={z.cat}
                  font="bold 14px sans-serif"
                  fillColor={getZoningColor(z.cat)}
                  outlineColor={Color.fromBytes(0, 0, 0, 230)}
                  outlineWidth={3}
                  style={LabelStyle.FILL_AND_OUTLINE}
                  pixelOffset={new Cartesian2(0, 24)}
                  showBackground={true}
                  backgroundColor={Color.BLACK.withAlpha(0.65)}
                  backgroundPadding={new Cartesian2(8, 4)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            ))}

            {settings.showUrbanStress && landscapeData && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 20)}>
                 <LabelGraphics
                    text={[
                      `🌡 表面溫度: ${landscapeData.urbanStress.surfaceTemp.toFixed(1)} °C`,
                      `☀ 熱指數: ${(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)}%  Albedo: ${landscapeData.urbanStress.albedo.toFixed(2)}`,
                      landscapeData.urbanStress.canyonEffect  ? '⚠ 街谷風效應明顯' : '✓ 街道風場正常',
                      landscapeData.urbanStress.downdraftRisk ? '⚠ 高壓風切 Downdraft 風險' : '✓ 垂直風量穩定',
                    ].join('\n')}
                    font="bold 13px sans-serif"
                    fillColor={landscapeData.urbanStress.surfaceTemp > 38
                      ? Color.fromCssColorString('#FF7043')
                      : Color.fromCssColorString('#FFD54F')}
                    outlineColor={Color.fromBytes(0, 0, 0, 240)}
                    outlineWidth={4}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    pixelOffset={new Cartesian2(60, 0)}
                    horizontalOrigin={HorizontalOrigin.LEFT}
                    showBackground={true}
                    backgroundColor={Color.fromBytes(20, 10, 0, 200)}
                    backgroundPadding={new Cartesian2(10, 6)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                 />
                 <PointGraphics
                    pixelSize={100}
                    color={(landscapeData.urbanStress.surfaceTemp > 38 ? Color.RED : Color.ORANGE).withAlpha(0.18)}
                 />
              </Entity>
            )}

            {settings.showHydrology && (
              <>
                <Entity>
                  <PolylineGraphics
                    positions={getFlowArrowPositions(200)}
                    width={5}
                    material={Color.AQUA.withAlpha(0.6)}
                  />
                </Entity>
                <Entity position={getFlowArrowPositions(220)[1]}>
                  <LabelGraphics
                    text="→ 地表逕流向"
                    font="bold 15px sans-serif"
                    fillColor={Color.fromCssColorString('#00E5FF')}
                    outlineColor={Color.fromBytes(0, 20, 30, 230)}
                    outlineWidth={3}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    showBackground={true}
                    backgroundColor={Color.fromBytes(0, 20, 30, 180)}
                    backgroundPadding={new Cartesian2(9, 5)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                </Entity>
              </>
            )}

            {settings.showSoilAnalysis && landscapeData && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
                 <LabelGraphics
                    text={`💧 滲透率: ${landscapeData.soil.infiltrationRate.toFixed(1)} mm/hr  排水: ${landscapeData.soil.drainageSpeed}  積水風險: ${landscapeData.soil.waterloggingRisk}`}
                    font="bold 13px sans-serif"
                    fillColor={landscapeData.soil.waterloggingRisk === '高'
                      ? Color.fromCssColorString('#EF9A9A')
                      : Color.fromCssColorString('#80DEEA')}
                    outlineColor={Color.fromBytes(0, 0, 0, 230)}
                    outlineWidth={3}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    pixelOffset={new Cartesian2(-110, 55)}
                    showBackground={true}
                    backgroundColor={Color.BLACK.withAlpha(0.7)}
                    backgroundPadding={new Cartesian2(9, 5)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                 />
              </Entity>
            )}

            {/* ── Buffer 半徑圈 ── */}
            {settings.bufferRadius > 0 && ([100, 300, 500, 800] as const)
              .filter(r => r <= settings.bufferRadius)
              .map(r => (
                <Entity key={`buf-${r}`} position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat, 1)}>
                  <EllipseGraphics
                    semiMajorAxis={r}
                    semiMinorAxis={r}
                    material={Color.fromCssColorString('#00BCD4').withAlpha(0.06)}
                    outline={true}
                    outlineColor={Color.fromCssColorString('#00BCD4').withAlpha(0.55)}
                    outlineWidth={1.5}
                    heightReference={1 /* CLAMP_TO_GROUND */}
                  />
                </Entity>
              ))
            }
            {/* Buffer ring labels */}
            {settings.bufferRadius > 0 && ([100, 300, 500, 800] as const)
              .filter(r => r <= settings.bufferRadius)
              .map(r => {
                const offsetLng = settings.analysisPoint!.lng + r / (111320 * Math.cos(settings.analysisPoint!.lat * Math.PI / 180));
                return (
                  <Entity key={`buf-lbl-${r}`} position={Cartesian3.fromDegrees(offsetLng, settings.analysisPoint!.lat, 8)}>
                    <LabelGraphics
                      text={`${r}m`}
                      font="bold 11px monospace"
                      fillColor={Color.fromCssColorString('#00BCD4')}
                      outlineColor={Color.fromBytes(0, 0, 0, 200)}
                      outlineWidth={3}
                      style={LabelStyle.FILL_AND_OUTLINE}
                      showBackground={true}
                      backgroundColor={Color.fromBytes(0, 20, 25, 170)}
                      backgroundPadding={new Cartesian2(5, 3)}
                      disableDepthTestDistance={Number.POSITIVE_INFINITY}
                    />
                  </Entity>
                );
              })
            }

            {/* ── 距離量測（連續折線）── */}
            {settings.showMeasureTool && measurePts.length >= 1 && (() => {
              const segDists = measurePts.slice(1).map((p, i) =>
                haversineM(measurePts[i].lat, measurePts[i].lng, p.lat, p.lng));
              const totalDist = segDists.reduce((s, d) => s + d, 0);
              return (
                <>
                  {measurePts.map((p, i) => (
                    <Entity key={`mp-${i}`} position={Cartesian3.fromDegrees(p.lng, p.lat, 6)}>
                      <PointGraphics
                        pixelSize={i === 0 ? 12 : 10}
                        color={Color.fromCssColorString(i === 0 ? '#FF6B35' : '#00BCD4')}
                        outlineColor={Color.WHITE} outlineWidth={2}
                        disableDepthTestDistance={Number.POSITIVE_INFINITY}
                      />
                    </Entity>
                  ))}
                  {measurePts.length >= 2 && (
                    <Entity>
                      <PolylineGraphics
                        positions={measurePts.map(p => Cartesian3.fromDegrees(p.lng, p.lat, 4))}
                        width={2.5}
                        material={Color.fromCssColorString('#00BCD4').withAlpha(0.85)}
                      />
                    </Entity>
                  )}
                  {measurePts.slice(1).map((p, i) => (
                    <Entity key={`msl-${i}`} position={Cartesian3.fromDegrees(
                      (measurePts[i].lng + p.lng) / 2,
                      (measurePts[i].lat + p.lat) / 2, 10
                    )}>
                      <LabelGraphics
                        text={fmtDist(segDists[i])}
                        font="11px monospace"
                        fillColor={Color.fromCssColorString('#B2EBF2')}
                        outlineColor={Color.fromBytes(0, 0, 0, 220)}
                        outlineWidth={3}
                        style={LabelStyle.FILL_AND_OUTLINE}
                        showBackground={true}
                        backgroundColor={Color.fromBytes(0, 30, 40, 190)}
                        backgroundPadding={new Cartesian2(5, 3)}
                        disableDepthTestDistance={Number.POSITIVE_INFINITY}
                      />
                    </Entity>
                  ))}
                  {measurePts.length >= 2 && (
                    <Entity position={Cartesian3.fromDegrees(
                      measurePts[measurePts.length - 1].lng,
                      measurePts[measurePts.length - 1].lat, 14
                    )}>
                      <LabelGraphics
                        text={`📏 ${fmtDist(totalDist)}`}
                        font="bold 14px monospace"
                        fillColor={Color.fromCssColorString('#00E5FF')}
                        outlineColor={Color.fromBytes(0, 0, 0, 240)}
                        outlineWidth={4}
                        style={LabelStyle.FILL_AND_OUTLINE}
                        showBackground={true}
                        backgroundColor={Color.fromBytes(0, 20, 30, 210)}
                        backgroundPadding={new Cartesian2(10, 5)}
                        disableDepthTestDistance={Number.POSITIVE_INFINITY}
                        pixelOffset={new Cartesian2(0, -22) as any}
                      />
                    </Entity>
                  )}
                </>
              );
            })()}

            {/* ── 高程剖面端點 ── */}
            {settings.showElevProfile && elevPts.map((p, i) => (
              <Entity key={`ep-${i}`} position={Cartesian3.fromDegrees(p.lng, p.lat, 6)}>
                <PointGraphics pixelSize={10} color={Color.fromCssColorString('#8BC34A')} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
                <LabelGraphics
                  text={i === 0 ? 'A' : 'B'}
                  font="bold 13px sans-serif"
                  fillColor={Color.fromCssColorString('#CDDC39')}
                  outlineColor={Color.fromBytes(0, 0, 0, 220)}
                  outlineWidth={3}
                  style={LabelStyle.FILL_AND_OUTLINE}
                  pixelOffset={new Cartesian2(0, -20)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            ))}
            {settings.showElevProfile && elevPts.length === 2 && (
              <Entity>
                <PolylineGraphics
                  positions={[
                    Cartesian3.fromDegrees(elevPts[0].lng, elevPts[0].lat, 4),
                    Cartesian3.fromDegrees(elevPts[1].lng, elevPts[1].lat, 4),
                  ]}
                  width={2}
                  material={Color.fromCssColorString('#8BC34A').withAlpha(0.7)}
                />
              </Entity>
            )}

            {/* ── 不透水面概略 (熱指數計算圈) ── */}
            {settings.showImperviousLayer && landscapeData && (
              <>
                {[0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                  const hi = landscapeData.urbanStress.surfaceHeatIndex;
                  const radius = 60 + hi * 350 * frac;
                  const alpha = hi * 0.22 * (1.2 - frac);
                  const r = Math.round(255 * Math.min(hi * 1.4, 1));
                  const g = Math.round(80 * (1 - hi));
                  return (
                    <Entity key={`imp-${i}`} position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat, 2)}>
                      <EllipseGraphics
                        semiMajorAxis={radius}
                        semiMinorAxis={radius}
                        material={Color.fromBytes(r, g, 30, Math.round(alpha * 255))}
                        heightReference={1}
                      />
                    </Entity>
                  );
                })}
                <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat + 0.004, 10)}>
                  <LabelGraphics
                    text={`不透水面 ≈ ${(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)}%`}
                    font="bold 12px sans-serif"
                    fillColor={Color.fromCssColorString('#FF7043')}
                    outlineColor={Color.fromBytes(0, 0, 0, 220)}
                    outlineWidth={3}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    showBackground={true}
                    backgroundColor={Color.fromBytes(25, 10, 5, 185)}
                    backgroundPadding={new Cartesian2(8, 4)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                </Entity>
              </>
            )}

            {/* ── 綠覆 NDVI 概略 (OSM 綠地節點) ── */}
            {settings.showNdviLayer && ndviFeatures.map((f, i) => (
              <Entity key={`ndvi-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 4)}>
                <PointGraphics
                  pixelSize={6}
                  color={Color.fromCssColorString('#4CAF50').withAlpha(0.7)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            ))}
            {settings.showNdviLayer && ndviFeatures.length > 0 && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat - 0.004, 10)}>
                <LabelGraphics
                  text={`🌿 綠覆節點 ${ndviFeatures.length} 處 (半徑 ~900m)`}
                  font="bold 12px sans-serif"
                  fillColor={Color.fromCssColorString('#66BB6A')}
                  outlineColor={Color.fromBytes(0, 0, 0, 220)}
                  outlineWidth={3}
                  style={LabelStyle.FILL_AND_OUTLINE}
                  showBackground={true}
                  backgroundColor={Color.fromBytes(5, 20, 5, 185)}
                  backgroundPadding={new Cartesian2(8, 4)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            )}

            {/* ── 建物密度熱區 (5×5 格網) ── */}
            {settings.showBuildingDensity && buildingGrid.map((cell, i) => {
              const maxCount = Math.max(...buildingGrid.map(c => c.count), 1);
              const ratio = cell.count / maxCount;
              const radius = 40 + ratio * 120;
              const alpha = 0.12 + ratio * 0.28;
              return (
                <Entity key={`bd-${i}`} position={Cartesian3.fromDegrees(cell.lng, cell.lat, 2)}>
                  <EllipseGraphics
                    semiMajorAxis={radius}
                    semiMinorAxis={radius}
                    material={Color.fromBytes(255, Math.round(152 * (1 - ratio)), 0, Math.round(alpha * 255))}
                    heightReference={1}
                  />
                </Entity>
              );
            })}
            {settings.showBuildingDensity && buildingGrid.length > 0 && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat + 0.005, 10)}>
                <LabelGraphics
                  text={`🏙 建物密度 · ${buildingGrid.reduce((s, c) => s + c.count, 0)} 棟 (格網)`}
                  font="bold 12px sans-serif"
                  fillColor={Color.fromCssColorString('#FF9800')}
                  outlineColor={Color.fromBytes(0, 0, 0, 220)}
                  outlineWidth={3}
                  style={LabelStyle.FILL_AND_OUTLINE}
                  showBackground={true}
                  backgroundColor={Color.fromBytes(25, 15, 0, 185)}
                  backgroundPadding={new Cartesian2(8, 4)}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            )}

            {/* ── 行道樹 (台北市官方 blob / OSM fallback) ── */}
            {settings.showStreetTreeLayer && treeFeatures.map((t, i) => (
              <Entity key={`tree-${i}`} position={Cartesian3.fromDegrees(t.lng, t.lat, 4)}>
                <PointGraphics
                  pixelSize={t.src === 'tpe' ? 6 : 5}
                  color={Color.fromCssColorString(t.src === 'tpe' ? '#B5D867' : '#69F0AE').withAlpha(0.82)}
                  outlineColor={Color.fromCssColorString('#1B5E20').withAlpha(0.6)}
                  outlineWidth={1}
                  disableDepthTestDistance={Number.POSITIVE_INFINITY}
                />
              </Entity>
            ))}
            {/* ── 道路分級 ── */}
            {settings.showRoadLayer && roadFeatures.map((road, i) => {
              const roadColor: Record<RoadKind, string> = {
                trunk: '#E53935', primary: '#FF7043', secondary: '#FFA726',
                tertiary: '#FFD54F', residential: '#78909C',
              };
              const roadWidth: Record<RoadKind, number> = {
                trunk: 5, primary: 4, secondary: 3, tertiary: 2, residential: 1.5,
              };
              const positions = road.pts.map(p => Cartesian3.fromDegrees(p.lng, p.lat, 2));
              return (
                <Entity key={`road-${i}`}>
                  <PolylineGraphics
                    positions={positions}
                    width={roadWidth[road.kind]}
                    material={Color.fromCssColorString(roadColor[road.kind]).withAlpha(0.75)}
                    clampToGround
                    arcType={0}
                  />
                </Entity>
              );
            })}
            {/* 道路名稱 + 壓力標籤（primary 以上才顯示） */}
            {settings.showRoadLayer && roadFeatures
              .filter(r => (r.kind === 'primary' || r.kind === 'trunk' || r.kind === 'secondary') && r.name)
              .filter((_, i) => i < 20)
              .map((road, i) => {
                const mid = road.pts[Math.floor(road.pts.length / 2)];
                const stressLabel: Record<RoadKind, string> = {
                  trunk: '快速道路 ⬛高流量', primary: '主幹道 🔴高流量',
                  secondary: '次幹道 🟡中流量', tertiary: '地方道 🟢低流量', residential: '住宅路',
                };
                return (
                  <Entity key={`rlabel-${i}`} position={Cartesian3.fromDegrees(mid.lng, mid.lat, 8)}>
                    <LabelGraphics
                      text={`${road.name}  ${stressLabel[road.kind]}`}
                      font="10px sans-serif"
                      fillColor={Color.fromCssColorString('#FFFDE7')}
                      outlineColor={Color.fromBytes(0, 0, 0, 200)}
                      outlineWidth={2}
                      style={LabelStyle.FILL_AND_OUTLINE}
                      showBackground
                      backgroundColor={Color.fromBytes(20, 20, 20, 160)}
                      backgroundPadding={new Cartesian2(5, 3)}
                      disableDepthTestDistance={Number.POSITIVE_INFINITY}
                      distanceDisplayCondition={{ near: 0, far: 800 } as any}
                    />
                  </Entity>
                );
              })}

            {/* ── 生活機能 POI ── */}
            {settings.showPoiLayer && poiFeatures.map((poi, i) => {
              const catColor: Record<PoiCat, string> = {
                school: '#4FC3F7', park: '#81C784', market: '#FFB74D',
                medical: '#F48FB1', bus: '#CE93D8', public: '#80CBC4',
              };
              const catEmoji: Record<PoiCat, string> = {
                school: '🎓', park: '🌿', market: '🛒',
                medical: '🏥', bus: '🚌', public: '🏛',
              };
              const within500 = haversineM(settings.analysisPoint!.lat, settings.analysisPoint!.lng, poi.lat, poi.lng) <= 500;
              return (
                <Entity key={`poi-${i}`} position={Cartesian3.fromDegrees(poi.lng, poi.lat, 5)}>
                  <PointGraphics
                    pixelSize={within500 ? 8 : 5}
                    color={Color.fromCssColorString(catColor[poi.cat]).withAlpha(within500 ? 0.9 : 0.5)}
                    outlineColor={Color.fromBytes(0, 0, 0, 160)}
                    outlineWidth={1}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                  {poi.name && within500 && (
                    <LabelGraphics
                      text={`${catEmoji[poi.cat]} ${poi.name}`}
                      font="10px sans-serif"
                      fillColor={Color.fromCssColorString(catColor[poi.cat])}
                      outlineColor={Color.fromBytes(0, 0, 0, 220)}
                      outlineWidth={2}
                      style={LabelStyle.FILL_AND_OUTLINE}
                      showBackground
                      backgroundColor={Color.fromBytes(10, 10, 20, 180)}
                      backgroundPadding={new Cartesian2(5, 3)}
                      pixelOffset={new Cartesian2(0, -14)}
                      disableDepthTestDistance={Number.POSITIVE_INFINITY}
                      distanceDisplayCondition={{ near: 0, far: 600 } as any}
                    />
                  )}
                </Entity>
              );
            })}
            {/* 500m 生活圈統計標籤 */}
            {settings.showPoiLayer && poiStats && (() => {
              const catEmoji: Record<PoiCat, string> = {
                school: '🎓', park: '🌿', market: '🛒',
                medical: '🏥', bus: '🚌', public: '🏛',
              };
              const lines = (Object.keys(poiStats) as PoiCat[])
                .filter(k => poiStats[k] > 0)
                .map(k => `${catEmoji[k]}${poiStats[k]}`)
                .join('  ');
              return (
                <Entity position={Cartesian3.fromDegrees(
                  settings.analysisPoint!.lng,
                  settings.analysisPoint!.lat + 0.006, 10
                )}>
                  <LabelGraphics
                    text={`500m 生活圈  ${lines || '設施稀少'}`}
                    font="bold 11px sans-serif"
                    fillColor={Color.fromCssColorString('#E0F7FA')}
                    outlineColor={Color.fromBytes(0, 0, 0, 220)}
                    outlineWidth={3}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    showBackground
                    backgroundColor={Color.fromBytes(0, 40, 55, 200)}
                    backgroundPadding={new Cartesian2(10, 5)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                </Entity>
              );
            })()}

            {settings.showStreetTreeLayer && treeFeatures.length > 0 && (() => {
              const tpeCount = treeFeatures.filter(t => t.src === 'tpe').length;
              const srcLabel = tpeCount > 0 ? '台北市官方' : 'OSM';
              return (
                <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat - 0.005, 10)}>
                  <LabelGraphics
                    text={`🌳 ${treeFeatures.length} 棵 (${srcLabel})`}
                    font="bold 12px sans-serif"
                    fillColor={Color.fromCssColorString('#B5D867')}
                    outlineColor={Color.fromBytes(0, 0, 0, 220)}
                    outlineWidth={3}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    showBackground={true}
                    backgroundColor={Color.fromBytes(10, 30, 5, 185)}
                    backgroundPadding={new Cartesian2(8, 4)}
                    disableDepthTestDistance={Number.POSITIVE_INFINITY}
                  />
                </Entity>
              );
            })()}
          </>
        )}
      </Viewer>

      {/* Cesium 原生交通圖層 — GroundPolylinePrimitive 貼地 */}
      <TransportCesiumLayer viewerRef={viewerRef} settings={settings} />

      {/* 量測模式提示 */}
      {settings.showMeasureTool && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,188,212,0.15)', border: '1px solid rgba(0,188,212,0.45)',
          borderRadius: 4, padding: '4px 12px', zIndex: 40, pointerEvents: 'none',
          fontSize: 10, color: '#00BCD4', letterSpacing: '0.12em',
        }}>
          {measurePts.length === 0
            ? '📏 點選起點'
            : (() => {
                const segs = measurePts.slice(1).map((p, i) => haversineM(measurePts[i].lat, measurePts[i].lng, p.lat, p.lng));
                const total = segs.reduce((s, d) => s + d, 0);
                return measurePts.length === 1
                  ? `📏 ${measurePts.length} 點 · 繼續點選新增 · 右鍵清除`
                  : `📏 ${fmtDist(total)} · ${measurePts.length} 點 · 繼續點選 · 右鍵清除`;
              })()
          }
        </div>
      )}

      {/* 高程剖面模式提示 */}
      {settings.showElevProfile && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(139,195,74,0.15)', border: '1px solid rgba(139,195,74,0.45)',
          borderRadius: 4, padding: '4px 12px', zIndex: 40, pointerEvents: 'none',
          fontSize: 10, color: '#8BC34A', letterSpacing: '0.12em',
        }}>
          {elevPts.length === 0 ? '⛰ 點選起點 A' : elevPts.length === 1 ? '⛰ 點選終點 B' : elevLoading ? '⛰ 高程取樣中...' : '⛰ 點選起點重設'}
        </div>
      )}

      {/* 高程剖面圖 */}
      {settings.showElevProfile && elevData.length > 0 && (
        <ElevProfilePanel data={elevData} onClose={() => { setElevPts([]); setElevData([]); }} />
      )}

      {/* HUD Info */}
      <div className="absolute bottom-4 left-4 bg-elegant-surface/80 border border-elegant-border p-3 font-mono text-[10px] pointer-events-none rounded shadow-lg">
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary">緯度:</span>
          <span>{settings.selectedBase?.lat.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary">經度:</span>
          <span>{settings.selectedBase?.lng.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary uppercase">光影模擬:</span>
          <span className={settings.showShadows ? 'text-[#00FF90]' : 'text-red-500 font-bold'}>
            {settings.showShadows ? '已啟動' : '關閉'}
          </span>
        </div>
      </div>
    </div>
  );
};
