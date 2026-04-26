/**
 * TDX (Transport Data eXchange) Service
 * 交通部運輸資料流通服務平台
 * https://tdx.transportdata.tw
 *
 * 支援：台北捷運 LiveBoard、高鐵時刻表
 * Auth：OIDC Client Credentials (Client ID + Secret → Bearer Token)
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

async function tdxFetch<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${TDX_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

export interface ThsrDailyTrain {
  TrainNo: string;
  Direction: 0 | 1;
  StopTimes: {
    StopSequence: number;
    StationID: string;
    StationName: { Zh_tw: string };
    ArrivalTime: string;
    DepartureTime: string;
  }[];
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

/** 高鐵今日時刻表（所有班次） */
export async function fetchThsrDailyTimetable(): Promise<ThsrDailyTrain[]> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await tdxFetch<{ TrainTimetables: ThsrDailyTrain[] }>(
    `/v2/Rail/THSR/DailyTimetable/Today?$format=JSON`
  );
  return data?.TrainTimetables ?? [];
}

/** YouBike 2.0 站點即時資料（台北市，無需 API Key） */
export async function fetchYouBikeStations(): Promise<YouBikeStation[]> {
  try {
    const res = await fetch(
      'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json'
    );
    if (!res.ok) throw new Error(`YouBike ${res.status}`);
    return res.json();
  } catch (e) {
    console.warn('[YouBike] 站點資料取得失敗:', e);
    return [];
  }
}

// ── TRA Daily Timetable ───────────────────────────────────────────────────────

export interface TRADailyTrain {
  TrainNo: string;
  Direction: 0 | 1;
  StopTimes: {
    StopSequence: number;
    StationID: string;
    StationName: { Zh_tw: string };
    ArrivalTime: string;
    DepartureTime: string;
  }[];
}

/** 台鐵今日時刻表（所有班次） */
export async function fetchTRADailyTimetable(): Promise<TRADailyTrain[]> {
  const data = await tdxFetch<{ TrainTimetables: any[] }>(
    '/v2/Rail/TRA/DailyTrainTimetable/Today?$format=JSON'
  );
  if (!data) return [];
  // TDX TRA 回傳格式：TrainTimetables[].TrainInfo + StopTimes
  return data.TrainTimetables.map((tt: any) => ({
    TrainNo:   tt.TrainInfo?.TrainNo   ?? tt.TrainNo   ?? '',
    Direction: tt.TrainInfo?.Direction ?? tt.Direction ?? 0,
    StopTimes: tt.StopTimes ?? [],
  }));
}

// ── THSR Train Position Interpolator ────────────────────────────────────────
// 高鐵無即時位置 API，用時刻表 + 現在時間線性內插站間位置

export interface ThsrTrainPosition {
  trainNo: string;
  direction: 0 | 1;
  lng: number;
  lat: number;
  fromStation: string;
  toStation: string;
  progress: number; // 0-1
}

/** THSR 站點順序座標（南港→左營） */
export const THSR_STATION_COORDS: Record<string, [number, number]> = {
  '0990': [121.6072, 25.0579], // 南港
  '0100': [121.5151, 25.0122], // 台北
  '0110': [121.4634, 25.0143], // 板橋
  '0120': [121.2265, 24.9776], // 桃園
  '0130': [120.9826, 24.7999], // 新竹
  '0140': [120.8219, 24.5099], // 苗栗
  '0150': [120.6841, 24.1726], // 台中
  '0160': [120.5383, 23.9951], // 彰化
  '0170': [120.4266, 23.6767], // 雲林
  '0180': [120.3612, 23.4499], // 嘉義
  '0190': [120.2091, 23.0099], // 台南
  '0200': [120.2946, 22.6842], // 左營
};

// ── TRA Train Position Interpolator ──────────────────────────────────────────
// 與 THSR 相同邏輯，但以站名（中文）作為座標索引（TDX TRA 站 ID 難以預測）

export interface TRATrainPosition {
  trainNo: string;
  lng: number;
  lat: number;
  fromStation: string;
  toStation: string;
}

