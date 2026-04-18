import { format } from 'date-fns';
import { MicroClimateData, LandscapeDesignData, MapSettings } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function srcLabel(src: string): string {
  return src === 'fallback' ? '⚠ 估算值' : '✓ 即時 API';
}

function windDir(deg: number): string {
  return ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round(deg / 45) % 8];
}

// ─── Markdown / Plain-Text Generator ─────────────────────────────────────────

export function buildReportMd(
  micro: MicroClimateData,
  landscape: LandscapeDesignData,
  settings: MapSettings
): string {
  const base = settings.selectedBase;
  const ts   = format(settings.currentTime, 'yyyy-MM-dd HH:mm');

  const lines: string[] = [];

  lines.push(`# 🌍 LandWeaver AI — 景觀地理分析報告`);
  lines.push(``);
  lines.push(`> 產出時間：${ts}`);
  lines.push(``);

  // 1. 基地資訊
  lines.push(`## 一、基地資訊`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 基地名稱 | ${base?.name ?? '--'} |`);
  lines.push(`| 座標 | 北緯 ${base?.lat.toFixed(4)}°，東經 ${base?.lng.toFixed(4)}° |`);
  lines.push(`| 行政區 / 都市計畫分區 | ${landscape.landUseZone} |`);
  lines.push(`| 地面高程 (DEM) | ${micro.elevation.toFixed(1)} m　${srcLabel(micro._sources.elevation)} |`);
  lines.push(`| 地表坡度 | ${micro.slopePct.toFixed(1)} % |`);
  lines.push(`| 坡向 | ${micro.aspectDir}（${micro.aspectDeg.toFixed(0)}°）|`);
  lines.push(`| 地表排水係數 (C) | ${micro.drainageCoeff.toFixed(2)} |`);
  lines.push(``);

  // 2. 即時氣象
  lines.push(`## 二、即時氣象　${srcLabel(micro._sources.weather)}`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 氣溫 | ${micro.temp.toFixed(1)} °C |`);
  lines.push(`| 相對濕度 | ${micro.humidity.toFixed(0)} % |`);
  lines.push(`| 風速 / 風向 | ${micro.windSpeed.toFixed(1)} m/s　${windDir(micro.windDirection)}（${micro.windDirection.toFixed(0)}°）|`);
  lines.push(`| 即時降雨量 | ${micro.rainfall.toFixed(1)} mm |`);
  lines.push(``);

  // 3. 空氣品質
  lines.push(`## 三、空氣品質　${srcLabel(micro._sources.airQuality)}`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| PM2.5 | ${micro.pm25.toFixed(0)} µg/m³ |`);
  lines.push(`| AQI | ${micro.aqi.toFixed(0)} |`);
  lines.push(``);

  // 4. 日照分析
  lines.push(`## 四、日照分析　${srcLabel(micro._sources.solar)}`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 當前太陽高度角 | ${micro.solarAltitude.toFixed(1)}° |`);
  lines.push(`| 當前太陽方位角 | ${micro.solarAzimuth.toFixed(1)}° |`);
  lines.push(`| 當前遮蔭覆蓋率 | ${micro.shadowCoverage.toFixed(1)} % |`);
  lines.push(`| 年峰值日照時數 | ${micro.peakSunHours.toFixed(1)} h/d |`);
  lines.push(`| 年輻射量 | ${micro.annualIrradiance.toFixed(0)} kWh/m² |`);
  lines.push(`| 建議太陽能板傾角 | ${micro.recommendedTilt}° |`);
  lines.push(`| 夏至遮蔭 / 冬至遮蔭 / 春秋分 | ${landscape.seasonalSun.summerSolstice.toFixed(0)}% / ${landscape.seasonalSun.winterSolstice.toFixed(0)}% / ${landscape.seasonalSun.equinox.toFixed(0)}% |`);
  lines.push(``);

  // 5. 微氣候分區
  lines.push(`## 五、微氣候空間分區`);
  lines.push(``);
  lines.push(`- **分區類型**：${landscape.zoning.category}`);
  lines.push(`- **特徵強度**：${(landscape.zoning.intensity * 10).toFixed(1)} / 10`);
  lines.push(``);
  lines.push(`**環境特質：**`);
  lines.push(``);
  lines.push(`| 日照 | 溫度 | 風場 | 濕度 |`);
  lines.push(`|------|------|------|------|`);
  lines.push(`| ${landscape.aiSummary.traits.sun} | ${landscape.aiSummary.traits.temp} | ${landscape.aiSummary.traits.wind} | ${landscape.aiSummary.traits.water} |`);
  lines.push(``);

  // 6. 土壤與水文
  lines.push(`## 六、土壤滲透與水文分析`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 土壤滲透率 | ${landscape.soil.infiltrationRate.toFixed(1)} mm/hr |`);
  lines.push(`| 排水速度 | ${landscape.soil.drainageSpeed} |`);
  lines.push(`| 積水風險 | ${landscape.soil.waterloggingRisk} |`);
  lines.push(`| 主集水範圍 | ${landscape.hydrology.catchmentArea.toFixed(0)} m² |`);
  lines.push(`| 暴雨積水深度 | ${landscape.hydrology.pondingDepth.toFixed(0)} mm |`);
  lines.push(`| 地表逕流方向 | ${landscape.hydrology.flowDirection.toFixed(0)}° |`);
  lines.push(``);

  // 7. 都市環境干擾
  lines.push(`## 七、都市環境干擾（Urban Stress）`);
  lines.push(``);
  lines.push(`| 項目 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 地表材質熱指數 | ${(landscape.urbanStress.surfaceHeatIndex * 100).toFixed(0)} % |`);
  lines.push(`| 地表反照率 (Albedo) | ${landscape.urbanStress.albedo.toFixed(2)} |`);
  lines.push(`| 推估地表溫度 | ${landscape.urbanStress.surfaceTemp.toFixed(1)} °C |`);
  lines.push(`| 街谷風效應 | ${landscape.urbanStress.canyonEffect ? '⚠ 偵測到' : '✓ 正常'} |`);
  lines.push(`| 高壓風切風險 | ${landscape.urbanStress.downdraftRisk ? '⚠ 有風險' : '✓ 穩定'} |`);
  lines.push(``);

  // 8. AI 植栽建議
  lines.push(`## 八、AI 植栽決策建議`);
  lines.push(``);

  const trees   = landscape.recommendations.topPlants.filter(p => p.type === '喬木');
  const shrubs  = landscape.recommendations.topPlants.filter(p => p.type === '灌木');
  const ground  = landscape.recommendations.topPlants.filter(p => p.type === '地被');

  if (trees.length) {
    lines.push(`### 建議喬木`);
    trees.forEach(p => lines.push(`- ${p.name}（適合度 ${p.score}%）`));
    lines.push(``);
  }
  if (shrubs.length) {
    lines.push(`### 建議灌木`);
    shrubs.forEach(p => lines.push(`- ${p.name}（適合度 ${p.score}%）`));
    lines.push(``);
  }
  if (ground.length) {
    lines.push(`### 建議地被`);
    ground.forEach(p => lines.push(`- ${p.name}（適合度 ${p.score}%）`));
    lines.push(``);
  }

  if (landscape.recommendations.avoidPlants.length) {
    lines.push(`### ⚠ 避免種植`);
    landscape.recommendations.avoidPlants.forEach(a =>
      lines.push(`- **${a.name}**：${a.reason}`)
    );
    lines.push(``);
  }

  if (landscape.recommendations.designSuggestions.length) {
    lines.push(`### 設計建議`);
    landscape.recommendations.designSuggestions.forEach(s => lines.push(`- ${s}`));
    lines.push(``);
  }

  if (landscape.recommendations.riskWarnings.length) {
    lines.push(`### 風險警示`);
    landscape.recommendations.riskWarnings.forEach(w => lines.push(`- ⚠ ${w}`));
    lines.push(``);
  }

  // 9. 資料來源
  lines.push(`## 九、資料來源`);
  lines.push(``);
  lines.push(`| 資料項目 | 來源 |`);
  lines.push(`|---------|------|`);
  lines.push(`| 氣象 | ${micro._sources.weather === 'cwa' ? '中央氣象署 CWA 即時觀測站' : '台灣年均估算值'} |`);
  lines.push(`| 空氣品質 | ${micro._sources.airQuality === 'epa' ? '環境部 EPA 空品測站' : '中等估算值'} |`);
  lines.push(`| 太陽能輻射 | ${micro._sources.solar === 'pvgis' ? 'EU PVGIS 太陽能資料庫' : '台灣年均估算值'} |`);
  lines.push(`| 高程 / 地形 | ${micro._sources.elevation === 'openElevation' ? 'Open-Elevation DEM API' : '平坦地形估算值'} |`);
  lines.push(`| 行政區 | ${landscape._sources.admin === 'nlsc' ? '國土測繪中心 NLSC' : '查詢失敗'} |`);
  lines.push(`| 都市計畫分區 | ${landscape._sources.zoning === 'nlscWfs' ? '國土測繪中心 WFS' : '查詢失敗'} |`);
  lines.push(`| 太陽角度 | 天文公式即時計算 |`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Generated by LandWeaver AI · ${ts}*`);

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
    .replace(/\*Generated by.*\*/, `<em>Generated by LandWeaver AI · ${ts}</em>`);

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
