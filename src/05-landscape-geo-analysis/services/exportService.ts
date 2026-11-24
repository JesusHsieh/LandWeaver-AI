import { format } from 'date-fns';
import { MicroClimateData, LandscapeDesignData, MapSettings } from '../types';
import { evaluateSiteRules, formatRuleTable } from './siteRules';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NO_DATA = '無資料';
const fmt = (v: number | null, digits: number, unit = '') => (v === null ? NO_DATA : `${v.toFixed(digits)}${unit}`);
const yesNo = (v: boolean | null) => (v === null ? NO_DATA : v ? '是' : '否');
const compassZh = (deg: number) => ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round(deg / 45) % 8];

const WEATHER_SRC = { openMeteo: 'Open-Meteo 格點即時資料', cwa: '中央氣象署最近測站', none: '查詢失敗' };
const AIR_SRC     = { epa: '環境部最近測站', openMeteo: 'Open-Meteo CAMS 模式值（非測站觀測）', none: '查詢失敗' };
const SOLAR_SRC   = { pvgis: 'EU PVGIS-ERA5（最佳傾角斜面日射量）', none: '查詢失敗' };
const ELEV_SRC    = { openElevation: 'Open-Elevation DEM（5 點差分）', none: '查詢失敗' };

// ─── Markdown / Plain-Text Generator ─────────────────────────────────────────

