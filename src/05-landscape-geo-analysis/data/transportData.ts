/**
 * 靜態交通資料
 * 地圖上的路線與站點：OSM 快照（data/routes/*.json），執行時不查 Overpass
 * 下方內建站點：高鐵站點，以及列車動態（TDX）比對站 ID 用的主要站點
 */

// ── 台北捷運（列車動態比對用）─────────────────────────────────────────────────

export interface MrtLine {
  id: string;
  name: string;
  color: string;
}

export interface MrtStation {
  id: string;
  name: string;
  lineIds: string[];
  coords: [number, number]; // [lng, lat]
}

export const MRT_LINES: MrtLine[] = [
  { id: 'R',  name: '淡水信義線', color: '#E3002C' },
  { id: 'BL', name: '板南線',     color: '#0070BD' },
  { id: 'G',  name: '松山新店線', color: '#008659' },
  { id: 'O',  name: '中和新蘆線', color: '#F8B61C' },
  { id: 'BR', name: '文湖線',     color: '#C48A00' },
];

export const MRT_STATIONS: MrtStation[] = [
  { id: 'R02',  name: '淡水',       lineIds: ['R'],       coords: [121.4483, 25.1796] },
  { id: 'R08',  name: '北投',       lineIds: ['R'],       coords: [121.5221, 25.0766] },
  { id: 'R10',  name: '台北車站',   lineIds: ['R','BL'],  coords: [121.5199, 25.0527] },
  { id: 'R11',  name: '中正紀念堂', lineIds: ['R','G'],   coords: [121.5178, 25.0419] },
  { id: 'R16',  name: '象山',       lineIds: ['R'],       coords: [121.5706, 25.0337] },
  { id: 'BL07', name: '板橋',       lineIds: ['BL'],      coords: [121.5034, 25.0143] },
  { id: 'BL12', name: '台北車站',   lineIds: ['BL'],      coords: [121.5295, 25.0473] },
  { id: 'BL23', name: '南港展覽館', lineIds: ['BL'],      coords: [121.6143, 25.0560] },
  { id: 'G01',  name: '松山',       lineIds: ['G'],       coords: [121.5781, 25.0498] },
  { id: 'G06',  name: '中山',       lineIds: ['G','R'],   coords: [121.5199, 25.0468] },
  { id: 'G12',  name: '新店',       lineIds: ['G'],       coords: [121.4929, 24.9889] },
  { id: 'O01',  name: '蘆洲',       lineIds: ['O'],       coords: [121.4879, 25.0850] },
  { id: 'O17',  name: '南勢角',     lineIds: ['O'],       coords: [121.4820, 24.9955] },
  { id: 'BR01', name: '動物園',     lineIds: ['BR'],      coords: [121.6350, 25.0622] },
  { id: 'BR09', name: '中山國中',   lineIds: ['BR'],      coords: [121.5178, 25.0560] },
];

// ── 台灣高鐵 ──────────────────────────────────────────────────────────────────

export interface ThsrStation {
  id: string;
  name: string;
  coords: [number, number];
}

export const THSR_STATIONS: ThsrStation[] = [
  { id: '0990', name: '南港', coords: [121.60639, 25.05222] }, // Wikipedia: 25°3′8″N 121°36′23″E
  { id: '0100', name: '台北', coords: [121.51722, 25.04778] }, // Wikipedia: 25°2′52″N 121°31′2″E
  { id: '0110', name: '板橋', coords: [121.46368, 25.01428] }, // Wikipedia: 25°0′51″N 121°27′49″E
  { id: '0120', name: '桃園', coords: [121.21444, 25.01500] }, // Wikipedia: 25°0′54″N 121°12′52″E（中壢清埔）
  { id: '0130', name: '新竹', coords: [121.04024, 24.80843] }, // Wikipedia: 24°48′30″N 121°2′25″E（竹北市）
  { id: '0140', name: '苗栗', coords: [120.82527, 24.60601] }, // Wikipedia: 24°36′22″N 120°49′31″E（後龍鎮）
  { id: '0150', name: '台中', coords: [120.61583, 24.11167] }, // Wikipedia: 24°6′42″N 120°36′57″E（烏日區）
  { id: '0160', name: '彰化', coords: [120.57464, 23.87394] }, // Wikipedia: 23°52′26″N 120°34′29″E（田中鎮）
  { id: '0170', name: '雲林', coords: [120.41639, 23.73639] }, // Wikipedia: 23°44′11″N 120°24′59″E（虎尾鎮）
  { id: '0180', name: '嘉義', coords: [120.32611, 23.45806] }, // Wikipedia: 23°27′29″N 120°19′34″E（太保市）
  { id: '0190', name: '台南', coords: [120.28528, 22.92556] }, // Wikipedia: 22°55′32″N 120°17′7″E（歸仁區）
  { id: '0200', name: '左營', coords: [120.30450, 22.68580] }, // latitude.to: 22°41′8″N 120°18′16″E
];

// ── 站點型別（桃捷 / 中捷 / 高捷）──────────────────────────────────────────────

export interface SimpleStation {
  id: string;
  name: string;
  coords: [number, number];
}

// ── 桃園捷運 TYMC ────────────────────────────────────────────────────────────

