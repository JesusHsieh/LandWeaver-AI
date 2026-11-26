// ============================================================
// 地址 / 地標搜尋：OpenStreetMap Nominatim（免費，無需 Key，支援 CORS）
// 使用規範：每秒最多 1 次、不可邊打字邊查、需標示 © OpenStreetMap 貢獻者
// https://operations.osmfoundation.org/policies/nominatim/
//
// OSM 的臺灣門牌不完整，查不到時 Nominatim 會改回傳同條路的其他門牌或不相干的地點，
// 所以結果一律再比對：門牌號、路名、行政區、名稱不符的直接剔除，不拿來定位。
// ============================================================

import { withTimeout } from '../../utils/withTimeout';

export type PlaceKind = 'house' | 'road' | 'area' | 'poi';

export interface PlaceResult {
  id: string;
  kind: PlaceKind;
  title: string;
  detail: string;
  lat: number;
  lng: number;
  /** 定位時的相機高度（公尺，地面以上） */
  viewHeight: number;
}

export interface SearchOutcome {
  items: PlaceResult[];
  /** 輸入含門牌號但 OSM 查無此門牌，items 改列同名道路 */
  houseNotFound: boolean;
}

interface NominatimItem {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  name?: string;
  display_name: string;
  address?: Record<string, string>;
  namedetails?: Record<string, string> | null;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MAX_RESULTS = 5;

const COUNTIES = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市', '新竹市', '嘉義市',
  '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣',
];

/** 比對用正規化：全形轉半形、台→臺、去空白、小寫 */
function norm(s: string): string {
  return s.normalize('NFKC').replace(/台/g, '臺').replace(/\s+/g, '').toLowerCase();
}

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
/** 「4段」→「四段」（OSM 路名用國字） */
const sectionToChinese = (sec: string) =>
  sec.replace(/^(\d+)段$/, (_, n) => (Number(n) <= 10 ? `${CN_DIGITS[Number(n)]}段` : `${n}段`));

/** 門牌號比對用：去「號」、「之」統一為「-」 */
const normHouseNo = (s: string) => norm(s).replace(/號$/, '').replace(/之/g, '-');

interface ParsedAddress {
  county?: string;
  district?: string;
  /** 路名＋段（不含巷弄），例：復興南路一段 */
  road: string;
  /** 路名＋段＋巷弄，例：復興南路一段107巷 */
  street: string;
  houseNo?: string;
}

/** 解析「縣市 區 村里 鄰 路 段 巷 弄 號」格式；不含路街名稱時回傳 null */
function parseAddress(raw: string): ParsedAddress | null {
  const full = norm(raw);
  const county = COUNTIES.find(c => full.startsWith(c));
  const s = county ? full.slice(county.length) : full;
  const m = s.match(
    /^(?<district>.{1,4}?[區鄉鎮市])?(?:.{1,4}?[村里])?(?:\d+鄰)?(?<road>.+?(?:大道|路|街))(?<sec>(?:\d+|[一二三四五六七八九十]+)段)?(?<lane>\d+巷)?(?<alley>\d+弄)?(?<no>\d+(?:[-之]\d+)?)?號?/,
  );
  if (!m?.groups) return null;
  // 地址後面只能接樓層之類（3樓、之2）；接其他文字（例「中山路郵局」）當地標名稱搜尋
  if (/[^\d\-之樓層室fb]/i.test(s.slice(m[0].length))) return null;
  const g = m.groups;
  const road = g.road + (g.sec ? sectionToChinese(g.sec) : '');
  return {
    county,
    district: g.district,
    road,
    street: road + (g.lane ?? '') + (g.alley ?? ''),
    houseNo: g.no,
  };
}

// ── 速率限制與快取 ──────────────────────────────────────────────────────────
let lastRequestAt = 0;
const cache = new Map<string, SearchOutcome>();

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });
}

