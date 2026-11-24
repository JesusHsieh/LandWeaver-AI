/**
 * Site rule checklist — no AI / API calls.
 *
 * Each rule compares one value of the clicked point's site data with a fixed
 * threshold and reports whether it triggers. A value that could not be fetched
 * is reported as「未判讀」, never filled with an estimate. The panel lists the
 * results, and `formatRulesForAI` turns them into a Markdown table the user can
 * paste into any AI chat for the actual design analysis.
 */
import { MicroClimateData, LandscapeDesignData } from '../types';

export type RuleStatus = 'hit' | 'pass' | 'info' | 'na';
export type RuleLevel = '高' | '中' | '低';

export interface RuleCheck {
  id: string;        // R01…
  group: string;     // 地形 / 水文 / 熱環境 / 風環境 / 日照 / 空氣 / 能源 / 法規 / 綜合
  name: string;
  value: string;
  threshold: string; // 判準
  status: RuleStatus;
  level?: RuleLevel; // only when status === 'hit'
  note?: string;
}

type Outcome = Pick<RuleCheck, 'status' | 'level' | 'note'>;
const hit = (level: RuleLevel, note: string): Outcome => ({ status: 'hit', level, note });
const pass = (note?: string): Outcome => ({ status: 'pass', note });
const NO_DATA = '無資料';
const na = (note: string): Outcome & { value: string } => ({ status: 'na', value: NO_DATA, note });

const f0 = (n: number) => n.toFixed(0);
const f1 = (n: number) => n.toFixed(1);

const CURVATURE_EPS = 1e-5; // m⁻¹; smaller magnitudes count as flat

const SOURCE_LABEL: Record<string, string> = {
  openMeteo: 'Open-Meteo', cwa: '中央氣象署', epa: '環境部', pvgis: 'PVGIS',
  openElevation: 'Open-Elevation', nlscWms: '國土測繪中心', none: '查詢失敗',
};
const src = (s: string) => SOURCE_LABEL[s] ?? s;