/** 台鐵站名 → 座標（內插用，與 TRA_STATIONS 保持一致） */
export const TRA_STATION_NAME_COORDS: Record<string, [number, number]> = {
  '基隆':   [121.7398, 25.1290],
  '台北':   [121.5170, 25.0478],
  '臺北':   [121.5170, 25.0478], // 官方可能用臺
  '板橋':   [121.4634, 25.0143],
  '桃園':   [121.3130, 24.9893],
  '中壢':   [121.2246, 24.9544],
  '新竹':   [120.9697, 24.8024],
  '竹南':   [120.8880, 24.6874],
  '苗栗':   [120.8199, 24.5637],
  '豐原':   [120.7184, 24.2539],
  '台中':   [120.6830, 24.1380],
  '臺中':   [120.6830, 24.1380],
  '彰化':   [120.5382, 24.0778],
  '員林':   [120.5709, 23.9581],
  '嘉義':   [120.4278, 23.4783],
  '新營':   [120.3108, 23.3022],
  '台南':   [120.2143, 22.9975],
  '臺南':   [120.2143, 22.9975],
  '左營':   [120.3069, 22.6890],
  '高雄':   [120.2943, 22.6393],
  '屏東':   [120.4878, 22.6712],
  '宜蘭':   [121.7531, 24.7512],
  '花蓮':   [121.6031, 23.9912],
  '台東':   [121.1294, 22.7977],
  '臺東':   [121.1294, 22.7977],
};

export function interpolateTRAPositions(
  timetable: TRADailyTrain[]
): TRATrainPosition[] {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const positions: TRATrainPosition[] = [];

  for (const train of timetable) {
    const stops = [...train.StopTimes].sort((a, b) => a.StopSequence - b.StopSequence);
    for (let i = 0; i < stops.length - 1; i++) {
      const depStr = stops[i].DepartureTime || stops[i].ArrivalTime;
      const arrStr = stops[i + 1].ArrivalTime;
      if (!depStr || !arrStr) continue;

      const dep = timeToMinutes(depStr);
      const arr = timeToMinutes(arrStr);
      if (nowMin >= dep && nowMin <= arr) {
        const progress = arr > dep ? (nowMin - dep) / (arr - dep) : 0;
        const fromName = stops[i].StationName?.Zh_tw ?? '';
        const toName   = stops[i + 1].StationName?.Zh_tw ?? '';
        const from = TRA_STATION_NAME_COORDS[fromName];
        const to   = TRA_STATION_NAME_COORDS[toName];
        if (!from || !to) continue;
        positions.push({
          trainNo:     train.TrainNo,
          lng:         from[0] + (to[0] - from[0]) * progress,
          lat:         from[1] + (to[1] - from[1]) * progress,
          fromStation: fromName,
          toStation:   toName,
        });
        break;
      }
    }
  }
  return positions;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function interpolateThsrPositions(
  timetable: ThsrDailyTrain[]
): ThsrTrainPosition[] {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const positions: ThsrTrainPosition[] = [];

  for (const train of timetable) {
    const stops = train.StopTimes.sort((a, b) => a.StopSequence - b.StopSequence);
    for (let i = 0; i < stops.length - 1; i++) {
      const dep = timeToMinutes(stops[i].DepartureTime || stops[i].ArrivalTime);
      const arr = timeToMinutes(stops[i + 1].ArrivalTime);
      if (nowMin >= dep && nowMin <= arr) {
        const progress = (nowMin - dep) / (arr - dep);
        const fromId = stops[i].StationID;
        const toId   = stops[i + 1].StationID;
        const from   = THSR_STATION_COORDS[fromId];
        const to     = THSR_STATION_COORDS[toId];
        if (!from || !to) continue;
        positions.push({
          trainNo:     train.TrainNo,
          direction:   train.Direction,
          lng:         from[0] + (to[0] - from[0]) * progress,
          lat:         from[1] + (to[1] - from[1]) * progress,
          fromStation: stops[i].StationName.Zh_tw,
          toStation:   stops[i + 1].StationName.Zh_tw,
          progress,
        });
        break;
      }
    }
  }
  return positions;
}
