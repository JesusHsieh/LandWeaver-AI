// ============================================================
// 座標輸入解析：WGS84（十進位 / 度分秒）與 TWD97 二度分帶（TM2）
// 純本機換算，不呼叫任何 API。
// ============================================================

/** TWD97 TM2 中央經線：121° 為臺灣本島，119° 為澎湖、金門、馬祖 */
export type Tm2Zone = 121 | 119;

export type ParsedCoord =
  | { kind: 'wgs84'; lat: number; lng: number }
  | { kind: 'twd97'; x: number; y: number; zone: Tm2Zone; lat: number; lng: number }
  | { kind: 'invalid'; reason: string };

/** 全形字轉半形，統一分隔符號 */
function toHalfWidth(s: string): string {
  return s
    .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ')
    .replace(/、/g, ',');
}

const HEMI = /北緯|南緯|東經|西經|[NSEW]/gi;
const hemiAxis = (h: string): 'lat' | 'lng' => (/^(N|S|北|南)/i.test(h) ? 'lat' : 'lng');
const hemiSign = (h: string): 1 | -1 => (/^(S|W|南|西)/i.test(h) ? -1 : 1);

/** 臺灣（含澎金馬）大致範圍，用來提示「多數官方圖資無資料」 */
export function inTaiwan(lat: number, lng: number): boolean {
  return lat >= 21 && lat <= 26.6 && lng >= 117.8 && lng <= 123;
}

/**
 * 解析座標字串。不像座標（含地址文字）時回傳 null，交給地址搜尋；
 * 像座標但數值不合理時回傳 invalid 與原因。
 */