export function evaluateSiteRules(m: MicroClimateData, l: LandscapeDesignData): RuleCheck[] {
  const checks: RuleCheck[] = [];
  const add = (c: Omit<RuleCheck, 'id'>) =>
    checks.push({ id: `R${String(checks.length + 1).padStart(2, '0')}`, ...c });

  const noElev = '高程資料查詢失敗';
  const noWx = '氣象資料查詢失敗';

  // ── 地形 ──
  const slope = m.slopePct;
  add({
    group: '地形', name: '坡度', threshold: '≥15% 坡地 · ≥30% 陡坡',
    ...(slope === null ? na(noElev) : {
      value: `${f1(slope)}%（${m.aspectDeg === null ? '平坦' : `${m.aspectDir}向`}）`,
      ...(slope >= 30 ? hit('高', '陡坡：表土沖蝕、邊坡滑動風險')
        : slope >= 15 ? hit('中', '坡地：降雨逕流集中、坡面易沖蝕')
        : pass()),
    }),
  });

  const curv = m.planCurvature;
  const curvLabel = curv === null ? '' : curv > CURVATURE_EPS ? '凹地' : curv < -CURVATURE_EPS ? '凸地' : '平直';
  add({
    group: '地形', name: '地表曲率', threshold: '> 0 為聚水凹地',
    ...(curv === null ? na(noElev) : {
      value: `${curvLabel}（${curv.toExponential(1)} m⁻¹）`,
      ...(curvLabel === '凹地' ? hit('低', '凹地：周邊地表逕流向基地匯集') : pass()),
    }),
  });

  const el = m.elevation;
  add({
    group: '地形', name: '海拔', threshold: '≥500 m 中海拔',
    ...(el === null ? na(noElev) : {
      value: `${f0(el)} m`,
      ...(el >= 500
        ? hit('低', `均溫較平地低約 ${f1(el * 0.006)}°C（遞減率 0.6°C/100 m），留意寒害`)
        : pass()),
    }),
  });

  // ── 水文 ──
  const { speed, waterloggingRisk } = l.drainage;
  add({
    group: '水文', name: '積水風險',
    threshold: '坡度 ≤5% 且雨量 >3 mm 或濕度 >80% 為高；坡度 >20% 為低',
    ...(waterloggingRisk === null ? na(speed === null ? noElev : noWx) : {
      value: `${waterloggingRisk}（地表排水${speed}）`,
      ...(waterloggingRisk === '高' ? hit('高', '地勢平緩且正逢降雨或高濕，強降雨易滯水')
        : waterloggingRisk === '中' ? hit('中', '地表排水不快，強降雨時可能滯水')
        : pass('坡度大，地表排水快')),
    }),
  });

  // ── 熱環境 ──
  const st = m.surfaceTemp;
  add({
    group: '熱環境', name: '地表溫度', threshold: '>35°C 高溫 · >40°C 酷熱',
    ...(st === null ? na('地表溫度只有 Open-Meteo 提供，本次查詢失敗') : {
      value: `${f1(st)}°C（模式值）`,
      ...(st > 40 ? hit('高', '地表強烈蓄熱，戶外熱不適')
        : st > 35 ? hit('中', '地表蓄熱，戶外熱不適')
        : pass()),
    }),
  });

  // ── 風環境 ──
  const ws = m.windSpeed;
  add({
    group: '風環境', name: '平均風速', threshold: '≥5 m/s 強風',
    ...(ws === null ? na(noWx) : {
      value: `${f1(ws)} m/s`,
      ...(ws >= 5 ? hit('中', '淺根植栽易倒伏、蒸散失水快') : pass()),
    }),
  });
  const { windySlope, stagnantLowland } = l.urbanStress;
  add({
    group: '風環境', name: '強風坡地', threshold: '風速 >5 m/s 且坡度 >10%',
    ...(windySlope === null ? na(ws === null ? noWx : noElev) : {
      value: windySlope ? '是' : '否',
      ...(windySlope ? hit('中', '強風吹過坡面，行人舒適與植栽穩定受影響') : pass()),
    }),
  });
  add({
    group: '風環境', name: '低風速平坦低地', threshold: '風速 <3 m/s 且海拔 <80 m、坡度 <5%',
    ...(stagnantLowland === null ? na(ws === null ? noWx : noElev) : {
      value: stagnantLowland ? '是' : '否',
      ...(stagnantLowland ? hit('中', '通風可能不良，熱與汙染物易滯留') : pass()),
    }),
  });

  // ── 日照 ──
  const ph = m.peakSunHours;
  add({
    group: '日照', name: '峰值日照', threshold: '<3.2 h/d 偏低 · <2.5 h/d 不足',
    ...(ph === null ? na('PVGIS 查詢失敗') : {
      value: `${f1(ph)} h/d`,
      ...(ph < 2.5 ? hit('中', '日照不足，喜陽植栽生長受限')
        : ph < 3.2 ? hit('低', '日照偏低，喜陽植栽表現受影響')
        : pass()),
    }),
  });

  // ── 空氣 ──
  const pm = m.pm25;
  const pmSource = m._sources.airQuality === 'epa' ? '環境部測站' : 'Open-Meteo CAMS 模式值，非測站觀測';
  add({
    group: '空氣', name: 'PM2.5', threshold: '>35 µg/m³ 對敏感族群不健康 · >54 µg/m³ 不健康',
    ...(pm === null ? na('環境部與 Open-Meteo 空品查詢皆失敗') : {
      value: `${f0(pm)} µg/m³${m.aqi !== null ? `（AQI ${f0(m.aqi)}）` : ''}`,
      ...(pm > 54 ? hit('高', `不健康等級（${pmSource}）`)
        : pm > 35 ? hit('中', `對敏感族群不健康等級（${pmSource}）`)
        : pass(pmSource)),
    }),
  });

  // ── 參考資訊（不判定，供分析使用）──
  add({
    group: '綜合', name: '微氣候分區', threshold: '—',
    ...(l.zoning === null
      ? na('需要日照、氣象與高程資料')
      : { value: l.zoning.category, status: 'info' as const, note: `依據：${l.zoning.basis}` }),
  });
  add({
    group: '能源', name: '太陽能潛力', threshold: '峰值日照 ≥4 h/d',
    ...(ph === null || m.annualIrradiance === null ? na('PVGIS 查詢失敗') : {
      value: `斜面年日射量 ${f0(m.annualIrradiance)} kWh/m²`,
      status: 'info' as const,
      note: ph >= 4 ? `具設置潛力，PVGIS 最佳傾角 ${m.recommendedTilt}°` : '日照有限，設置效益偏低',
    }),
  });
  add({
    group: '法規', name: '土地使用分區', threshold: '—',
    value: l.landUseZone,
    status: l._sources.zoning === 'none' ? 'na' : 'info',
    note: l._sources.zoning === 'none'
      ? '國土測繪中心查詢失敗'
      : '依 LUIMAP 色碼判讀；容積率、建蔽率依各都市計畫書規定，本工具不提供推估值',
  });

  return checks;
}

