// ============================================================
// NLSC API clients — TownVillagePointQuery, WMS LUIMAP pixel check
// ============================================================

import { withTimeout } from '../../utils/withTimeout';

export interface AdminResult {
  county: string; town: string; village: string; sectName: string;
}

// ============================================================
// API 5：NLSC 國土測繪中心 — 行政區 / 地籍查詢
// 端點：TownVillagePointQuery（公開，無需 Key，回傳 XML）
// 文件：https://api.nlsc.gov.tw/other/TownVillagePointQuery/{X}/{Y}/{CoordinateTypeCode}
// ============================================================
export async function fetchNLSCTownVillage(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AdminResult> {
  // Vite proxy: /nlsc-api → https://api.nlsc.gov.tw
  const res = await fetch(
    `/nlsc-api/other/TownVillagePointQuery/${lng}/${lat}/4326`,
    { signal: withTimeout(signal, 6000) },
  );
  if (!res.ok) throw new Error(`NLSC 地籍 API 錯誤：${res.status}`);
  const text = await res.text();
  const xml  = new DOMParser().parseFromString(text, 'text/xml');
  if (xml.querySelector('error')) throw new Error('查無地籍資料（非都市計畫區或海域）');
  const get = (tag: string) => xml.querySelector(tag)?.textContent ?? '';
  return {
    county:   get('ctyName')     || '未知縣市',
    town:     get('townName')    || '未知鄉鎮',
    village:  get('villageName') || '',
    sectName: get('sectName')    || '',
  };
}

// ============================================================
// API 6：NLSC WFS — 都市計畫使用分區（透過 Vite proxy 解決 CORS）
// ============================================================

// NLSC LUIMAP sampled pixel colours → zone name
// Sampled from known locations: 大安住宅/信義商業/林口工業/台大學校/大安森林公園/苗栗農業/山區非都市
const LUIMAP_COLORS: [number, number, number, string][] = [
  [227, 180,  39, '住宅區'],
  [247, 186,  71, '住宅區'],
  [216,  13,  63, '商業區'],
  [209, 152,  84, '工業區'],
  [223, 176,  88, '工業區'],
  [134, 171,  85, '農業區'],
  [147, 255,  47, '公園用地'],
  [209, 101, 235, '學校用地'],
  [ 56, 168,   0, '非都市計畫區'],
];

function nearestZoneByColor(r: number, g: number, b: number, a: number): { zone: string; dist: number } | null {
  if (a < 10) return null;
  let bestDist = Infinity, bestZone = '計畫分區';
  for (const [zr, zg, zb, zone] of LUIMAP_COLORS) {
    const dist = Math.sqrt((r - zr) ** 2 + (g - zg) ** 2 + (b - zb) ** 2);
    if (dist < bestDist) { bestDist = dist; bestZone = zone; }
  }
  return bestDist < 70 ? { zone: bestZone, dist: bestDist } : null;
}

/**
 * 都市計畫分區：NLSC WMS GetFeatureInfo 不支援（回傳 Capabilities XML），
 * 改取基地周圍約 20 m 的 LUIMAP 圖塊，讀像素 RGB 比對已知分區色碼。
 * 查詢失敗時拋出錯誤（由呼叫端標示「查詢失敗」），不回傳猜測的分區。
 */
export async function fetchUrbanPlanningZone(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string> {
  // Vite proxy: /nlsc-wms → https://wms.nlsc.gov.tw/wms
  const d = 0.00018; // ~20m radius，避免取樣範圍跨越不同分區
  const size = 9;
  const center = Math.floor(size / 2);
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap',
    LAYERS: 'LUIMAP', STYLES: '', SRS: 'EPSG:4326',
    BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    WIDTH: String(size), HEIGHT: String(size),
    FORMAT: 'image/png', TRANSPARENT: 'true',
  });
  const res = await fetch(`/nlsc-wms?${params}`, { signal: withTimeout(signal, 6000) });
  if (!res.ok) throw new Error(`NLSC WMS ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error(`NLSC WMS 回傳非圖片（${blob.type || '未知格式'}）`);

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, size, size).data;

  const zoneScores = new Map<string, number>();
  let opaque = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
      if (a >= 10) opaque++;
      const match = nearestZoneByColor(r, g, b, a);
      if (!match) continue;
      const distFromCenter = Math.hypot(x - center, y - center);
      const weight = Math.max(0.2, size - distFromCenter) / (1 + match.dist);
      zoneScores.set(match.zone, (zoneScores.get(match.zone) ?? 0) + weight);
    }
  }
  const best = [...zoneScores.entries()].sort((a, b) => b[1] - a[1])[0];
  if (best) return best[0];
  // 沒有任何分區色塊 = LUIMAP 在此無資料（都市計畫區外）；有色塊但色碼未建檔則照實標示
  return opaque ? '其他分區（色碼未建檔）' : '非都市計畫區';
}
