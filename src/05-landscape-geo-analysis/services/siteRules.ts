/**
 * Site rule checklist — no AI / API calls.
 *
 * Each rule compares one value of the clicked point's site data with a fixed
 * threshold and reports whether it triggers. The panel lists the results, and
 * `formatRulesForAI` turns them into a Markdown table the user can paste into
 * any AI chat for the actual design analysis.
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

const f0 = (n: number) => n.toFixed(0);
const f1 = (n: number) => n.toFixed(1);
const est = (source: string) => (source === 'fallback' ? '（估算）' : '');

const CURVATURE_EPS = 1e-5; // m⁻¹; smaller magnitudes count as flat

export function evaluateSiteRules(m: MicroClimateData, l: LandscapeDesignData): RuleCheck[] {
  const checks: RuleCheck[] = [];
  const add = (c: Omit<RuleCheck, 'id'>) =>
    checks.push({ id: `R${String(checks.length + 1).padStart(2, '0')}`, ...c });

  const wx = est(m._sources.weather);
  const elev = est(m._sources.elevation);
  const sun = est(m._sources.solar);
  const { category, intensity } = l.zoning;
  const { surfaceTemp, canyonEffect, downdraftRisk } = l.urbanStress;
  const { waterloggingRisk, infiltrationRate, drainageSpeed } = l.soil;

  // ── 地形 ──
  add({
    group: '地形', name: '坡度',
    value: `${f1(m.slopePct)}%（${m.aspectDir}向）${elev}`,
    threshold: '≥15% 坡地 · ≥30% 陡坡',
    ...(m.slopePct >= 30 ? hit('高', '陡坡：表土沖蝕、邊坡滑動風險')
      : m.slopePct >= 15 ? hit('中', '坡地：降雨逕流集中、坡面易沖蝕')
      : pass()),
  });

  const curv = m.planCurvature;
  const curvLabel = curv > CURVATURE_EPS ? '凹地' : curv < -CURVATURE_EPS ? '凸地' : '平直';
  add({
    group: '地形', name: '地表曲率',
    value: `${curvLabel}（${curv.toExponential(1)} m⁻¹）${elev}`,
    threshold: '> 0 為聚水凹地',
    ...(curvLabel === '凹地' ? hit('低', '凹地：周邊地表逕流向基地匯集') : pass()),
  });

  add({
    group: '地形', name: '海拔',
    value: `${f0(m.elevation)} m${elev}`,
    threshold: '≥500 m 中海拔',
    ...(m.elevation >= 500
      ? hit('低', `均溫較平地低約 ${f1(m.elevation * 0.006)}°C（遞減率 0.6°C/100 m），留意寒害`)
      : pass()),
  });

  // ── 水文 ──
  const ponding = l.hydrology.pondingDepth > 0 ? `，暴雨積水深約 ${f0(l.hydrology.pondingDepth)} mm` : '';
  add({
    group: '水文', name: '積水風險',
    value: `${waterloggingRisk}（入滲 ${f0(infiltrationRate)} mm/hr）`,
    threshold: '風險 中／高',
    ...(waterloggingRisk === '高' ? hit('高', `排水${drainageSpeed}${ponding}，強降雨易滯水`)
      : waterloggingRisk === '中' ? hit('中', `排水${drainageSpeed}${ponding}，強降雨時可能滯水`)
      : pass(`排水${drainageSpeed}`)),
  });

  // ── 熱環境 ──
  add({
    group: '熱環境', name: '地表溫度',
    value: `${f1(surfaceTemp)}°C${wx}`,
    threshold: '>35°C 高溫 · >40°C 酷熱',
    ...(surfaceTemp > 40 ? hit('高', '鋪面強烈蓄熱，戶外熱不適')
      : surfaceTemp > 35 ? hit('中', '鋪面蓄熱，夏季戶外熱不適')
      : pass()),
  });

  // ── 風環境 ──
  add({
    group: '風環境', name: '平均風速',
    value: `${f1(m.windSpeed)} m/s${wx}`,
    threshold: '≥5 m/s 強風',
    ...(m.windSpeed >= 5 ? hit('中', '淺根植栽易倒伏、蒸散失水快') : pass()),
  });
  add({
    group: '風環境', name: '坡地下衝風',
    value: downdraftRisk ? '有' : '無',
    threshold: '風速 >5 m/s 且坡度 >10%',
    ...(downdraftRisk ? hit('中', '強風沿坡下衝，行人舒適與植栽穩定受影響') : pass()),
  });
  add({
    group: '風環境', name: '街谷效應',
    value: canyonEffect ? '有' : '無',
    threshold: '風速 <3 m/s 的平坦低地（海拔 <80 m、坡度 <5%）',
    ...(canyonEffect ? hit('中', '通風不良，熱與汙染物滯留') : pass()),
  });

  // ── 日照 ──
  const ph = m.peakSunHours;
  add({
    group: '日照', name: '日照峰值',
    value: `${f1(ph)} h/d${sun}`,
    threshold: '<3.2 h/d 偏低 · <2.5 h/d 不足',
    ...(ph < 2.5 ? hit('中', '日照不足，喜陽植栽生長受限')
      : ph < 3.2 ? hit('低', '日照偏低，喜陽植栽表現受影響')
      : pass()),
  });

  // ── 空氣（估算值不判讀）──
  if (m._sources.airQuality === 'fallback') {
    add({
      group: '空氣', name: 'PM2.5', value: '無即時資料', threshold: '>35 µg/m³',
      status: 'na', note: '無環境部即時測站資料，估算值不判讀',
    });
  } else {
    add({
      group: '空氣', name: 'PM2.5',
      value: `${f0(m.pm25)} µg/m³（AQI ${f0(m.aqi)}）`,
      threshold: '>35 µg/m³ 敏感族群不健康 · >54 µg/m³ 不健康',
      ...(m.pm25 > 54 ? hit('高', 'AQI 不健康等級')
        : m.pm25 > 35 ? hit('中', 'AQI 對敏感族群不健康等級')
        : pass()),
    });
  }

  // ── 參考資訊（不判定，供分析使用）──
  add({
    group: '綜合', name: '微氣候分區',
    value: `${category}（強度 ${f1(intensity * 10)}/10）`,
    threshold: '—', status: 'info',
    note: '依日照、風速、氣溫、雨量與排水綜合分類',
  });
  add({
    group: '能源', name: '太陽能潛力',
    value: `年輻射 ${f0(m.annualIrradiance)} kWh/m²${sun}`,
    threshold: '日照峰值 ≥4 h/d',
    status: 'info',
    note: ph >= 4 ? `具設置潛力，建議傾角約 ${m.recommendedTilt}°` : '日照有限，設置效益偏低',
  });

  const { far, bcr, note } = l.zoningRegulation;
  add({
    group: '法規', name: '土地使用分區',
    value: `${l.landUseZone}${est(l._sources.zoning)}`,
    threshold: '—', status: 'info',
    note: bcr !== null
      ? `建蔽率 ${bcr}%、容積率 ${far ?? '—'}%（${note}），法定空地至少約 ${100 - bcr}%`
      : note,
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

const SOURCE_LABEL: Record<string, string> = {
  openMeteo: 'Open-Meteo', cwa: '中央氣象署', epa: '環境部', pvgis: 'PVGIS',
  openElevation: 'Open-Elevation', nlscWms: '國土測繪中心', nlscWfs: '國土測繪中心', fallback: '估算值',
};
const src = (s: string) => SOURCE_LABEL[s] ?? s;
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

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
    `- 當下氣象：氣溫 ${f1(m.temp)}°C、濕度 ${f0(m.humidity)}%、雨量 ${f1(m.rainfall)} mm、風向 ${f0(m.windDirection)}°`,
    `- 資料來源：氣象 ${src(m._sources.weather)} · 空品 ${src(m._sources.airQuality)} · 日照 ${src(m._sources.solar)} · 高程 ${src(m._sources.elevation)} · 分區 ${src(l._sources.zoning)}`,
    `- 觸發 ${hits.length} 項：${hits.length ? hits.map(c => `${c.name}（${c.level}）`).join('、') : '無'}`,
    '',
    '| 編號 | 類別 | 項目 | 數值 | 判準 | 結果 | 說明 |',
    '|---|---|---|---|---|---|---|',
    ...checks.map(c =>
      `| ${c.id} | ${c.group} | ${c.name} | ${cell(c.value)} | ${cell(c.threshold)} | ${ruleStatusLabel(c)} | ${cell(c.note ?? '')} |`),
  ];
  return lines.join('\n');
}
