/**
 * TDX (Transport Data eXchange) Service
 * 交通部運輸資料流通服務平台
 * https://tdx.transportdata.tw
 *
 * 支援：捷運 LiveBoard、高鐵 / 台鐵時刻表、台鐵即時誤點
 * Auth：OIDC Client Credentials (Client ID + Secret → Bearer Token)。
 * 未填 Key 時改以匿名方式查詢：TDX 允許瀏覽器免 Key 呼叫，但每日次數很少。
 */

const TDX_TOKEN_URL =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
const TDX_BASE = 'https://tdx.transportdata.tw/api/basic';

// ── Token cache ──────────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  const clientId     = localStorage.getItem('VITE_TDX_CLIENT_ID')?.trim();
  const clientSecret = localStorage.getItem('VITE_TDX_CLIENT_SECRET')?.trim();
  if (!clientId || !clientSecret) return null;

  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  try {
    const res = await fetch(TDX_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`TDX token ${res.status}`);
    const data = await res.json();
    _cachedToken = data.access_token;
    _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // 60s buffer
    return _cachedToken;
  } catch (e) {
    console.warn('[TDX] Token 取得失敗:', e);
    return null;
  }
}

export const hasTdxKey = () =>
  !!(localStorage.getItem('VITE_TDX_CLIENT_ID')?.trim() && localStorage.getItem('VITE_TDX_CLIENT_SECRET')?.trim());

