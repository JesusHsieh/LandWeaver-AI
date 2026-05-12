// ============================================================
// NLSC API clients — TownVillagePointQuery, WMS LUIMAP pixel check
// ============================================================

export interface AdminResult {
  county: string; town: string; village: string; sectName: string;
}

// ============================================================
// API 5：NLSC 國土測繪中心 — 行政區 / 地籍查詢
// 端點：TownVillagePointQuery（公開，無需 Key，回傳 XML）
// 文件：https://api.nlsc.gov.tw/other/TownVillagePointQuery/{X}/{Y}/{CoordinateTypeCode}
// ============================================================
export async function fetchNLSCTownVillage(lat: number, lng: number): Promise<AdminResult> {
  // Vite proxy: /nlsc-api → https://api.nlsc.gov.tw
  const res = await fetch(`/nlsc-api/other/TownVillagePointQuery/${lng}/${lat}/4326`);
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

function nearestZoneByColor(r: number, g: number, b: number, a: number): string {
  if (a < 10) return '非都市計畫區';
  let bestDist = Infinity, bestZone = '計畫分區';
  for (const [zr, zg, zb, zone] of LUIMAP_COLORS) {
    const dist = Math.sqrt((r - zr) ** 2 + (g - zg) ** 2 + (b - zb) ** 2);
    if (dist < bestDist) { bestDist = dist; bestZone = zone; }
  }
  return bestDist < 70 ? bestZone : '計畫分區';
}

export async function fetchUrbanPlanningZone(lat: number, lng: number): Promise<string> {
  // NLSC WMS GetFeatureInfo 回傳 Capabilities XML（不支援）
  // 改用 WMS GetMap 3×3px，讀中心像素 RGB → 比對 LUIMAP 色碼對應分區
  // Vite proxy: /nlsc-wms → https://wms.nlsc.gov.tw/wms
  try {
    const d = 0.001; // ~111m radius — 精準點位
    const params = new URLSearchParams({
      SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap',
      LAYERS: 'LUIMAP', STYLES: '', SRS: 'EPSG:4326',
      BBOX: `${lng - d},${lat - d},${lng + d},${lat + d}`,
      WIDTH: '3', HEIGHT: '3',
      FORMAT: 'image/png', TRANSPARENT: 'true',
    });
    const res = await fetch(`/nlsc-wms?${params}`);
    if (!res.ok) throw new Error(`WMS ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 3; canvas.height = 3;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const [r, g, b, a] = ctx.getImageData(1, 1, 1, 1).data;
          resolve(nearestZoneByColor(r, g, b, a));
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