export function buildReportMd(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
): string {
  const point = settings.analysisPoint ?? settings.selectedBase;
  const ts    = format(settings.currentTime, 'yyyy-MM-dd HH:mm');
  const { drainage, urbanStress, zoning, recommendations: rec } = landscape;

  const lines: string[] = [];
  const table = (rows: [string, string][]) => {
    lines.push(`| 項目 | 數值 |`, `|------|------|`, ...rows.map(([k, v]) => `| ${k} | ${v} |`), ``);
  };

  lines.push(`# 🌍 LandWeaver — 景觀地理分析報告`, ``);
  lines.push(`> 產出時間：${ts}　·　所有數值皆來自下列資料來源或標準公式；查詢失敗的項目標示「${NO_DATA}」，不以估算值代替。`, ``);

  // 1. 基地資訊
  lines.push(`## 一、基地資訊`, ``);
  table([
    ['座標', point ? `北緯 ${point.lat.toFixed(5)}°，東經 ${point.lng.toFixed(5)}°` : NO_DATA],
    ['行政區 / 都市計畫分區', landscape.landUseZone],
    ['容積率 / 建蔽率', '依各都市計畫書規定（本工具不提供推估值）'],
    ['地面高程 (DEM)', fmt(micro.elevation, 1, ' m')],
    ['地表坡度', fmt(micro.slopePct, 1, ' %')],
    ['坡向（下坡方向）', micro.aspectDeg === null ? (micro.aspectDir ?? NO_DATA) : `${micro.aspectDir}（${micro.aspectDeg.toFixed(0)}°）`],
  ]);

  // 2. 即時氣象
  lines.push(`## 二、即時氣象`, ``);
  table([
    ['氣溫', fmt(micro.temp, 1, ' °C')],
    ['相對濕度', fmt(micro.humidity, 0, ' %')],
    ['風速 / 風向', micro.windSpeed === null ? NO_DATA
      : `${micro.windSpeed.toFixed(1)} m/s${micro.windDirection === null ? '' : `　${compassZh(micro.windDirection)}（${micro.windDirection.toFixed(0)}°）`}`],
    ['即時降雨量', fmt(micro.rainfall, 1, ' mm')],
    ['地表溫度（0 cm，模式值）', fmt(micro.surfaceTemp, 1, ' °C')],
  ]);

  // 3. 空氣品質
  lines.push(`## 三、空氣品質`, ``);
  table([
    ['PM2.5', fmt(micro.pm25, 0, ' µg/m³')],
    ['AQI', micro.aqi === null ? '僅環境部測站提供' : micro.aqi.toFixed(0)],
  ]);

  // 4. 日照分析
  lines.push(`## 四、日照分析`, ``);
  table([
    ['當前太陽高度角', `${micro.solarAltitude.toFixed(1)}°`],
    ['當前太陽方位角', `${micro.solarAzimuth.toFixed(1)}°`],
    ['峰值日照時數', fmt(micro.peakSunHours, 1, ' h/d')],
    ['斜面年日射量', fmt(micro.annualIrradiance, 0, ' kWh/m²')],
    ['PVGIS 最佳傾角', fmt(micro.recommendedTilt, 0, '°')],
    ...landscape.seasonalSun.map(s =>
      [`${s.label}正午太陽高度角 / 晝長`, `${s.noonAltitude.toFixed(1)}° / ${s.dayLength.toFixed(1)} h`] as [string, string]),
  ]);

  // 5. 地形、排水與風環境（規則判讀）
  lines.push(`## 五、地形、排水與風環境（規則判讀）`, ``);
  table([
    ['微氣候分區', zoning ? `${zoning.category}（依據：${zoning.basis}）` : NO_DATA],
    ['地表排水（依坡度：>20% 快、>5% 中、其餘慢）', drainage.speed ?? NO_DATA],
    ['積水風險', drainage.waterloggingRisk ?? NO_DATA],
    ['地表逕流方向（下坡方向）', drainage.flowDirection !== null
      ? `往${compassZh(drainage.flowDirection)}（${drainage.flowDirection.toFixed(0)}°）`
      : micro.slopePct === null ? NO_DATA : '平坦，無明顯方向'],
    ['強風坡地（風速 >5 m/s 且坡度 >10%）', yesNo(urbanStress.windySlope)],
    ['低風速平坦低地（風速 <3 m/s、海拔 <80 m、坡度 <5%）', yesNo(urbanStress.stagnantLowland)],
  ]);

  // 6. 場址規則檢核
  const checks = evaluateSiteRules(micro, landscape);
  lines.push(`## 六、場址規則檢核`, ``, ...formatRuleTable(checks), ``);

  // 7. 植栽建議（規則篩選）
  lines.push(`## 七、植栽建議（規則篩選，非 AI）`, ``);
  const t = landscape.traits;
  lines.push(`環境等級：日照 ${t.sun ?? NO_DATA}、溫度 ${t.temp ?? NO_DATA}、風場 ${t.wind ?? NO_DATA}、濕度 ${t.water ?? NO_DATA}`, ``);
  for (const type of ['喬木', '灌木', '地被'] as const) {
    const plants = rec.plants.filter(p => p.type === type);
    if (!plants.length) continue;
    lines.push(`### 建議${type}`);
    plants.forEach(p => lines.push(`- ${p.name}（符合：${p.reasons.join('、')}）`));
    lines.push(``);
  }
  if (!rec.plants.length) lines.push(`- 沒有符合條件的植栽（或資料不足）`, ``);
  if (rec.avoidPlants.length) {
    lines.push(`### ⚠ 避免種植`);
    rec.avoidPlants.forEach(a => lines.push(`- **${a.name}**：${a.reason}`));
    lines.push(``);
  }
  if (rec.designSuggestions.length) {
    lines.push(`### 設計建議`);
    rec.designSuggestions.forEach(s => lines.push(`- ${s}`));
    lines.push(``);
  }
  if (rec.riskWarnings.length) {
    lines.push(`### 風險警示`);
    rec.riskWarnings.forEach(w => lines.push(`- ⚠ ${w}`));
    lines.push(``);
  }

  // 8. 資料來源
  lines.push(`## 八、資料來源`, ``);
  lines.push(`| 資料項目 | 來源 |`, `|---------|------|`);
  lines.push(`| 氣象 | ${WEATHER_SRC[micro._sources.weather]} |`);
  lines.push(`| 空氣品質 | ${AIR_SRC[micro._sources.airQuality]} |`);
  lines.push(`| 日照 | ${SOLAR_SRC[micro._sources.solar]} |`);
  lines.push(`| 高程 / 地形 | ${ELEV_SRC[micro._sources.elevation]} |`);
  lines.push(`| 行政區 | ${landscape._sources.admin === 'nlsc' ? '國土測繪中心 TownVillagePointQuery' : '查詢失敗'} |`);
  lines.push(`| 都市計畫分區 | ${landscape._sources.zoning === 'nlscWms' ? '國土測繪中心 LUIMAP（圖層色碼判讀）' : '查詢失敗'} |`);
  lines.push(`| 太陽角度、晝長 | 天文公式 |`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Generated by LandWeaver · ${ts}*`);

  return lines.join('\n');
}

// ─── Plain Text ───────────────────────────────────────────────────────────────

export function buildReportTxt(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
): string {
  // Strip markdown syntax from the MD version
  return buildReportMd(micro, landscape, settings)
    .replace(/^#{1,6}\s+/gm, '')        // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/^\|.+\|$/gm, l =>         // tables → aligned text
      l.replace(/\|/g, '  ').replace(/\s{3,}/g, '  ').trimEnd()
    )
    .replace(/^---+$/gm, '─'.repeat(48))
    .replace(/^>\s+/gm, '  ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

// ─── Download Helpers ─────────────────────────────────────────────────────────

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMd(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
) {
  const ts = format(settings.currentTime, 'yyyyMMdd_HHmm');
  download(buildReportMd(micro, landscape, settings), `LandWeaver_${ts}.md`, 'text/markdown');
}

export function exportTxt(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
) {
  const ts = format(settings.currentTime, 'yyyyMMdd_HHmm');
  download(buildReportTxt(micro, landscape, settings), `LandWeaver_${ts}.txt`, 'text/plain');
}

// ─── PDF (browser print dialog) ───────────────────────────────────────────────

export function exportPdf(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
) {
  const md  = buildReportMd(micro, landscape, settings);
  const ts  = format(settings.currentTime, 'yyyy-MM-dd HH:mm');
  const base = settings.selectedBase;

  // Convert MD to basic HTML for print
  const html = md
    .replace(/^# (.+)$/m,   '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr/>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, m => `<table>${m}</table>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\*Generated by.*\*/, `<em>Generated by LandWeaver · ${ts}</em>`);

  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>LandWeaver 分析報告 — ${base?.name ?? ''} ${ts}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
      font-size: 12px; line-height: 1.7; color: #1a1a1a;
      padding: 32px 48px; max-width: 860px; margin: 0 auto;
    }
    h1 { font-size: 20px; color: #1f3f21; border-bottom: 2px solid #2d6330; padding-bottom: 8px; margin: 24px 0 12px; }
    h2 { font-size: 15px; color: #2d6330; border-left: 4px solid #62a062; padding-left: 8px; margin: 20px 0 8px; }
    h3 { font-size: 13px; color: #3d7d3d; margin: 14px 0 6px; }
    p  { margin: 6px 0; }
    ul { margin: 6px 0 6px 20px; }
    li { margin: 2px 0; }
    blockquote { color: #555; border-left: 3px solid #ccc; padding-left: 10px; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
    td, th { border: 1px solid #d4e4d4; padding: 5px 8px; }
    tr:nth-child(even) { background: #f4faf4; }
    tr:first-child td { background: #e0ede0; font-weight: 600; }
    hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
    em { color: #888; font-size: 10px; }
    strong { color: #1f3f21; }
    @media print {
      body { padding: 16px; }
      h2 { page-break-before: auto; }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`);

  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}