async function tdxFetch<T>(path: string): Promise<T | null> {
  const token = await getToken();
  try {
    const res = await fetch(`${TDX_BASE}${path}`, token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined);
    if (res.status === 429) {
      console.warn(`[TDX] 查詢次數已達上限${token ? '' : '（未填 TDX Key 時每日次數很少，請到 ⚙ 設定填入）'}`);
      return null;
    }
    if (!res.ok) throw new Error(`TDX ${res.status} ${path}`);
    return res.json() as Promise<T>;
  } catch (e) {
    console.warn('[TDX] 請求失敗:', e);
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MrtLiveBoard {
  StationID: string;
  StationName: { Zh_tw: string; En: string };
  TrainNo: string;
  Direction: 0 | 1; // 0=順行, 1=逆行
  DestinationStaionID: string;
  ScheduledArrivalTime: string;
  ScheduledDepartureTime: string;
}

export interface YouBikeStation {
  sno: string;
  sna: string;
  sarea: string;
  lat: number;
  lng: number;
  tot: number;  // 總停車格
  sbi: number;  // 可借車輛
  bemp: number; // 空位
}

// ── API functions ─────────────────────────────────────────────────────────────

/** 捷運各站目前列車動態（通用，傳入系統代碼） */
export async function fetchMetroLiveBoard(
  systemCode: 'TRTC' | 'TYMC' | 'TMRT' | 'KRTC'
): Promise<MrtLiveBoard[]> {
  const data = await tdxFetch<{ LiveBoards: MrtLiveBoard[] }>(
    `/v2/Rail/Metro/LiveBoard/${systemCode}?$format=JSON`
  );
  return data?.LiveBoards ?? [];
}

/** 台北捷運各站目前列車動態（保留向後相容） */
export async function fetchMrtLiveBoard(): Promise<MrtLiveBoard[]> {
  return fetchMetroLiveBoard('TRTC');
}

const toNum = (...vals: unknown[]): number => {
  for (const v of vals) {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    if (typeof n === 'number' && Number.isFinite(n)) return n;
  }
  return NaN;
};

/**
 * 台北市 YouBike JSON 已改欄位名（latitude/longitude/Quantity/available_*），
 * 舊欄位（lat/lng/tot/sbi/bemp）讀不到會變成 NaN 座標，讓 Cesium 整個停止渲染。
 * 兩種格式都接受，並丟掉座標無效的站點。
 */
function normalizeYouBikeStation(raw: any): YouBikeStation {
  return {
    sno:   String(raw?.sno ?? ''),
    sna:   String(raw?.sna ?? ''),
    sarea: String(raw?.sarea ?? ''),
    lat:   toNum(raw?.latitude, raw?.lat),
    lng:   toNum(raw?.longitude, raw?.lng),
    tot:   toNum(raw?.Quantity, raw?.total, raw?.tot),
    sbi:   toNum(raw?.available_rent_bikes, raw?.sbi),
    bemp:  toNum(raw?.available_return_bikes, raw?.bemp),
  };
}

/** YouBike 2.0 站點即時資料（台北市，無需 API Key） */
export async function fetchYouBikeStations(): Promise<YouBikeStation[]> {
  try {
    const res = await fetch(
      'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json'
    );
    if (!res.ok) throw new Error(`YouBike ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error('YouBike 回傳格式不是陣列');
    const stations = raw.map(normalizeYouBikeStation)
      .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.lat !== 0 && s.lng !== 0);
    if (stations.length < raw.length) {
      console.warn(`[YouBike] 略過 ${raw.length - stations.length} 個座標無效的站點`);
    }
    return stations;
  } catch (e) {
    console.warn('[YouBike] 站點資料取得失敗:', e);
    return [];
  }
}

// ── 高鐵 / 台鐵時刻表 → 列車行程 ──────────────────────────────────────────────
// 地圖上的列車位置由 transport/useTrainLayer 依「現在時間 + 誤點」在停靠站之間沿軌道推算。

export interface RailTrip {
  trainNo: string;
  /** 地圖標籤，如「自強 172 往樹林」 */
  label: string;
  /** 對號列車（台鐵太魯閣、普悠瑪、自強、莒光、復興；高鐵一律 true） */
  express: boolean;
  /** 停靠站與到、離站時間（台北時間當日 0 時起算的秒數，跨夜 +86400） */
  stops: { name: string; arr: number; dep: number }[];
}

interface RawStopTime {
  StopSequence: number;
  StationName?: { Zh_tw?: string };
  ArrivalTime?: string;
  DepartureTime?: string;
  SuspendedFlag?: number;
}

const TAIPEI_OFFSET_MS = 8 * 3600_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** 台北時間：日期、星期（0=週日）、當日秒數 */
export function taipeiNow() {
  const d = new Date(Date.now() + TAIPEI_OFFSET_MS);
  return {
    date: d.toISOString().slice(0, 10),
    weekday: d.getUTCDay(),
    sec: d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
  };
}

const toSec = (t?: string) => {
  if (!t) return NaN;
  const [h, m, s = '0'] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

function toStops(raw: RawStopTime[]): RailTrip['stops'] {
  const stops: RailTrip['stops'] = [];
  let offset = 0, last = -Infinity;
  for (const st of [...raw].sort((a, b) => a.StopSequence - b.StopSequence)) {
    if (st.SuspendedFlag === 1) continue; // 本站停駛
    let arr = toSec(st.ArrivalTime || st.DepartureTime) + offset;
    let dep = toSec(st.DepartureTime || st.ArrivalTime) + offset;
    if (!Number.isFinite(arr) || !Number.isFinite(dep)) continue;
    if (arr < last - 6 * 3600) { offset += 86400; arr += 86400; dep += 86400; } // 跨夜
    if (dep < arr - 6 * 3600) { offset += 86400; dep += 86400; }                // 本站午夜後才開
    stops.push({ name: st.StationName?.Zh_tw ?? '', arr, dep });
    last = dep;
  }
  return stops;
}

/** 同一天內只抓一次；抓到空結果不快取，下次再試 */
function oncePerDay(load: () => Promise<RailTrip[]>): () => Promise<RailTrip[]> {
  let cache: { date: string; trips: Promise<RailTrip[]> } | null = null;
  return () => {
    const { date } = taipeiNow();
    if (!cache || cache.date !== date) {
      const trips = load();
      cache = { date, trips };
      trips.then(t => { if (!t.length && cache?.trips === trips) cache = null; });
    }
    return cache.trips;
  };
}

/** 高鐵今日時刻表 */
export const fetchThsrTrips = oncePerDay(async () => {
  const data = await tdxFetch<any[]>('/v2/Rail/THSR/DailyTimetable/Today?$format=JSON');
  return (Array.isArray(data) ? data : []).map((t): RailTrip => {
    const info = t.DailyTrainInfo ?? {};
    return {
      trainNo: info.TrainNo ?? '',
      label: `高鐵 ${info.TrainNo ?? ''} 往${info.EndingStationName?.Zh_tw ?? ''}`,
      express: true,
      stops: toStops(t.StopTimes ?? []),
    };
  }).filter(t => t.stops.length >= 2);
});

// 車種簡碼：1 太魯閣、2 普悠瑪、3 自強、4 莒光、5 復興、11 自強(3000)；6 區間、7 普快、10 區間快
const TRA_EXPRESS = new Set(['1', '2', '3', '4', '5', '11']);

function traTrip(t: any): RailTrip {
  const info = t.TrainInfo ?? {};
  const type = String(info.TrainTypeName?.Zh_tw ?? '').replace(/\(.*$/, ''); // 「自強(3000)(EMU3000 型電車)」→「自強」
  return {
    trainNo: info.TrainNo ?? '',
    label: `${type} ${info.TrainNo ?? ''} 往${info.EndingStationName?.Zh_tw ?? ''}`.trim(),
    express: TRA_EXPRESS.has(String(info.TrainTypeCode)),
    stops: toStops(t.StopTimes ?? []),
  };
}

/** 台鐵今日時刻表；當日時刻表尚未發布（例如剛過午夜）時改用定期時刻表，依星期篩選 */
export const fetchTraTrips = oncePerDay(async () => {
  const daily = await tdxFetch<{ TrainTimetables?: any[] }>('/v3/Rail/TRA/DailyTrainTimetable/Today?$format=JSON');
  let list = daily?.TrainTimetables ?? [];
  if (!list.length) {
    const general = await tdxFetch<{ TrainTimetables?: any[] }>('/v3/Rail/TRA/GeneralTrainTimetable?$format=JSON');
    const day = WEEKDAYS[taipeiNow().weekday];
    list = (general?.TrainTimetables ?? []).filter(t => !t.ServiceDay || t.ServiceDay[day] === 1);
  }
  return list.map(traTrip).filter(t => t.stops.length >= 2);
});

/** 台鐵即時誤點（分鐘），以車次為 key；查詢失敗回傳 null */
export async function fetchTraDelays(): Promise<Map<string, number> | null> {
  const data = await tdxFetch<{ TrainLiveBoards?: { TrainNo: string; DelayTime?: number }[] }>(
    '/v3/Rail/TRA/TrainLiveBoard?$format=JSON'
  );
  if (!data) return null;
  return new Map((data.TrainLiveBoards ?? []).map(b => [b.TrainNo, b.DelayTime ?? 0]));
}