const LEVEL_RANK: Record<RuleLevel, number> = { 高: 0, 中: 1, 低: 2 };
const STATUS_RANK: Record<RuleStatus, number> = { hit: 0, info: 1, pass: 2, na: 3 };

/** Triggered rules first (高 → 低), then reference info, passed, and not evaluated. */
export function sortRuleChecks(checks: RuleCheck[]): RuleCheck[] {
  return [...checks].sort((a, b) =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    (a.level && b.level ? LEVEL_RANK[a.level] - LEVEL_RANK[b.level] : 0) ||
    a.id.localeCompare(b.id));
}

export function ruleStatusLabel(c: RuleCheck): string {
  switch (c.status) {
    case 'hit':  return `觸發（${c.level}）`;
    case 'info': return '參考';
    case 'pass': return '未觸發';
    case 'na':   return '未判讀';
  }
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const show = (v: number | null, digits: number, unit: string) => (v === null ? NO_DATA : `${v.toFixed(digits)}${unit}`);

/** Markdown table of the checks (also used in the exported report). */
export function formatRuleTable(checks: RuleCheck[]): string[] {
  return [
    '| 編號 | 類別 | 項目 | 數值 | 判準 | 結果 | 說明 |',
    '|---|---|---|---|---|---|---|',
    ...checks.map(c =>
      `| ${c.id} | ${c.group} | ${c.name} | ${cell(c.value)} | ${cell(c.threshold)} | ${ruleStatusLabel(c)} | ${cell(c.note ?? '')} |`),
  ];
}

/** Markdown summary + table, ready to paste into an AI chat. */
export function formatRulesForAI(
  checks: RuleCheck[],
  m: MicroClimateData,
  l: LandscapeDesignData,
  point: { lat: number; lng: number } | null,
): string {
  const hits = sortRuleChecks(checks).filter(c => c.status === 'hit');
  const lines = [
    '# 場址規則檢核',
    '',
    ...(point ? [`- 座標：${point.lat.toFixed(5)}°N, ${point.lng.toFixed(5)}°E`] : []),
    `- 土地使用分區：${l.landUseZone}`,
    `- 當下氣象：氣溫 ${show(m.temp, 1, '°C')}、濕度 ${show(m.humidity, 0, '%')}、雨量 ${show(m.rainfall, 1, ' mm')}、風向 ${show(m.windDirection, 0, '°')}`,
    `- 資料來源：氣象 ${src(m._sources.weather)} · 空品 ${src(m._sources.airQuality)} · 日照 ${src(m._sources.solar)} · 高程 ${src(m._sources.elevation)} · 分區 ${src(l._sources.zoning)}`,
    `- 觸發 ${hits.length} 項：${hits.length ? hits.map(c => `${c.name}（${c.level}）`).join('、') : '無'}`,
    '',
    ...formatRuleTable(checks),
  ];
  return lines.join('\n');
}
