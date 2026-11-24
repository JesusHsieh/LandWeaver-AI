import { FloodScenario, Level } from '../../types';
import { withTimeout } from '../../utils/withTimeout';

// 水利署 GIC WMS：由瀏覽器直連（伺服器有 CORS 標頭；WRA 防火牆擋 Vercel 機房 IP，不能走 /api/proxy）
const WRA_WMS = 'https://maps.wra.gov.tw/arcgis/services/WMS/GIC_WMS/MapServer/WMSServer';
// 地質調查及礦業管理中心 MapGuide WMS（Vite / Vercel 代理 /cgs-wms）
const CGS_WMS = '/cgs-wms/mapguide/mapagent/mapagent.fcgi';

/** 水利署淹水潛勢圖的降雨情境：[延時 h, 累積雨量 mm] */
export const FLOOD_SCENARIOS: readonly (readonly [number, number])[] = [
  [6, 150], [6, 250], [6, 350],
  [12, 200], [12, 300], [12, 400],
  [24, 200], [24, 350], [24, 500], [24, 650],
];
export const floodLayerName = (hours: number, rainfall: number) => `flood_${rainfall}mm_${hours}hr`;

/**
 * 淹水潛勢：一次對各降雨情境圖層做 GetFeatureInfo，讀圖徵屬性的淹水深度分級（Class 1–5）。
 * 某情境查無圖徵 = 該點不在淹水潛勢範圍（模擬淹水深未達 0.3 m，或不在模擬範圍）。
 */
export async function fetchFloodPotential(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<FloodScenario[]> {
  const layers = FLOOD_SCENARIOS.map(([h, mm]) => floodLayerName(h, mm)).join(',');
  const d = 0.0002; // 101 px ≈ 45 m，查詢點在正中央
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetFeatureInfo',
    LAYERS: layers, QUERY_LAYERS: layers, STYLES: '', CRS: 'CRS:84',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: '101', HEIGHT: '101', I: '50', J: '50',
    INFO_FORMAT: 'application/geo+json', FEATURE_COUNT: '50',
  });
  const res = await fetch(`${WRA_WMS}?${params}`, { signal: withTimeout(signal, 12000) });
  if (!res.ok) throw new Error(`水利署 WMS ${res.status}`);

  type Feature = { layerName?: string; properties?: Record<string, unknown> };
  let features: Feature[];
  try {
    features = (JSON.parse(await res.text()) as { features?: Feature[] }).features as Feature[];
  } catch {
    throw new Error('水利署 WMS 回傳格式不符');
  }
  if (!Array.isArray(features)) throw new Error('水利署 WMS 回傳格式不符');

  return FLOOD_SCENARIOS.map(([hours, rainfall]) => {
    const name = floodLayerName(hours, rainfall);
    // 同一情境可能回傳相鄰的多個深度多邊形，取最深的一級
    const classes = features
      .filter(f => f.layerName === name)
      .map(f => Number(f.properties?.Class))
      .filter(c => Number.isInteger(c) && c >= 1);
    return { hours, rainfall, floodClass: classes.length ? Math.max(...classes) : null };
  });
}

// ── 地調中心圖層：官方 WMS 不支援 GetFeatureInfo（queryable="0"），改讀基地像素顏色 ──

type Rgba = [number, number, number, number];
const OPAQUE = 30; // alpha 低於此值視為無色塊（反鋸齒殘影）

/** 取基地周圍約 ±11 m、9×9 px 的圖塊，回傳中心像素與其周圍 8 格 */
async function samplePoint(layer: string, lat: number, lng: number, signal?: AbortSignal): Promise<Rgba[]> {
  const size = 9;
  const m = Math.floor(size / 2);
  const d = 0.0001;
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap',
    LAYERS: layer, STYLES: '', SRS: 'EPSG:4326',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: String(size), HEIGHT: String(size),
    FORMAT: 'image/png', TRANSPARENT: 'TRUE',
  });
  const res = await fetch(`${CGS_WMS}?${params}`, { signal: withTimeout(signal, 15000) });
  if (!res.ok) throw new Error(`地調中心 WMS ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error(`地調中心 WMS 回傳非圖片（${blob.type || '未知格式'}）`);

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const data = ctx.getImageData(0, 0, size, size).data;

  const px = (x: number, y: number): Rgba => {
    const i = (y * size + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const out = [px(m, m)];
  for (let y = m - 1; y <= m + 1; y++) {
    for (let x = m - 1; x <= m + 1; x++) if (x !== m || y !== m) out.push(px(x, y));
  }
  return out;
}

/**
 * 依中心像素判讀；中心落在色塊交界（混色）時，改取周圍 8 格可辨識顏色的多數。
 * 'empty' = 中心沒有色塊；'unmatched' = 有色塊但顏色不在圖例中。
 */
function classify<T>(pixels: Rgba[], match: (p: Rgba) => T | null): { value: T } | 'empty' | 'unmatched' {
  const [center, ...around] = pixels;
  if (center[3] < OPAQUE) return 'empty';
  const direct = match(center);
  if (direct !== null) return { value: direct };
  const counts = new Map<T, number>();
  for (const p of around) {
    if (p[3] < OPAQUE) continue;
    const v = match(p);
    if (v !== null) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const best = [...counts].sort((a, b) => b[1] - a[1])[0];
  return best ? { value: best[0] } : 'unmatched';
}

/** 初級土壤液化潛勢圖例：紅 = 高、黃 = 中、綠 = 低（半透明純色） */
const liquefactionColor = ([r, g, b]: Rgba): Level | null => {
  if (b > 80) return null;
  if (r >= 180 && g <= 80) return '高';
  if (r >= 180 && g >= 180) return '中';
  if (r <= 80 && g >= 180) return '低';
  return null;
};

/** 地調中心初級土壤液化潛勢（2021）；不在分級範圍回傳 '未列入' */
export async function fetchLiquefaction(lat: number, lng: number, signal?: AbortSignal): Promise<Level | '未列入'> {
  const result = classify(await samplePoint('WMS/Geomap_Envi_Soil_liquefatcion_2021', lat, lng, signal), liquefactionColor);
  if (result === 'empty') return '未列入';
  if (result === 'unmatched') throw new Error('液化潛勢圖層顏色不在圖例中');
  return result.value;
}

/** 岩屑崩滑潛勢區以單一橘色填色 */
const debrisColor = ([r, g, b]: Rgba): true | null =>
  r >= 200 && g >= 90 && g <= 160 && b <= 100 ? true : null;

/** 地調中心岩屑崩滑潛勢分析圖（2013）：基地是否位於潛勢區 */
export async function fetchDebrisSlide(lat: number, lng: number, signal?: AbortSignal): Promise<boolean> {
  const result = classify(await samplePoint('WMS/Geomap_Envi_DebrisSlide_2013', lat, lng, signal), debrisColor);
  if (result === 'unmatched') throw new Error('岩屑崩滑圖層顏色不在圖例中');
  return result !== 'empty';
}
