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

export async function fetchUrbanPlanningZone(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string> {
  // NLSC WMS GetFeatureInfo 回傳 Capabilities XML（不支援）
  // 改用 WMS GetMap 小範圍高解析圖，讀中心附近像素 RGB → 比對 LUIMAP 色碼對應分區
  // Vite proxy: /nlsc-wms → https://wms.nlsc.gov.tw/wms
  try {
    const d = 0.00018; // ~20m radius，避免 100m+ 取樣範圍跨越不同分區
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
    if (!res.ok) throw new Error(`WMS ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const zoneScores = new Map<string, number>();
          for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
              const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
              const match = nearestZoneByColor(r, g, b, a);
              if (!match) continue;
              const distFromCenter = Math.hypot(x - center, y - center);
              const weight = Math.max(0.2, size - distFromCenter) / (1 + match.dist);
              zoneScores.set(match.zone, (zoneScores.get(match.zone) ?? 0) + weight);
            }
          }
          const best = [...zoneScores.entries()].sort((a, b) => b[1] - a[1])[0];
          resolve(best?.[0] ?? '非都市計畫區');
        } catch {
          resolve('非都市計畫區');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve('非都市計畫區'); };
      img.src = objectUrl;
    });
  } catch {
    return '非都市計畫區';
  }
}
