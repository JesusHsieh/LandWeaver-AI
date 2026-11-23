/**
 * useTrainLayer — 高鐵 / 台鐵列車即時位置
 *
 * 依今日時刻表（台鐵另加 TDX 即時誤點）推算每班車現在在哪兩站之間、走了多少比例，
 * 再沿軌道（trackGraph）找出地圖上的位置；每 250 ms 更新，列車連續移動。
 * 停站時停在車站，進出站有加減速。
 */

import React, { useEffect, useRef } from 'react';
import {
  PointPrimitiveCollection,
  LabelCollection,
  LabelStyle,
  VerticalOrigin,
  Color,
  Cartesian2,
  Cartesian3,
  NearFarScalar,
  DistanceDisplayCondition,
  type PointPrimitive,
  type Label,
} from 'cesium';
import type { LineRoute } from '../data/transportData';
import { taipeiNow, hasTdxKey, type RailTrip } from '../services/tdxService';
import { TrackGraph, pointAlong } from './trackGraph';
import { waitForViewer, removePrim } from './cesiumPrimitiveHelpers';

type LngLat = [number, number];

export interface TrainLayerOptions {
  viewerRef: React.RefObject<any>;
  enabled: boolean;
  /** 圖層名稱（console 訊息用） */
  name: string;
  /** 軌道幾何 */
  loadRoute: () => Promise<LineRoute>;
  /** 站名 → 座標；時刻表裡對不到座標的站會略過，列車直接開往下一個已知站 */
  stations: (route: LineRoute) => { name: string; coords: LngLat }[];
  fetchTrips: () => Promise<RailTrip[]>;
  /** 即時誤點（分鐘，以車次為 key） */
  fetchDelays?: () => Promise<Map<string, number> | null>;
  colors: { express: string; local: string };
  pixelSize: number;
  /** 相機距離（公尺）小於此值才顯示車次標籤 */
  labelMaxDistance: number;
}

interface Run {
  key: string;
  trainNo: string;
  label: string;
  express: boolean;
  stops: { arr: number; dep: number; pos: LngLat }[];
  overnight: boolean;
}

const UPDATE_MS = 250;
const DAY = 86_400;

const nameKey = (n: string) =>
  n.replace(/臺/g, '台').replace(/\s*[（(].*?[)）]\s*/g, '').replace(/站$/, '').trim();

/** 加減速：一半等速、一半 smoothstep，起步與進站較慢 */
const ease = (f: number) => 0.5 * f + 0.5 * f * f * (3 - 2 * f);

/** 時間 t 時列車停在第幾站，或在哪一段（stops[leg] → stops[leg+1]）的多少比例；不在營運中回傳 null */
function locate(run: Run, t: number): { at: number } | { leg: number; frac: number } | null {
  const s = run.stops;
  if (t < s[0].arr || t > s[s.length - 1].dep) return null;
  for (let i = 0; i < s.length; i++) {
    if (t < s[i].arr) {
      const a = s[i - 1].dep, b = s[i].arr;
      return { leg: i - 1, frac: b > a ? (t - a) / (b - a) : 1 };
    }
    if (t <= s[i].dep) return { at: i };
  }
  return null;
}

const graphs = new WeakMap<object, TrackGraph>();
function graphFor(route: LineRoute): TrackGraph {
  let g = graphs.get(route.lines);
  if (!g) { g = new TrackGraph(route.lines); graphs.set(route.lines, g); }
  return g;
}

function prepare(trips: RailTrip[], coords: Map<string, LngLat>, name: string): Run[] {
  const missing = new Set<string>();
  const runs = trips.map((t, i): Run => {
    const stops = t.stops.flatMap(s => {
      const pos = coords.get(nameKey(s.name));
      if (!pos) missing.add(s.name);
      return pos ? [{ arr: s.arr, dep: s.dep, pos }] : [];
    });
    return {
      key: `${t.trainNo}#${i}`,
      trainNo: t.trainNo,
      label: t.label,
      express: t.express,
      stops,
      overnight: stops.length > 0 && stops[stops.length - 1].dep > DAY,
    };
  }).filter(r => r.stops.length >= 2);
  if (missing.size) console.debug(`[列車] ${name}：${missing.size} 個站沒有座標，略過`, [...missing]);
  return runs;
}

