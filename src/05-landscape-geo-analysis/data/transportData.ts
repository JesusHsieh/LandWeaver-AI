/**
 * 靜態交通資料
 * 路線幾何：優先從 OSM Overpass API 動態取得；失敗時使用內建站點連線 fallback
 * Overpass 鏡像三組輪流嘗試，避免單點 504 / 429
 */

// ── 台北捷運（站點資料 / fallback）───────────────────────────────────────────

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

// ── 台鐵 TRA ──────────────────────────────────────────────────────────────────

export interface SimpleStation {
  id: string;
  name: string;
  coords: [number, number];
}

/** 台鐵主要站點（縱貫線・北迴・南迴・台東線） */
export const TRA_STATIONS: SimpleStation[] = [
  { id: 'TRA-Keelung',   name: '基隆',   coords: [121.7398, 25.1290] },
  { id: 'TRA-Taipei',    name: '台北',   coords: [121.5170, 25.0478] },
  { id: 'TRA-Banciao',   name: '板橋',   coords: [121.4634, 25.0143] },
  { id: 'TRA-Taoyuan',   name: '桃園',   coords: [121.3130, 24.9893] },
  { id: 'TRA-Zhongli',   name: '中壢',   coords: [121.2246, 24.9544] },
  { id: 'TRA-Hsinchu',   name: '新竹',   coords: [120.9697, 24.8024] },
  { id: 'TRA-Zhunan',    name: '竹南',   coords: [120.8880, 24.6874] },
  { id: 'TRA-Miaoli',    name: '苗栗',   coords: [120.8199, 24.5637] },
  { id: 'TRA-Fengyuan',  name: '豐原',   coords: [120.7184, 24.2539] },
  { id: 'TRA-Taichung',  name: '台中',   coords: [120.6830, 24.1380] },
  { id: 'TRA-Changhua',  name: '彰化',   coords: [120.5382, 24.0778] },
  { id: 'TRA-Yuanlin',   name: '員林',   coords: [120.5709, 23.9581] },
  { id: 'TRA-Chiayi',    name: '嘉義',   coords: [120.4278, 23.4783] },
  { id: 'TRA-Xinying',   name: '新營',   coords: [120.3108, 23.3022] },
  { id: 'TRA-Tainan',    name: '台南',   coords: [120.2143, 22.9975] },
  { id: 'TRA-Zuoying',   name: '左營',   coords: [120.3069, 22.6890] },
  { id: 'TRA-Kaohsiung', name: '高雄',   coords: [120.2943, 22.6393] },
  { id: 'TRA-Pingtung',  name: '屏東',   coords: [120.4878, 22.6712] },
  { id: 'TRA-Yilan',     name: '宜蘭',   coords: [121.7531, 24.7512] },
  { id: 'TRA-Hualien',   name: '花蓮',   coords: [121.6031, 23.9912] },
  { id: 'TRA-Taitung',   name: '台東',   coords: [121.1294, 22.7977] },
];

// ── 桃園捷運 TYMC ────────────────────────────────────────────────────────────

/** 桃捷主要站點（機場線 A 線） */
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

/** 中捷主要站點（綠線） */
export const TAICHUNG_MRT_STATIONS: SimpleStation[] = [
  { id: 'G1',  name: '北屯總站',    coords: [120.6944, 24.1782] },
  { id: 'G3',  name: '文心公益',    coords: [120.6868, 24.1702] },
  { id: 'G5',  name: '文心森林公園', coords: [120.6857, 24.1617] },
  { id: 'G7',  name: '市政府',      coords: [120.6636, 24.1617] },
  { id: 'G9',  name: '高鐵台中站',  coords: [120.6841, 24.1726] },
];

// ── 高雄捷運 KRTC ────────────────────────────────────────────────────────────

/** 高捷主要站點（紅線 + 橘線） */
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

// ── Overpass 多鏡像 + 重試邏輯 ───────────────────────────────────────────────

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

/**
 * 對多個 Overpass 鏡像依序嘗試，直到有一個成功。
 * 每個鏡像嘗試一次，失敗立即換下一個（含 5s timeout 防阻塞）。
 */