async function nominatim(params: Record<string, string>, signal?: AbortSignal): Promise<NominatimItem[]> {
  const wait = lastRequestAt + 1100 - Date.now();
  if (wait > 0) await sleep(wait, signal);
  lastRequestAt = Date.now();
  const qs = new URLSearchParams({
    format: 'jsonv2', countrycodes: 'tw', limit: '10',
    addressdetails: '1', namedetails: '1', 'accept-language': 'zh-TW',
    ...params,
  });
  const res = await fetch(`${ENDPOINT}?${qs}`, { signal: withTimeout(signal, 10000) });
  if (!res.ok) throw new Error(`OSM Nominatim ${res.status}`);
  return res.json();
}

// ── 結果整理 ────────────────────────────────────────────────────────────────
const addrValues = (it: NominatimItem) => Object.values(it.address ?? {}).map(norm);
// 縣轄市（例竹北市）的 city 是市、county 才是縣，所以兩者都比對
const inCounty = (it: NominatimItem, county: string) =>
  [it.address?.city, it.address?.county, it.address?.state].some(v => v && norm(v) === norm(county));
// OSM 的臺灣行政區層級各縣市不一：臺北「區」在 suburb，桃園「區」、彰化「鄉」在 town（suburb 則是里）
const districtOf = (it: NominatimItem) =>
  it.address?.town ?? it.address?.suburb ?? it.address?.city_district ?? '';

function detailLine(it: NominatimItem, kind: PlaceKind): string {
  const a = it.address ?? {};
  const county = a.city ?? a.county ?? '';
  if (kind === 'area') return county === it.name ? '' : county;
  const hn = a.house_number ? (a.house_number.endsWith('號') ? a.house_number : `${a.house_number}號`) : '';
  return `${county}${districtOf(it)}${a.road ?? ''}${hn}`;
}

function viewHeightFor(kind: PlaceKind, placeRank: number): number {
  if (kind === 'area') return placeRank <= 12 ? 40000 : placeRank <= 16 ? 10000 : 3000;
  if (kind === 'road') return 1500;
  return 600;
}

function toResult(it: NominatimItem, kind: PlaceKind): PlaceResult {
  const a = it.address ?? {};
  const houseTitle = a.road && a.house_number ? `${a.road}${a.house_number.replace(/號$/, '')}號` : '';
  // 門牌結果以地址為標題，門牌內的地點名稱放在說明
  const isHouse = kind === 'house' && houseTitle;
  return {
    id: `${it.osm_type}${it.osm_id}`,
    kind,
    title: isHouse ? houseTitle : it.name || houseTitle || it.display_name.split(',')[0],
    detail: isHouse
      ? `${a.city ?? a.county ?? ''}${districtOf(it)}${it.name ? ` · ${it.name}` : ''}`
      : detailLine(it, kind),
    lat: Number(it.lat),
    lng: Number(it.lon),
    viewHeight: viewHeightFor(kind, it.place_rank),
  };
}

function kindOf(it: NominatimItem): PlaceKind {
  if (it.category === 'highway') return 'road';
  if (it.category === 'boundary' || (it.category === 'place' && it.type !== 'house')) return 'area';
  if (it.category === 'place' && it.type === 'house') return 'house';
  return 'poi';
}