/** 桃捷主要站點（機場線 A 線；列車動態比對用） */
export const TAOYUAN_MRT_STATIONS: SimpleStation[] = [
  { id: 'A1',  name: '台北車站',      coords: [121.5170, 25.0478] },
  { id: 'A3',  name: '台灣桃園國際機場', coords: [121.2943, 25.0766] },
  { id: 'A8',  name: '長庚醫院',      coords: [121.3490, 25.0780] },
  { id: 'A9',  name: '林口',          coords: [121.3692, 25.0868] },
  { id: 'A12', name: '機場第一航廈',  coords: [121.2243, 25.0755] },
  { id: 'A13', name: '機場第二航廈',  coords: [121.2345, 25.0800] },
  { id: 'A18', name: '高鐵桃園站',    coords: [121.2265, 24.9776] },
  { id: 'A19', name: '桃園',          coords: [121.3130, 24.9893] },
  { id: 'A21', name: '環北',          coords: [121.2090, 24.9540] },
];

// ── 台中捷運 TMRT ────────────────────────────────────────────────────────────

/** 中捷主要站點（綠線；列車動態比對用） */
export const TAICHUNG_MRT_STATIONS: SimpleStation[] = [
  { id: 'G1',  name: '北屯總站',    coords: [120.6944, 24.1782] },
  { id: 'G3',  name: '文心公益',    coords: [120.6868, 24.1702] },
  { id: 'G5',  name: '文心森林公園', coords: [120.6857, 24.1617] },
  { id: 'G7',  name: '市政府',      coords: [120.6636, 24.1617] },
  { id: 'G9',  name: '高鐵台中站',  coords: [120.6841, 24.1726] },
];

// ── 高雄捷運 KRTC ────────────────────────────────────────────────────────────

/** 高捷主要站點（紅線 + 橘線；列車動態比對用） */
export const KAOHSIUNG_MRT_STATIONS: SimpleStation[] = [
  // 紅線
  { id: 'R4',   name: '南岡山',   coords: [120.2978, 22.7884] },
  { id: 'R10',  name: '左營',     coords: [120.3069, 22.6890] },
  { id: 'R14',  name: '美麗島',   coords: [120.3016, 22.6296] },
  { id: 'R16',  name: '中央公園', coords: [120.3078, 22.6219] },
  { id: 'R22A', name: '小港',     coords: [120.3418, 22.5715] },
  // 橘線
  { id: 'O1',   name: '西子灣',   coords: [120.2657, 22.6187] },
  { id: 'O5',   name: '鹽埕埔',   coords: [120.2814, 22.6266] },
  { id: 'O7',   name: '信義國小', coords: [120.3081, 22.6305] },
  { id: 'O14',  name: '大寮',     coords: [120.3838, 22.6008] },
];

// ── 路線幾何（OSM 快照）────────────────────────────────────────────────────────
// 由 scripts/fetch-transport-routes.mjs 從 OpenStreetMap 抓取路線與站點，存成 data/routes/*.json，
// 執行時不再查 Overpass：公共鏡像常常連不上或回應很慢，圖層會整個出不來。
// 鐵路路線很少變動，需要更新時重新執行該腳本即可。

export interface MrtWayGroup {
  color: string;
  segments: [number, number][][];
}

export interface RouteStation {
  name: string;
  coords: [number, number]; // [lng, lat]
}

/** 一條路線快照：線段（或依顏色分組的線段）+ 沿線站點 */
export interface RouteData<T> {
  lines: T;
  stations: RouteStation[];
}

export type LineRoute = RouteData<[number, number][][]>;
export type GroupedRoute = RouteData<MrtWayGroup[]>;

interface RouteSnapshot<T> {
  source: string;
  fetched: string;
  lines: T;
  stations?: RouteStation[];
}

async function loadRouteSnapshot<T extends unknown[]>(url: URL, label: string): Promise<RouteData<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { lines, stations = [] } = await res.json() as RouteSnapshot<T>;
    return { lines, stations };
  } catch (e) {
    console.warn(`[Transport] ${label} 路線載入失敗:`, (e as Error).message);
    return { lines: [] as unknown as T, stations: [] };
  }
}

/** 台北/新北捷運（TRTC）+ 輕軌，依路線顏色分組 */
export const loadMrtRoute = () =>
  loadRouteSnapshot<MrtWayGroup[]>(new URL('./routes/mrt.json', import.meta.url), 'MRT');

/** 台灣高鐵（relation 9825284 南港→左營全線；站點用 THSR_STATIONS） */
export const loadThsrRoute = () =>
  loadRouteSnapshot<[number, number][][]>(new URL('./routes/thsr.json', import.meta.url), 'THSR');

/** 台鐵 — 各客運路線（縱貫、山海線、屏東、南迴、台東、北迴、宜蘭與支線） */
export const loadTraRoute = () =>
  loadRouteSnapshot<[number, number][][]>(new URL('./routes/tra.json', import.meta.url), 'TRA');

/** 桃園捷運機場線（relation 2108764） */
export const loadTaoyuanMrtRoute = () =>
  loadRouteSnapshot<[number, number][][]>(new URL('./routes/tymc.json', import.meta.url), '桃捷');

/** 台中捷運綠線（relation 11330355 + 11330356） */
export const loadTaichungMrtRoute = () =>
  loadRouteSnapshot<[number, number][][]>(new URL('./routes/tmrt.json', import.meta.url), '中捷');

/** 高雄捷運紅線 + 橘線 + 環狀輕軌，依路線顏色分組 */
export const loadKaohsiungMrtRoute = () =>
  loadRouteSnapshot<MrtWayGroup[]>(new URL('./routes/krtc.json', import.meta.url), '高捷');