async function fetchOverpass(query: string, label: string): Promise<any> {
  for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
    const mirror = OVERPASS_MIRRORS[i];
    try {
      const controller = new AbortController();
      // 45-second hard timeout per mirror attempt
      const timer = setTimeout(() => controller.abort(), 45_000);
      const res = await fetch(mirror, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (i > 0) console.log(`[OSM] ${label}: 使用備用鏡像 #${i + 1}`);
      return data;
    } catch (e) {
      console.warn(`[OSM] ${label} 鏡像 ${i + 1}/${OVERPASS_MIRRORS.length} 失敗:`, (e as Error).message);
      if (i < OVERPASS_MIRRORS.length - 1) {
        // Brief pause before trying next mirror
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }
  throw new Error(`所有 Overpass 鏡像均失敗 (${label})`);
}

// ── MrtWayGroup 介面 ──────────────────────────────────────────────────────────

export interface MrtWayGroup {
  color: string;
  segments: [number, number][][];
}

// ── MRT 色彩推斷 ─────────────────────────────────────────────────────────────

const MRT_LINE_COLORS: Record<string, string> = {
  R:  '#E3002C',  // 淡水信義線
  BL: '#0070BD',  // 板南線
  G:  '#008659',  // 松山新店線
  O:  '#F8B61C',  // 中和新蘆線
  BR: '#C48A00',  // 文湖線
  Y:  '#FAD518',  // 環狀線
  V:  '#FEBEB5',  // 淡海輕軌（藍海線+綠山線合色）
  K:  '#C3B091',  // 安坑輕軌
};

const MRT_NAME_COLOR: Array<[RegExp, string]> = [
  [/淡水|信義/,     '#E3002C'],
  [/板南/,          '#0070BD'],
  [/松山|新店/,     '#008659'],
  [/中和|新蘆/,     '#F8B61C'],
  [/文湖/,          '#C48A00'],
  [/環狀/,          '#FAD518'],
  [/新北投/,        '#F890A5'],  // 新北投支線（粉紅）
  [/小碧潭/,        '#CEDC00'],  // 小碧潭支線（黃綠）
  [/淡海|藍海|綠山/, '#FEBEB5'], // 淡海輕軌
  [/安坑/,          '#C3B091'],  // 安坑輕軌
];

function getMrtColor(tags: Record<string, string>): string {
  if (tags.colour) return tags.colour;
  if (tags.color)  return tags.color;
  if (tags.ref && MRT_LINE_COLORS[tags.ref]) return MRT_LINE_COLORS[tags.ref];
  const name = tags.name || tags['name:zh'] || '';
  for (const [re, color] of MRT_NAME_COLOR) {
    if (re.test(name)) return color;
  }
  return '#AAAAAA';
}

// ── 台北捷運 ─────────────────────────────────────────────────────────────────

/** 從 OSM 取得台北/新北捷運（TRTC）+ 輕軌 way 幾何，依顏色分組；失敗時回傳 []
 *  明確列出所有 28 條 relations（含雙向、支線），way ID 去重避免重複繪製
 *  R 淡水信義線: 3343808,5378981,5633242,9439377
 *  新北投支線:   2665129,9437206
 *  BL 板南線:    199038,9437776
 *  BR 文湖線:    447449,4264892
 *  G 松山新店線: 447471,4250356,4250357,9437777
 *  小碧潭支線:   4250380,4250381
 *  O 中和新蘆線: 4250352,4250353,4250354,4250355
 *  Y 環狀線:     3322093,8165684
 *  V 淡海輕軌:   5990742,9154523,9154524,13611116
 *  K 安坑輕軌:   15443525,15443526 */
export async function loadMrtWayGeometry(): Promise<MrtWayGroup[]> {
  const query = `[out:json][timeout:90];
(
  relation(3343808);relation(5378981);relation(5633242);relation(9439377);
  relation(2665129);relation(9437206);
  relation(199038);relation(9437776);
  relation(447449);relation(4264892);
  relation(447471);relation(4250356);relation(4250357);relation(9437777);
  relation(4250380);relation(4250381);
  relation(4250352);relation(4250353);relation(4250354);relation(4250355);
  relation(3322093);relation(8165684);
  relation(5990742);relation(9154523);relation(9154524);relation(13611116);
  relation(15443525);relation(15443526);
);
way(r)["railway"];out geom tags;`;
  try {
    const data = await fetchOverpass(query, 'MRT');
    const colorMap = new Map<string, [number, number][][]>();
    const seen = new Set<number>(); // way ID 去重，雙向 relation 同一條 way 只畫一次

    for (const el of data.elements as any[]) {
      if (el.type !== 'way' || !el.geometry || seen.has(el.id)) continue;
      seen.add(el.id);
      const seg: [number, number][] = (el.geometry as { lat: number; lon: number }[])
        .map(nd => [nd.lon, nd.lat]);
      if (seg.length < 2) continue;
      const color = getMrtColor(el.tags || {});
      if (!colorMap.has(color)) colorMap.set(color, []);
      colorMap.get(color)!.push(seg);
    }

    if (colorMap.size === 0) throw new Error('無路段資料');

    const result = Array.from(colorMap.entries()).map(([color, segments]) => ({ color, segments }));
    console.log(`[OSM] MRT: ${result.length} 顏色組, ${seen.size} 路段`);
    return result;
  } catch (e) {
    console.warn('[OSM] MRT 取得失敗:', (e as Error).message);
    return [];
  }
}

// ── 台灣高鐵 ──────────────────────────────────────────────────────────────────

/** 從 OSM 取得台灣高鐵 way 幾何
 *  THSR 在 OSM 標記為 railway=rail + highspeed=yes，存於班次 relation 的 way 成員
 *  使用全線班次 relation 9825284（603 南港→左營）取得 292 段精確路軌幾何
 *  失敗時回傳 [] */
export async function loadThsrWayGeometry(): Promise<[number, number][][]> {
  // relation(9825284) = 高鐵603 全線南港→左營，way members 即為完整路軌 segments
  const query = `[out:json][timeout:60];relation(9825284);way(r)["railway"="rail"];out geom;`;
  try {
    const data = await fetchOverpass(query, 'THSR');
    const segs = (data.elements as any[])
      .filter(el => el.type === 'way' && el.geometry)
      .map(el =>
        (el.geometry as { lat: number; lon: number }[]).map(
          nd => [nd.lon, nd.lat] as [number, number]
        )
      )
      .filter(seg => seg.length >= 2);

    if (segs.length === 0) throw new Error('無路段資料');
    console.log(`[OSM] THSR: ${segs.length} 路段`);
    return segs;
  } catch (e) {
    console.warn('[OSM] THSR 取得失敗:', (e as Error).message);
    return [];
  }
}

// ── 通用 OSM Way 查詢 ─────────────────────────────────────────────────────────

async function loadOsmWays(
  railwayTag: string,
  bbox: string,
  label: string,
  timeout = 30,
): Promise<[number, number][][]> {
  const query = `[out:json][timeout:${timeout}];way["railway"~"${railwayTag}"]["service"!~"siding|yard|crossover"](${bbox});out geom;`;
  try {
    const data = await fetchOverpass(query, label);
    const segs = (data.elements as any[])
      .filter(el => el.type === 'way' && el.geometry)
      .map(el =>
        (el.geometry as { lat: number; lon: number }[]).map(
          nd => [nd.lon, nd.lat] as [number, number]
        )
      )
      .filter((seg: [number, number][]) => seg.length >= 2);

    if (segs.length === 0) throw new Error('無路段資料');
    console.log(`[OSM] ${label}: ${segs.length} 路段`);
    return segs;
  } catch (e) {
    console.warn(`[OSM] ${label} 取得失敗:`, (e as Error).message);
    return [];
  }
}

/** 台鐵 TRA — 全台 railway=rail，排除 sidings/yards 及高鐵路軌（highspeed=yes） */
export async function loadTRAWayGeometry(): Promise<[number, number][][]> {
  // 明確排除 highspeed=yes（台灣高鐵路軌），避免與 THSR 圖層重疊
  const query = `[out:json][timeout:45];way["railway"="rail"]["highspeed"!="yes"]["service"!~"siding|yard|crossover"](21.9,119.9,25.4,122.0);out geom;`;
  try {
    const data = await fetchOverpass(query, 'TRA');
    const segs = (data.elements as any[])
      .filter(el => el.type === 'way' && el.geometry)
      .map(el =>
        (el.geometry as { lat: number; lon: number }[]).map(
          nd => [nd.lon, nd.lat] as [number, number]
        )
      )
      .filter(seg => seg.length >= 2);
    if (segs.length === 0) throw new Error('無路段資料');
    console.log(`[OSM] TRA: ${segs.length} 路段`);
    return segs;
  } catch (e) {
    console.warn('[OSM] TRA 取得失敗:', (e as Error).message);
    return [];
  }
}

/** 桃園捷運機場線 A — OSM relation 2108764（台北→環北全線）
 *  不用 bbox 查詢，避免抓到台北捷運 subway ways */
export async function loadTaoyuanMrtGeometry(): Promise<[number, number][][]> {
  const query = `[out:json][timeout:45];relation(2108764);way(r)["railway"];out geom;`;
  try {
    const data = await fetchOverpass(query, '桃捷');
    const segs = (data.elements as any[])
      .filter(el => el.type === 'way' && el.geometry)
      .map(el => (el.geometry as {lat:number;lon:number}[]).map(nd => [nd.lon, nd.lat] as [number,number]))
      .filter(seg => seg.length >= 2);
    if (segs.length === 0) throw new Error('無路段資料');
    console.log(`[OSM] 桃捷: ${segs.length} 路段`);
    return segs;
  } catch (e) {
    console.warn('[OSM] 桃捷取得失敗:', (e as Error).message);
    return [];
  }
}

/** 台中捷運綠線 — OSM relation 11330355 + 11330356（雙向取聯集去重） */
export async function loadTaichungMrtGeometry(): Promise<[number, number][][]> {
  const query = `[out:json][timeout:45];(relation(11330355);relation(11330356););way(r)["railway"];out geom;`;
  try {
    const data = await fetchOverpass(query, '中捷');
    const seen = new Set<number>();
    const segs = (data.elements as any[])
      .filter(el => el.type === 'way' && el.geometry && !seen.has(el.id) && seen.add(el.id))
      .map(el => (el.geometry as {lat:number;lon:number}[]).map(nd => [nd.lon, nd.lat] as [number,number]))
      .filter(seg => seg.length >= 2);
    if (segs.length === 0) throw new Error('無路段資料');
    console.log(`[OSM] 中捷: ${segs.length} 路段`);
    return segs;
  } catch (e) {
    console.warn('[OSM] 中捷取得失敗:', (e as Error).message);
    return [];
  }
}

/** 高雄捷運紅線+橘線+環狀輕軌 — 依顏色分組，回傳 MrtWayGroup[]
 *  紅線=4174828(#FF0000) 橘線=4174827(#FFA500) 環狀輕軌=6826886+6826887(#80B352)
 *
 *  ⚠️ colour 標籤在 relation 上，不在 way 上。
 *  使用 "out geom tags" on relation 直接讀取 member way 的幾何，
 *  並以 relation 的 colour tag 上色，確保三線正確分色。 */
export async function loadKaohsiungMrtGeometry(): Promise<MrtWayGroup[]> {
  // colour 在 relation，故直接查 relation 幾何（out geom tags 會內嵌 member way 幾何）
  const query = `[out:json][timeout:60];
(relation(4174828);relation(4174827);relation(6826886);relation(6826887););
out geom tags;`;

  // OSM 上各線的 colour tag（relation 層級）
  const FALLBACK: Record<number, string> = {
    4174828: '#FF0000',  // 紅線
    4174827: '#FFA500',  // 橘線
    6826886: '#80B352',  // 環狀輕軌（順行）
    6826887: '#80B352',  // 環狀輕軌（逆行）
  };

  try {
    const data = await fetchOverpass(query, '高捷');
    const colorMap = new Map<string, [number, number][][]>();
    const seen = new Set<number>();

    for (const rel of data.elements as any[]) {
      if (rel.type !== 'relation') continue;
      const color = rel.tags?.colour || rel.tags?.color || FALLBACK[rel.id as number] || '#EF4444';

      for (const member of (rel.members || []) as any[]) {
        if (member.type !== 'way' || !member.geometry || seen.has(member.ref)) continue;
        seen.add(member.ref);
        const seg: [number, number][] = (member.geometry as { lat: number; lon: number }[])
          .map(nd => [nd.lon, nd.lat]);
        if (seg.length < 2) continue;
        if (!colorMap.has(color)) colorMap.set(color, []);
        colorMap.get(color)!.push(seg);
      }
    }

    if (colorMap.size === 0) throw new Error('無路段資料');
    const result = Array.from(colorMap.entries()).map(([color, segments]) => ({ color, segments }));
    console.log(`[OSM] 高捷: ${result.length} 顏色組, ${seen.size} 路段`);
    return result;
  } catch (e) {
    console.warn('[OSM] 高捷取得失敗:', (e as Error).message);
    return [];
  }
}