/** 同一門牌或同一行政區內的同名道路只留第一筆（OSM 道路會切成很多段） */
function dedupe(results: Candidate[]): PlaceResult[] {
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const { it, r } of results) {
    const key = r.kind === 'house' ? `h:${norm(it.address?.road ?? '')}:${normHouseNo(it.address?.house_number ?? '')}`
      : r.kind === 'road' ? `r:${norm(it.address?.road ?? it.name ?? '')}:${norm(districtOf(it))}`
      : `${r.kind}:${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.slice(0, MAX_RESULTS);
}

// ── 門牌地址搜尋 ────────────────────────────────────────────────────────────
type Candidate = { it: NominatimItem; r: PlaceResult };

function classifyAddressHits(items: NominatimItem[], addr: ParsedAddress) {
  const street = norm(addr.street);
  const road = norm(addr.road);
  const houseNo = addr.houseNo ? normHouseNo(addr.houseNo) : null;
  const houses: Candidate[] = [];
  const roads: Candidate[] = [];
  for (const it of items) {
    if (addr.county && !inCounty(it, addr.county)) continue;
    if (addr.district && !addrValues(it).includes(norm(addr.district))) continue;
    const itRoad = norm(it.address?.road ?? '');
    const itHouse = it.address?.house_number ? normHouseNo(it.address.house_number) : null;
    if (houseNo && itHouse === houseNo && itRoad === street) {
      houses.push({ it, r: toResult(it, 'house') });
    } else if (it.category === 'highway' && (itRoad === street || itRoad === road)) {
      roads.push({ it, r: toResult(it, 'road') });
    }
    // 其餘（同條路的其他門牌、路上其他地點）不採用
  }
  return { houses, roads };
}

async function searchAddress(addr: ParsedAddress, signal?: AbortSignal): Promise<SearchOutcome> {
  // 以「門牌 路名, 區, 縣市」逗號分隔，Nominatim 才會正確拆解中文地址
  const place = (street: string) => [street, addr.district, addr.county].filter(Boolean).join(', ');
  const first = await nominatim({ q: place(addr.houseNo ? `${addr.houseNo} ${addr.street}` : addr.street) }, signal);
  const { houses } = classifyAddressHits(first, addr);
  if (houses.length) {
    // 同一門牌優先用門牌點或建物，其次才是門牌內的店家、機構
    const rank = ({ it }: Candidate) => (it.category === 'place' && it.type === 'house' ? 0 : it.category === 'building' ? 1 : 2);
    return { items: dedupe([...houses].sort((x, y) => rank(x) - rank(y))), houseNotFound: false };
  }

  // 查到門牌時只列門牌；查不到才列道路（必要時不帶門牌號再查一次）
  let { roads } = classifyAddressHits(first, addr);
  if (!roads.length && addr.houseNo) {
    roads = classifyAddressHits(await nominatim({ q: place(addr.street) }, signal), addr).roads;
  }
  return { items: dedupe(roads), houseNotFound: Boolean(addr.houseNo) && roads.length > 0 };
}

// ── 地標 / 行政區名稱搜尋 ───────────────────────────────────────────────────
function nameMatches(it: NominatimItem, core: string): boolean {
  const names = [it.name ?? '', ...Object.values(it.namedetails ?? {})].map(norm).filter(Boolean);
  return names.some(n => n.includes(core) || (n.length >= 3 && core.includes(n)));
}

async function searchName(raw: string, signal?: AbortSignal): Promise<SearchOutcome> {
  const core = norm(raw);
  const county = COUNTIES.find(c => core.startsWith(c));
  const pick = (items: NominatimItem[]) => dedupe(
    items
      .filter(it => (!county || inCounty(it, county)) && nameMatches(it, core))
      .map(it => ({ it, r: toResult(it, kindOf(it)) })),
  );

  let results = pick(await nominatim({ q: raw.trim() }, signal));
  // 「臺北市政府」這類以縣市開頭的名稱，自由文字常配錯，改用結構化查詢再試一次
  if (!results.length && county) {
    results = pick(await nominatim({ amenity: raw.trim(), city: county }, signal));
  }
  return { items: results, houseNotFound: false };
}

/**
 * 搜尋地址或地標，回傳經比對確認的候選（最多 5 筆）。查無符合時 items 為空陣列。
 * 只在使用者按下搜尋時呼叫，不要綁在輸入事件上。
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<SearchOutcome> {
  const key = norm(query);
  const hit = cache.get(key);
  if (hit) return hit;

  const addr = parseAddress(query);
  const outcome = addr ? await searchAddress(addr, signal) : await searchName(query, signal);

  cache.set(key, outcome);
  if (cache.size > 50) cache.delete(cache.keys().next().value!);
  return outcome;
}