export function parseCoordinates(input: string, zone: Tm2Zone): ParsedCoord | null {
  const s = toHalfWidth(input).trim();
  if (!s) return null;
  return /[°度'′’"″”分秒]/.test(s) ? parseDms(s) : parsePlain(s, zone);
}

// ── 兩個數值：十進位經緯度或 TWD97 X/Y ─────────────────────────────────────
function parsePlain(s: string, zone: Tm2Zone): ParsedCoord | null {
  // 去掉數字、分隔符號與半球標記後若還有其他字，就不是座標
  const residue = s.replace(/[-+]?\d+(?:\.\d+)?/g, '').replace(HEMI, '').replace(/[\s,;/]/g, '');
  if (residue) return null;

  const vals = [...s.matchAll(/[-+]?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
  if (vals.length !== 2) {
    return { kind: 'invalid', reason: '座標需為兩個數值：緯度、經度，或 TWD97 的 X、Y' };
  }
  const hemis = hemispheres(s);
  if (!hemis) return { kind: 'invalid', reason: '半球標記（N/S/E/W）需兩個數值都有' };

  if (vals.every(v => Math.abs(v) <= 180)) {
    return assignLatLng(vals[0], vals[1], hemis[0], hemis[1]);
  }
  if (vals.every(v => Math.abs(v) > 1000) && !hemis[0]) {
    const yIdx = vals.findIndex(v => v >= 2_300_000 && v <= 2_950_000);
    const x = vals[1 - yIdx];
    if (yIdx < 0 || x < -150_000 || x > 600_000) {
      return { kind: 'invalid', reason: 'TWD97 座標超出臺灣範圍（X 約 15–35 萬、Y 約 240–290 萬）' };
    }
    const y = vals[yIdx];
    return { kind: 'twd97', x, y, zone, ...tm2ToWgs84(x, y, zone) };
  }
  return { kind: 'invalid', reason: '無法判斷座標系統：經緯度請用十進位度數，TWD97 請用公尺' };
}

// ── 度分秒：25°02'02"N 121°33'52"E、北緯25度2分2秒 東經121度33分52秒 ──────
function parseDms(s: string): ParsedCoord | null {
  const re = /([-+]?\d+(?:\.\d+)?)\s*[°度]\s*(?:(\d+(?:\.\d+)?)\s*['′’分]\s*)?(?:(\d+(?:\.\d+)?)\s*(?:["″”]|''|秒))?/g;
  const matches = [...s.matchAll(re)];
  const residue = s.replace(re, '').replace(HEMI, '').replace(/[\s,;/]/g, '');
  if (residue) return null;
  if (matches.length !== 2) return { kind: 'invalid', reason: '度分秒格式需包含緯度與經度兩組' };
  const hemis = hemispheres(s);
  if (!hemis) return { kind: 'invalid', reason: '半球標記（N/S/E/W）需兩組都有' };

  const vals: number[] = [];
  for (const m of matches) {
    const d = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    const sec = m[3] ? Number(m[3]) : 0;
    if (min >= 60 || sec >= 60) return { kind: 'invalid', reason: '分、秒需小於 60' };
    const abs = Math.abs(d) + min / 60 + sec / 3600;
    vals.push(d < 0 ? -abs : abs);
  }
  return assignLatLng(vals[0], vals[1], hemis[0], hemis[1]);
}

/**
 * 半球標記依出現順序對應兩個數值（N25 E121 與 25N 121E 皆同）。
 * 沒有標記回傳 [undefined, undefined]；只有一個或超過兩個回傳 null。
 */
function hemispheres(s: string): [string, string] | [undefined, undefined] | null {
  const marks = s.match(HEMI) ?? [];
  if (marks.length === 0) return [undefined, undefined];
  return marks.length === 2 ? [marks[0], marks[1]] : null;
}

/** 依半球標記分配經緯度；沒有標記時，絕對值大於 90 的是經度，否則照「緯度, 經度」順序 */
function assignLatLng(a: number, b: number, ha?: string, hb?: string): ParsedCoord {
  let lat: number, lng: number;
  if (ha && hb) {
    if (hemiAxis(ha) === hemiAxis(hb)) return { kind: 'invalid', reason: '兩個數值都標成緯度或都標成經度' };
    const sa = Math.abs(a) * hemiSign(ha);
    const sb = Math.abs(b) * hemiSign(hb);
    [lat, lng] = hemiAxis(ha) === 'lat' ? [sa, sb] : [sb, sa];
  } else if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
    [lat, lng] = [b, a];
  } else {
    [lat, lng] = [a, b];
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { kind: 'invalid', reason: '緯度需在 ±90°、經度需在 ±180° 之內' };
  }
  return { kind: 'wgs84', lat, lng };
}

// ── TWD97 TM2 → 經緯度（GRS80，k0 = 0.9999，東偏 250 000 m）───────────────
// TWD97 與 WGS84 差異在 1 m 以內，基地定位直接視為相同。
const A = 6378137.0;
const F = 1 / 298.257222101;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const K0 = 0.9999;
const FALSE_EASTING = 250_000;

export function tm2ToWgs84(x: number, y: number, zone: Tm2Zone): { lat: number; lng: number } {
  const m = y / K0;
  const mu = m / (A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const phi1 = mu
    + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu)
    + ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu)
    + ((151 * e1 ** 3) / 96) * Math.sin(6 * mu)
    + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1), cos1 = Math.cos(phi1), tan1 = Math.tan(phi1);
  const c1 = EP2 * cos1 ** 2;
  const t1 = tan1 ** 2;
  const n1 = A / Math.sqrt(1 - E2 * sin1 ** 2);
  const r1 = (A * (1 - E2)) / (1 - E2 * sin1 ** 2) ** 1.5;
  const d = (x - FALSE_EASTING) / (n1 * K0);

  const lat = phi1 - ((n1 * tan1) / r1) * (
    d ** 2 / 2
    - ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * EP2) * d ** 4) / 24
    + ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * EP2 - 3 * c1 ** 2) * d ** 6) / 720
  );
  const lng = (
    d
    - ((1 + 2 * t1 + c1) * d ** 3) / 6
    + ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * EP2 + 24 * t1 ** 2) * d ** 5) / 120
  ) / cos1;

  return { lat: (lat * 180) / Math.PI, lng: zone + (lng * 180) / Math.PI };
}
