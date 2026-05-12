/**
 * TransportCesiumLayer — Cesium 原生交通圖層（thin orchestrator）
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
  PointPrimitiveCollection,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  DistanceDisplayCondition,
  Color,
  Cartesian3,
  Cartesian2,
} from 'cesium';

import { MapSettings } from '../types';
import {
  MRT_STATIONS, THSR_STATIONS,
  TRA_STATIONS, TAOYUAN_MRT_STATIONS, TAICHUNG_MRT_STATIONS, KAOHSIUNG_MRT_STATIONS,
  loadMrtWayGeometry, loadThsrWayGeometry,
  loadTRAWayGeometry, loadTaoyuanMrtGeometry, loadTaichungMrtGeometry, loadKaohsiungMrtGeometry,
  type MrtWayGroup,
} from '../data/transportData';
import {
  fetchMrtLiveBoard, fetchMetroLiveBoard,
  fetchThsrDailyTimetable, interpolateThsrPositions,
  fetchTRADailyTimetable, interpolateTRAPositions,
  type ThsrTrainPosition, type TRATrainPosition,
  type MrtLiveBoard,
} from '../services/tdxService';

import { waitForViewer, removePrim, makeGroundLine } from '../transport/cesiumPrimitiveHelpers';
import { useRailRouteLayer } from '../transport/useRailRouteLayer';
import { useRailTrainLayer } from '../transport/useRailTrainLayer';
import { useYouBikeLayer } from '../transport/useYouBikeLayer';

interface Props {
  viewerRef: React.RefObject<any>;
  settings: MapSettings;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const TransportCesiumLayer: React.FC<Props> = ({ viewerRef, settings }) => {
  // Route primitives (MRT is multi-colour, handled separately)
  const mrtRouteRef    = useRef<GroundPolylinePrimitive[]>([]);
  const thsrRouteRef   = useRef<GroundPolylinePrimitive | null>(null);

  // Station / label collections
  const mrtStPtsRef    = useRef<PointPrimitiveCollection | null>(null);
  const thsrStPtsRef   = useRef<PointPrimitiveCollection | null>(null);
  const thsrLabelsRef  = useRef<LabelCollection | null>(null);

  // Train collections (MRT & THSR handled locally; others via hook)
  const mrtTrainsRef   = useRef<PointPrimitiveCollection | null>(null);
  const thsrTrainsRef  = useRef<PointPrimitiveCollection | null>(null);
  const thsrTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Kaohsiung MRT (multi-colour, handled separately)
  const ksMrtRouteRef  = useRef<GroundPolylinePrimitive[]>([]);
  const ksMrtStPtsRef  = useRef<PointPrimitiveCollection | null>(null);

  // Geometry caches (loaded once)
  const mrtGeoCache    = useRef<MrtWayGroup[] | null>(null);
  const thsrGeoCache   = useRef<[number, number][][] | null>(null);
  const ksMrtGeoCache  = useRef<MrtWayGroup[] | null>(null);

  const getV = () => viewerRef.current?.cesiumElement;

  // ── Unmount: remove all primitives still managed directly ──────────────────
  useEffect(() => () => {
    const v = getV();
    mrtRouteRef.current.forEach(p => removePrim(v, p));
    removePrim(v, thsrRouteRef.current);
    removePrim(v, mrtStPtsRef.current);
    removePrim(v, thsrStPtsRef.current);
    removePrim(v, thsrLabelsRef.current);
    removePrim(v, mrtTrainsRef.current);
    removePrim(v, thsrTrainsRef.current);
    ksMrtRouteRef.current.forEach(p => removePrim(v, p));
    removePrim(v, ksMrtStPtsRef.current);
    if (thsrTimerRef.current) clearInterval(thsrTimerRef.current);
  }, []);

  // ── MRT 路線 + 站點（多色，獨立管理）──────────────────────────────────────
  useEffect(() => {
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

      if (!mrtGeoCache.current) {
        console.log('[Transport] 載入 MRT 路線 (OSM way)...');
        mrtGeoCache.current = await loadMrtWayGeometry();
      }
      if (cancelled || !settings.showMrtLayer) return;

      for (const { color, segments } of mrtGeoCache.current) {
        const prim = makeGroundLine(segments, color, 4);
        if (!prim) continue;
        v.scene.primitives.add(prim);
        mrtRouteRef.current.push(prim);
      }

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

  // ── 台鐵 TRA 路線 + 站點（useRailRouteLayer hook）────────────────────────────
  useRailRouteLayer(
    viewerRef,
    settings.showTRALayer,
    '#3A7BD5', 3,
    loadTRAWayGeometry,
    TRA_STATIONS, 10, 'TRA',
  );

  // ── 桃園捷運路線 + 站點（useRailRouteLayer hook）──────────────────────────────
  useRailRouteLayer(
    viewerRef,
    settings.showTaoyuanMrtLayer,
    '#8B5CF6', 4,
    loadTaoyuanMrtGeometry,
    TAOYUAN_MRT_STATIONS, 9, '桃捷',
  );

  // ── 台中捷運路線 + 站點（useRailRouteLayer hook）──────────────────────────────
  useRailRouteLayer(
    viewerRef,
    settings.showTaichungMrtLayer,
    '#22C55E', 4,
    loadTaichungMrtGeometry,
    TAICHUNG_MRT_STATIONS, 9, '中捷',
  );

  // ── TRA 列車動態（useRailTrainLayer hook）────────────────────────────────────
  useRailTrainLayer({
    viewerRef,
    enabled:       settings.showTRATrains,
    pixelSize:     13,
    dotColorBytes: [60, 140, 255],
    fetchTimetable: fetchTRADailyTimetable,
    interpolateFn: (tt) => interpolateTRAPositions(tt) as TRATrainPosition[],
    intervalMs:    60_000,
  });

  // ── 桃捷列車動態（useMetroLiveBoardLayer — inlined for compactness）──────────
  useMetroTrainLayer(viewerRef, settings.showTaoyuanMrtTrains,  'TYMC', TAOYUAN_MRT_STATIONS,  [160, 100, 255]);
  useMetroTrainLayer(viewerRef, settings.showTaichungMrtTrains, 'TMRT', TAICHUNG_MRT_STATIONS, [50,  200, 100]);
  useMetroTrainLayer(viewerRef, settings.showKaohsiungMrtTrains,'KRTC', KAOHSIUNG_MRT_STATIONS,[255, 80,  80]);

  // ── YouBike 站點（useYouBikeLayer hook）──────────────────────────────────────
  useYouBikeLayer(viewerRef, settings.showYouBikeLayer);

  return null;
};

// ── 通用 Metro LiveBoard 列車 hook（桃/中/高捷）──────────────────────────────
function useMetroTrainLayer(
  viewerRef: React.RefObject<any>,
  showFlag: boolean,
  systemCode: 'TYMC' | 'TMRT' | 'KRTC',
  stations: { id: string; coords: [number, number] }[],
  dotColor: [number, number, number],
) {
  const trainsRef = useRef<PointPrimitiveCollection | null>(null);
  const getV = () => viewerRef.current?.cesiumElement;

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
