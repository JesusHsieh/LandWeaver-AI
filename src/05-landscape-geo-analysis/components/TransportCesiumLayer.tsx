/**
 * TransportCesiumLayer — Cesium 原生交通圖層
 *
 * 使用 GroundPolylinePrimitive 讓路線貼合地球表面（不浮空）
 * 使用 PointPrimitiveCollection 顯示站點與列車
 *
 * 路線幾何：OSM Overpass API（way-based，免費・無需 Key）
 * 列車動態：TDX（免費申請・需 Client ID/Secret）
 * YouBike：data.taipei（完全免費）
 */

import React, { useEffect, useRef } from 'react';
import {
  GroundPolylinePrimitive,
  GroundPolylineGeometry,
  GeometryInstance,
  PolylineMaterialAppearance,
  Material,
  Color,
  Cartesian3,
  Cartesian2,
  PointPrimitiveCollection,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  DistanceDisplayCondition,
} from 'cesium';

import { MapSettings } from '../types';
import {
  MRT_STATIONS, THSR_STATIONS,
  TRA_STATIONS, TAOYUAN_MRT_STATIONS, TAICHUNG_MRT_STATIONS, KAOHSIUNG_MRT_STATIONS,
  loadMrtWayGeometry, loadThsrWayGeometry,
  loadTRAWayGeometry, loadTaoyuanMrtGeometry, loadTaichungMrtGeometry, loadKaohsiungMrtGeometry,
  type MrtWayGroup,
  type SimpleStation,
} from '../data/transportData';
import {
  fetchMrtLiveBoard, fetchMetroLiveBoard,
  fetchThsrDailyTimetable, interpolateThsrPositions,
  fetchTRADailyTimetable, interpolateTRAPositions,
  fetchYouBikeStations,
  type ThsrTrainPosition, type TRATrainPosition,
  type YouBikeStation, type MrtLiveBoard,
} from '../services/tdxService';

interface Props {
  viewerRef: React.RefObject<any>;
  settings: MapSettings;
}