export function useTrainLayer(options: TrainLayerOptions): void {
  const opts = useRef(options);
  opts.current = options;

  useEffect(() => {
    if (!options.enabled) return;
    const {
      viewerRef, name, loadRoute, stations, fetchTrips, fetchDelays,
      colors, pixelSize, labelMaxDistance,
    } = opts.current;

    let cancelled = false;
    let viewer: any = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let delayTimer: ReturnType<typeof setInterval> | undefined;
    const points = new PointPrimitiveCollection();
    const labels = new LabelCollection();

    (async () => {
      const [v, route, trips] = await Promise.all([waitForViewer(viewerRef), loadRoute(), fetchTrips()]);
      if (cancelled) return;
      if (!trips.length) {
        console.warn(`[列車] ${name}：沒有取得時刻表（TDX 無回應或次數已用完）`);
        return;
      }
      const graph = graphFor(route);
      const coords = new Map<string, LngLat>(
        stations(route).map(s => [nameKey(s.name), s.coords] as [string, LngLat])
      );
      let runs = prepare(trips, coords, name);
      let loadedDate = taipeiNow().date;
      let refreshing = false;
      let delays = new Map<string, number>();

      viewer = v;
      v.scene.primitives.add(points);
      v.scene.primitives.add(labels);

      const scale = new NearFarScalar(1e4, 1.2, 1e6, 0.6);
      const showLabel = new DistanceDisplayCondition(0, labelMaxDistance);
      const outline = Color.fromBytes(20, 20, 20, 230);
      const live = new Map<string, { point: PointPrimitive; label: Label; text: string }>();

      const tick = () => {
        const now = taipeiNow();
        if (now.date !== loadedDate && !refreshing) {
          // 過午夜換新的一天的時刻表
          refreshing = true;
          fetchTrips().then(t => {
            if (t.length) { runs = prepare(t, coords, name); loadedDate = now.date; }
            refreshing = false;
          });
        }
        const active = new Set<string>();
        for (const run of runs) {
          const delayMin = delays.get(run.trainNo) ?? 0;
          const t = now.sec - delayMin * 60;
          const loc = locate(run, t) ?? (run.overnight ? locate(run, t + DAY) : null);
          if (!loc) continue;
          const [lng, lat] = 'at' in loc
            ? graph.stationPoint(run.stops[loc.at].pos)
            : pointAlong(graph.path(run.stops[loc.leg].pos, run.stops[loc.leg + 1].pos), ease(loc.frac));
          const position = Cartesian3.fromDegrees(lng, lat, 8);
          const text = delayMin > 0 ? `${run.label} · 晚 ${delayMin} 分` : run.label;
          const item = live.get(run.key);
          if (item) {
            item.point.position = position;
            item.label.position = position;
            if (item.text !== text) { item.label.text = text; item.text = text; }
          } else {
            const color = Color.fromCssColorString(run.express ? colors.express : colors.local);
            live.set(run.key, {
              text,
              point: points.add({
                position,
                pixelSize,
                color,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                scaleByDistance: scale,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              }),
              // 車次標在點的下方，避免和上方的站名重疊
              label: labels.add({
                position,
                text,
                font: '600 11px sans-serif',
                fillColor: color,
                outlineColor: outline,
                outlineWidth: 3,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.TOP,
                pixelOffset: new Cartesian2(0, 9),
                distanceDisplayCondition: showLabel,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              }),
            });
          }
          active.add(run.key);
        }
        for (const [key, item] of live) {
          if (active.has(key)) continue;
          points.remove(item.point);
          labels.remove(item.label);
          live.delete(key);
        }
      };

      tick();
      timer = setInterval(tick, UPDATE_MS);
      console.info(`[列車] ${name}：今日 ${runs.length} 班，目前 ${live.size} 班行駛中`);

      if (fetchDelays) {
        const poll = async () => {
          const d = await fetchDelays();
          if (d && !cancelled) delays = d;
        };
        poll();
        // 未填 TDX Key 時每日次數很少，拉長查詢間隔
        delayTimer = setInterval(poll, hasTdxKey() ? 60_000 : 600_000);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(delayTimer);
      if (viewer) {
        removePrim(viewer, points);
        removePrim(viewer, labels);
      } else {
        points.destroy();
        labels.destroy();
      }
    };
  }, [options.enabled]);
}
