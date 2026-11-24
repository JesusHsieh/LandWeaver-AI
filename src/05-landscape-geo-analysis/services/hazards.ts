// 災害潛勢點位查詢結果的共用標示（面板、規則檢核、報告共用）
import { FloodScenario, Level, SiteHazards } from '../types';

const NO_DATA = '無資料';

/** 水利署淹水潛勢圖圖例：Class 1–5 的淹水深度 */
const FLOOD_DEPTH: Record<number, string> = {
  1: '0.3–0.5', 2: '0.5–1.0', 3: '1.0–2.0', 4: '2.0–3.0', 5: '> 3.0',
};

/** 規則檢核與風險警示採用的降雨情境 */
export const FLOOD_DESIGN = { hours: 24, rainfall: 500 } as const;

export const NOT_IN_FLOOD_ZONE = '不在潛勢範圍';

/** 「0.5–1.0 m」；不在潛勢範圍為 null */
export const floodDepth = (cls: number | null): string | null =>
  cls === null ? null : `${FLOOD_DEPTH[cls] ?? `第 ${cls} 級`} m`;

/** 淹水深度 ≥1.0 m 高、0.5–1.0 m 中、0.3–0.5 m 低 */
export const floodLevel = (cls: number | null): Level | null =>
  cls === null ? null : cls >= 3 ? '高' : cls === 2 ? '中' : '低';

export const scenarioLabel = (s: Pick<FloodScenario, 'hours' | 'rainfall'>) => `${s.hours} 小時 ${s.rainfall} mm`;

export const designFlood = (flood: FloodScenario[]) =>
  flood.find(s => s.hours === FLOOD_DESIGN.hours && s.rainfall === FLOOD_DESIGN.rainfall) ?? null;

/** 淹水最深的情境；各情境皆不在潛勢範圍時為 null */
export const worstFlood = (flood: FloodScenario[]) =>
  flood.reduce<FloodScenario | null>(
    (worst, s) => (s.floodClass !== null && s.floodClass > (worst?.floodClass ?? 0) ? s : worst), null);

export const liquefactionLabel = (v: SiteHazards['liquefaction']) =>
  v === null ? NO_DATA : v === '未列入' ? '未列入分級範圍' : `${v}潛勢`;

export const debrisSlideLabel = (v: boolean | null) =>
  v === null ? NO_DATA : v ? '位於潛勢區' : '不在潛勢區';

export const GEO_SENSITIVE_VALUE = '無法點位判定';
export const GEO_SENSITIVE_NOTE = '地調中心 WMS 只提供外框圖、不支援點位查詢，請開啟 08D、08F 圖層目視確認';

export const HAZARD_SOURCES = {
  flood:        '經濟部水利署淹水潛勢圖（GIC WMS 圖徵查詢）',
  liquefaction: '地調中心初級土壤液化潛勢 2021（圖層色碼判讀）',
  debrisSlide:  '地調中心岩屑崩滑潛勢分析圖 2013（圖層色碼判讀）',
};