// ── 等待 Cesium Viewer 就緒 ────────────────────────────────────────────────────
function waitForViewer(viewerRef: React.RefObject<any>): Promise<any> {
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
function removePrim(viewer: any, prim: any) {
  if (!prim || !viewer?.scene?.primitives) return;
  try { viewer.scene.primitives.remove(prim); } catch { /* already removed */ }
}

// ── 建立 GroundPolylinePrimitive（貼地路線）───────────────────────────────────
function makeGroundLine(
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

// ── Component ─────────────────────────────────────────────────────────────────
export const TransportCesiumLayer: React.FC<Props> = ({ viewerRef, settings }) => {
  // Route primitives
  const mrtRouteRef    = useRef<GroundPolylinePrimitive[]>([]);
  const thsrRouteRef   = useRef<GroundPolylinePrimitive | null>(null);

  // Station / label collections
  const mrtStPtsRef    = useRef<PointPrimitiveCollection | null>(null);
  const thsrStPtsRef   = useRef<PointPrimitiveCollection | null>(null);
  const thsrLabelsRef  = useRef<LabelCollection | null>(null);

  // Train collections
  const mrtTrainsRef   = useRef<PointPrimitiveCollection | null>(null);
  const thsrTrainsRef  = useRef<PointPrimitiveCollection | null>(null);

  // YouBike
  const youbikeRef     = useRef<PointPrimitiveCollection | null>(null);

  // ── Additional layer refs ────────────────────────────────────────────────────
  const traRouteRef      = useRef<GroundPolylinePrimitive | null>(null);
  const traStPtsRef      = useRef<PointPrimitiveCollection | null>(null);
  const traTrainsRef     = useRef<PointPrimitiveCollection | null>(null);
  const traTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const tyMrtRouteRef    = useRef<GroundPolylinePrimitive | null>(null);
  const tyMrtStPtsRef    = useRef<PointPrimitiveCollection | null>(null);
  const tyMrtTrainsRef   = useRef<PointPrimitiveCollection | null>(null);
  const tcMrtRouteRef    = useRef<GroundPolylinePrimitive | null>(null);
  const tcMrtStPtsRef    = useRef<PointPrimitiveCollection | null>(null);
  const tcMrtTrainsRef   = useRef<PointPrimitiveCollection | null>(null);
  const ksMrtRouteRef    = useRef<GroundPolylinePrimitive[]>([]);  // 多色：一色一 primitive
  const ksMrtStPtsRef    = useRef<PointPrimitiveCollection | null>(null);
  const ksMrtTrainsRef   = useRef<PointPrimitiveCollection | null>(null);

  // Geometry cache (loaded once)
  const mrtGeoCache    = useRef<MrtWayGroup[] | null>(null);
  const thsrGeoCache   = useRef<[number, number][][] | null>(null);
  const traGeoCache    = useRef<[number, number][][] | null>(null);
  const tyMrtGeoCache  = useRef<[number, number][][] | null>(null);
  const tcMrtGeoCache  = useRef<[number, number][][] | null>(null);
  const ksMrtGeoCache  = useRef<MrtWayGroup[] | null>(null);

  // Timers
  const thsrTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  // ── Unmount: remove all primitives ─────────────────────────────────────────
  useEffect(() => () => {
    const v = getV();
    mrtRouteRef.current.forEach(p => removePrim(v, p));
    removePrim(v, thsrRouteRef.current);
    removePrim(v, mrtStPtsRef.current);
    removePrim(v, thsrStPtsRef.current);
    removePrim(v, thsrLabelsRef.current);
    removePrim(v, mrtTrainsRef.current);
    removePrim(v, thsrTrainsRef.current);
    removePrim(v, traRouteRef.current);
    removePrim(v, traStPtsRef.current);
    removePrim(v, traTrainsRef.current);
    if (traTimerRef.current) clearInterval(traTimerRef.current);
    removePrim(v, tyMrtRouteRef.current);
    removePrim(v, tyMrtStPtsRef.current);
    removePrim(v, tyMrtTrainsRef.current);
    removePrim(v, tcMrtRouteRef.current);
    removePrim(v, tcMrtStPtsRef.current);
    removePrim(v, tcMrtTrainsRef.current);
    ksMrtRouteRef.current.forEach(p => removePrim(v, p));
    removePrim(v, ksMrtStPtsRef.current);
    removePrim(v, ksMrtTrainsRef.current);
    removePrim(v, youbikeRef.current);
    if (thsrTimerRef.current) clearInterval(thsrTimerRef.current);
  }, []);

  // ── MRT 路線 + 站點 ─────────────────────────────────────────────────────────
  useEffect(() => {
    // 先清除舊的
    const vNow = getV();
    mrtRouteRef.current.forEach(p => removePrim(vNow, p));
    mrtRouteRef.current = [];
    removePrim(vNow, mrtStPtsRef.current);
    mrtStPtsRef.current = null;

    if (!settings.showMrtLayer) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showMrtLayer) return;

      // Load geometry (cached after first fetch)
      if (!mrtGeoCache.current) {
        console.log('[Transport] 載入 MRT 路線 (OSM way)...');
        mrtGeoCache.current = await loadMrtWayGeometry();
      }
      if (cancelled || !settings.showMrtLayer) return;

      // One GroundPolylinePrimitive per color group
      for (const { color, segments } of mrtGeoCache.current) {
        const prim = makeGroundLine(segments, color, 4);
        if (!prim) continue;
        v.scene.primitives.add(prim);
        mrtRouteRef.current.push(prim);
      }

      // Station dots (visible when zoomed in)
      const pts = new PointPrimitiveCollection();
      MRT_STATIONS.forEach(s => pts.add({
        position:     Cartesian3.fromDegrees(s.coords[0], s.coords[1], 2),
        pixelSize:    9,
        color:        Color.WHITE.withAlpha(0.9),
        outlineColor: Color.fromBytes(50, 50, 50, 220),
        outlineWidth: 1.5,
        scaleByDistance: new NearFarScalar(5e3, 1.4, 6e4, 0.3),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 8e4),
      }));
      v.scene.primitives.add(pts);
      mrtStPtsRef.current = pts;
    })();

    return () => { cancelled = true; };
  }, [settings.showMrtLayer]);

  // ── MRT 列車動態 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, mrtTrainsRef.current);
    mrtTrainsRef.current = null;

    if (!settings.showMrtTrains) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showMrtTrains) return;

      const boards = await fetchMrtLiveBoard();
      if (cancelled || !settings.showMrtTrains) return;

      const pts = new PointPrimitiveCollection();
      boards.forEach((b: MrtLiveBoard) => {
        const st = MRT_STATIONS.find(s => s.id === b.StationID);
        if (!st) return;
        pts.add({
          position:    Cartesian3.fromDegrees(st.coords[0], st.coords[1], 5),
          pixelSize:   14,
          color:       Color.fromBytes(255, 220, 0, 240),
          outlineColor: Color.fromBytes(80, 60, 0, 255),
          outlineWidth: 2,
        });
      });
      v.scene.primitives.add(pts);
      mrtTrainsRef.current = pts;
    })();

    return () => { cancelled = true; };
  }, [settings.showMrtTrains]);

  // ── THSR 路線 + 站點 + 標籤 ──────────────────────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, thsrRouteRef.current);
    thsrRouteRef.current = null;
    removePrim(vNow, thsrStPtsRef.current);
    thsrStPtsRef.current = null;
    removePrim(vNow, thsrLabelsRef.current);
    thsrLabelsRef.current = null;

    if (!settings.showThsrLayer) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showThsrLayer) return;

      if (!thsrGeoCache.current) {
        console.log('[Transport] 載入 THSR 路線 (OSM way)...');
        thsrGeoCache.current = await loadThsrWayGeometry();
      }
      if (cancelled || !settings.showThsrLayer) return;

      const prim = makeGroundLine(thsrGeoCache.current, '#DC3232', 5);
      if (prim) {
        v.scene.primitives.add(prim);
        thsrRouteRef.current = prim;
      }

      // Station dots
      const pts = new PointPrimitiveCollection();
      THSR_STATIONS.forEach(s => pts.add({
        position:    Cartesian3.fromDegrees(s.coords[0], s.coords[1], 2),
        pixelSize:   13,
        color:       Color.WHITE.withAlpha(0.92),
        outlineColor: Color.fromBytes(220, 50, 50, 220),
        outlineWidth: 2.5,
        scaleByDistance: new NearFarScalar(2e4, 1.4, 5e5, 0.4),
      }));
      v.scene.primitives.add(pts);
      thsrStPtsRef.current = pts;

      // Labels
      const labels = new LabelCollection();
      THSR_STATIONS.forEach(s => labels.add({
        position:    Cartesian3.fromDegrees(s.coords[0], s.coords[1], 50),
        text:        s.name,
        font:        'bold 13px sans-serif',
        fillColor:   Color.fromBytes(255, 240, 240, 230),
        outlineColor: Color.fromBytes(40, 10, 10, 200),
        outlineWidth: 3,
        style:       LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(0, -18),
        scaleByDistance: new NearFarScalar(1e4, 1.2, 3e5, 0.3),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 4e5),
      }));
      v.scene.primitives.add(labels);
      thsrLabelsRef.current = labels;
    })();

    return () => { cancelled = true; };
  }, [settings.showThsrLayer]);

  // ── THSR 列車動態 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, thsrTrainsRef.current);
    thsrTrainsRef.current = null;
    if (thsrTimerRef.current) { clearInterval(thsrTimerRef.current); thsrTimerRef.current = null; }

    if (!settings.showThsrTrains) return;

    let cancelled = false;

    const updateTrains = (timetable: any[], v: any) => {
      if (cancelled) return;
      removePrim(v, thsrTrainsRef.current);
      const positions = interpolateThsrPositions(timetable);

      const pts = new PointPrimitiveCollection();
      positions.forEach((p: ThsrTrainPosition) => pts.add({
        position:    Cartesian3.fromDegrees(p.lng, p.lat, 5),
        pixelSize:   18,
        color:       Color.fromBytes(255, 80, 80, 240),
        outlineColor: Color.WHITE.withAlpha(0.85),
        outlineWidth: 2.5,
      }));
      v.scene.primitives.add(pts);
      thsrTrainsRef.current = pts;
    };

    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showThsrTrains) return;

      const tt = await fetchThsrDailyTimetable();
      if (cancelled || !settings.showThsrTrains) return;

      updateTrains(tt, v);
      thsrTimerRef.current = setInterval(() => updateTrains(tt, v), 30_000);
    })();

    return () => { cancelled = true; };
  }, [settings.showThsrTrains]);

  // ── 通用：單色路線 + 站點 helper ─────────────────────────────────────────────
  function useSimpleRailLayer(
    showFlag: boolean,
    routeRef: React.MutableRefObject<GroundPolylinePrimitive | null>,
    stPtsRef: React.MutableRefObject<PointPrimitiveCollection | null>,
    geoCache: React.MutableRefObject<[number, number][][] | null>,
    loadFn: () => Promise<[number, number][][]>,
    color: string,
    lineWidth: number,
    stations: SimpleStation[],
    stationPixelSize: number,
    label?: string,
  ) {
    useEffect(() => {
      const vNow = getV();
      removePrim(vNow, routeRef.current);
      routeRef.current = null;
      removePrim(vNow, stPtsRef.current);
      stPtsRef.current = null;

      if (!showFlag) return;

      let cancelled = false;
      (async () => {
        const v = await waitForViewer(viewerRef);
        if (cancelled || !showFlag) return;

        if (!geoCache.current) {
          if (label) console.log(`[Transport] 載入 ${label} (OSM way)...`);
          geoCache.current = await loadFn();
        }
        if (cancelled || !showFlag) return;

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
    }, [showFlag]);
  }

  // ── 台鐵 TRA ─────────────────────────────────────────────────────────────────
  useSimpleRailLayer(
    settings.showTRALayer,
    traRouteRef, traStPtsRef, traGeoCache,
    loadTRAWayGeometry,
    '#3A7BD5', 3,
    TRA_STATIONS, 10, 'TRA',
  );

  // ── 桃園捷運 ──────────────────────────────────────────────────────────────────
  useSimpleRailLayer(
    settings.showTaoyuanMrtLayer,
    tyMrtRouteRef, tyMrtStPtsRef, tyMrtGeoCache,
    loadTaoyuanMrtGeometry,
    '#8B5CF6', 4,
    TAOYUAN_MRT_STATIONS, 9, '桃捷',
  );

  // ── 台中捷運 ──────────────────────────────────────────────────────────────────
  useSimpleRailLayer(
    settings.showTaichungMrtLayer,
    tcMrtRouteRef, tcMrtStPtsRef, tcMrtGeoCache,
    loadTaichungMrtGeometry,
    '#22C55E', 4,
    TAICHUNG_MRT_STATIONS, 9, '中捷',
  );

  // ── 高雄捷運（紅線+橘線+環狀輕軌，多色）────────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    ksMrtRouteRef.current.forEach(p => removePrim(vNow, p));
    ksMrtRouteRef.current = [];
    removePrim(vNow, ksMrtStPtsRef.current);
    ksMrtStPtsRef.current = null;

    if (!settings.showKaohsiungMrtLayer) return;
    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showKaohsiungMrtLayer) return;

      if (!ksMrtGeoCache.current) {
        console.log('[Transport] 載入 高捷 (OSM relation)...');
        ksMrtGeoCache.current = await loadKaohsiungMrtGeometry();
      }
      if (cancelled || !settings.showKaohsiungMrtLayer) return;

      for (const { color, segments } of ksMrtGeoCache.current) {
        const prim = makeGroundLine(segments, color, 4);
        if (!prim) continue;
        v.scene.primitives.add(prim);
        ksMrtRouteRef.current.push(prim);
      }

      const pts = new PointPrimitiveCollection();
      KAOHSIUNG_MRT_STATIONS.forEach(s => pts.add({
        position:    Cartesian3.fromDegrees(s.coords[0], s.coords[1], 2),
        pixelSize:   9,
        color:       Color.WHITE.withAlpha(0.9),
        outlineColor: Color.fromCssColorString('#EF4444').withAlpha(0.85),
        outlineWidth: 2,
        scaleByDistance: new NearFarScalar(1e4, 1.4, 4e5, 0.3),
      }));
      v.scene.primitives.add(pts);
      ksMrtStPtsRef.current = pts;
    })();
    return () => { cancelled = true; };
  }, [settings.showKaohsiungMrtLayer]);

  // ── TRA 列車動態（時刻表內插，與 THSR 同邏輯）────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, traTrainsRef.current);
    traTrainsRef.current = null;
    if (traTimerRef.current) { clearInterval(traTimerRef.current); traTimerRef.current = null; }

    if (!settings.showTRATrains) return;
    let cancelled = false;

    const updateTRA = (tt: any[], v: any) => {
      if (cancelled) return;
      removePrim(v, traTrainsRef.current);
      const positions = interpolateTRAPositions(tt);
      const pts = new PointPrimitiveCollection();
      positions.forEach((p: TRATrainPosition) => pts.add({
        position:    Cartesian3.fromDegrees(p.lng, p.lat, 5),
        pixelSize:   13,
        color:       Color.fromBytes(60, 140, 255, 240),
        outlineColor: Color.WHITE.withAlpha(0.85),
        outlineWidth: 2,
      }));
      v.scene.primitives.add(pts);
      traTrainsRef.current = pts;
    };

    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showTRATrains) return;
      const tt = await fetchTRADailyTimetable();
      if (cancelled || !settings.showTRATrains) return;
      updateTRA(tt, v);
      traTimerRef.current = setInterval(() => updateTRA(tt, v), 60_000);
    })();
    return () => { cancelled = true; };
  }, [settings.showTRATrains]);

  // ── 通用 Metro LiveBoard 訓練（桃/中/高捷）────────────────────────────────────
  function useMetroTrains(
    showFlag: boolean,
    trainsRef: React.MutableRefObject<PointPrimitiveCollection | null>,
    systemCode: 'TYMC' | 'TMRT' | 'KRTC',
    stations: { id: string; coords: [number, number] }[],
    dotColor: [number, number, number],
  ) {
    useEffect(() => {
      const vNow = getV();
      removePrim(vNow, trainsRef.current);
      trainsRef.current = null;
      if (!showFlag) return;
      let cancelled = false;

      (async () => {
        const v = await waitForViewer(viewerRef);
        if (cancelled || !showFlag) return;
        const boards = await fetchMetroLiveBoard(systemCode);
        if (cancelled || !showFlag) return;

        const pts = new PointPrimitiveCollection();
        boards.forEach((b: MrtLiveBoard) => {
          // TDX 站 ID 可能有前置零（A01 vs A1），嘗試兩種格式
          const st = stations.find(s =>
            s.id === b.StationID ||
            s.id === b.StationID.replace(/^([A-Z]+)0+(\d)/, '$1$2') ||
            s.id.replace(/^([A-Z]+)0+(\d)/, '$1$2') === b.StationID
          );
          if (!st) return;
          pts.add({
            position:    Cartesian3.fromDegrees(st.coords[0], st.coords[1], 5),
            pixelSize:   13,
            color:       Color.fromBytes(...dotColor, 240),
            outlineColor: Color.WHITE.withAlpha(0.85),
            outlineWidth: 2,
          });
        });
        v.scene.primitives.add(pts);
        trainsRef.current = pts;
      })();
      return () => { cancelled = true; };
    }, [showFlag]);
  }

  useMetroTrains(
    settings.showTaoyuanMrtTrains, tyMrtTrainsRef,
    'TYMC', TAOYUAN_MRT_STATIONS, [160, 100, 255],   // 紫
  );
  useMetroTrains(
    settings.showTaichungMrtTrains, tcMrtTrainsRef,
    'TMRT', TAICHUNG_MRT_STATIONS, [50, 200, 100],   // 綠
  );
  useMetroTrains(
    settings.showKaohsiungMrtTrains, ksMrtTrainsRef,
    'KRTC', KAOHSIUNG_MRT_STATIONS, [255, 80, 80],   // 紅
  );

  // ── YouBike 站點 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const vNow = getV();
    removePrim(vNow, youbikeRef.current);
    youbikeRef.current = null;

    if (!settings.showYouBikeLayer) return;

    let cancelled = false;
    (async () => {
      const v = await waitForViewer(viewerRef);
      if (cancelled || !settings.showYouBikeLayer) return;

      const stations = await fetchYouBikeStations();
      if (cancelled || !settings.showYouBikeLayer) return;

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
  }, [settings.showYouBikeLayer]);

  return null;
};
