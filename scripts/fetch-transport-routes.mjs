// Snapshots Taiwan rail route geometry and stations from OpenStreetMap into
// src/05-landscape-geo-analysis/data/routes/*.json.
//
// Module 05 used to query Overpass every time a route layer was switched on,
// so the layers broke whenever the public Overpass mirrors were down or slow.
// This script reads each route relation from the OSM API (relation/<id>/full),
// which does not depend on Overpass. Rail lines rarely change; re-run it to
// refresh the snapshot:
//   node scripts/fetch-transport-routes.mjs [mrt thsr tra tymc tmrt krtc]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)),
  '../src/05-landscape-geo-analysis/data/routes');

const OSM_API = 'https://api.openstreetmap.org/api/0.6';
const TOLERANCE_DEG = 0.00002; // ≈ 2 m; Douglas–Peucker simplification
const MERGE_KM = 1.5;          // stop positions with the same name closer than this are one station
const round5 = (n) => Math.round(n * 1e5) / 1e5;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── OSM API ───────────────────────────────────────────────────────────────────
/** relation/<id>/full: the relation, its member ways and every node of those ways. */
async function fetchRelation(id) {
  for (let attempt = 1; ; attempt += 1) {
    await pause(1_000); // the OSM API asks for light, sequential use
    try {
      const res = await fetch(`${OSM_API}/relation/${id}/full.json`, {
        headers: { 'User-Agent': 'route-snapshot-script' },
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const nodes = new Map();
      const ways = new Map();
      let rel;
      for (const el of (await res.json()).elements) {
        if (el.type === 'node') nodes.set(el.id, el);
        else if (el.type === 'way') ways.set(el.id, el);
        else if (el.id === id) rel = el;
      }
      return { rel, nodes, ways };
    } catch (e) {
      if (attempt === 3) throw new Error(`relation ${id}: ${e.message}`);
      console.warn(`relation ${id}: ${e.message}, retrying`);
      await pause(10_000);
    }
  }
}

async function fetchRelations(ids, label) {
  const out = [];
  for (const id of ids) out.push(await fetchRelation(id));
  console.log(`${label}: ${ids.length} relation(s)`);
  return out;
}

// ── Geometry ──────────────────────────────────────────────────────────────────
function simplify(points) {
  if (points.length <= 2) return points;
  const kx = Math.cos((points[0][1] * Math.PI) / 180);
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = [points[a][0] * kx, points[a][1]];
    const [bx, by] = [points[b][0] * kx, points[b][1]];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = 0, maxI = -1;
    for (let i = a + 1; i < b; i += 1) {
      const px = points[i][0] * kx, py = points[i][1];
      const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > TOLERANCE_DEG) {
      keep[maxI] = 1;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Way → simplified, rounded [lng, lat][].
 * Nodes in `fixed` (junctions, stop positions) are never simplified away, so ways
 * that meet there share an identical vertex and the app can route trains along the
 * track from one station to the next.
 */
function waySegment(way, nodes, fixed) {
  const pts = [];
  const cuts = [];
  for (const id of way.nodes) {
    const nd = nodes.get(id);
    if (!nd) continue;
    if (fixed.has(id)) cuts.push(pts.length);
    pts.push([nd.lon, nd.lat]);
  }
  if (pts.length < 2) return [];
  const bounds = [...new Set([0, ...cuts, pts.length - 1])].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const part = simplify(pts.slice(bounds[i], bounds[i + 1] + 1));
    out.push(...(i ? part.slice(1) : part));
  }
  return out.map(([lng, lat]) => [round5(lng), round5(lat)]);
}

/** Nodes shared by two or more ways (junctions) and stop positions of the relations. */
function fixedNodes(relations) {
  const uses = new Map();
  const seenWays = new Set();
  const fixed = new Set();
  for (const { nodes, ways } of relations) {
    for (const way of ways.values()) {
      if (seenWays.has(way.id)) continue;
      seenWays.add(way.id);
      for (const id of new Set(way.nodes)) uses.set(id, (uses.get(id) ?? 0) + 1);
    }
    for (const nd of nodes.values()) if (isStop(nd.tags)) fixed.add(nd.id);
  }
  for (const [id, n] of uses) if (n >= 2) fixed.add(id);
  return fixed;
}

/**
 * Track ways of the given relations, each way once.
 * `pick(way, role, rel)` returns false to skip a way, or a colour string to group by.
 */
function collectWays(relations, pick, seen = new Set()) {
  const entries = [];
  const fixed = fixedNodes(relations);
  for (const { rel, nodes, ways } of relations) {
    for (const m of rel.members) {
      if (m.type !== 'way' || seen.has(m.ref)) continue;
      const way = ways.get(m.ref);
      if (!way) continue;
      const color = pick(way, m.role ?? '', rel);
      if (color === false) continue;
      seen.add(m.ref);
      const segment = waySegment(way, nodes, fixed);
      if (segment.length >= 2) entries.push({ color, segment });
    }
  }
  return entries;
}

const isTrack = (way, role) => !!way.tags?.railway && way.tags.railway !== 'platform' && !/platform/.test(role);

function groupByColor(entries) {
  const map = new Map();
  for (const { color, segment } of entries) {
    if (!map.has(color)) map.set(color, []);
    map.get(color).push(segment);
  }
  return [...map].map(([color, segments]) => ({ color, segments }));
}

// ── Stations ──────────────────────────────────────────────────────────────────
const isStop = (t) => !!t && (['stop', 'station', 'halt'].includes(t.railway)
  || ['stop_position', 'station'].includes(t.public_transport));
const stationName = (t) => (t.name || t['name:zh'] || t['name:zh-Hant'] || '').trim();
const nameKey = (name) => name.replace(/臺/g, '台').replace(/(火車|車)?站$/, '');

function distKm(a, b) {
  const kx = Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot((a.lon - b.lon) * kx, a.lat - b.lat) * 111.32;
}

/**
 * Some stop positions (many on TRA) carry no name and belong to no stop_area.
 * Take the name of the nearest station of the same kind mapped around them instead
 * (TRA / metro / THSR stations often share an area).
 */
const isMetroStation = (t) => ['subway', 'light_rail', 'monorail'].includes(t.station)
  || /捷運|輕軌|metro|MRT/i.test(`${t.operator ?? ''} ${t.network ?? ''}`);
const isThsrStation = (t) => /高鐵|高速鐵路|THSR/i.test(`${t.operator ?? ''} ${t.network ?? ''} ${t.name ?? ''}`);

async function nearbyStationName({ lon, lat }, kind) {
  const d = 0.003; // ≈ 300 m each way
  await pause(1_000);
  try {
    const res = await fetch(`${OSM_API}/map.json?bbox=${lon - d},${lat - d},${lon + d},${lat + d}`, {
      headers: { 'User-Agent': 'route-snapshot-script' },
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return '';
    const els = (await res.json()).elements;
    const nodes = new Map(els.filter((e) => e.type === 'node').map((n) => [n.id, n]));
    let best = '', bestKm = 0.6;
    for (const e of els) {
      const t = e.tags;
      if (!t || (t.railway !== 'station' && t.public_transport !== 'station')) continue;
      if (isThsrStation(t) || isMetroStation(t) !== (kind === 'metro')) continue;
      const name = stationName(t);
      if (!name) continue;
      let pos = e;
      if (e.type === 'way') {
        const pts = e.nodes.map((id) => nodes.get(id)).filter(Boolean);
        if (!pts.length) continue;
        pos = { lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length, lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length };
      } else if (e.type !== 'node') continue;
      const km = distKm(pos, { lon, lat });
      if (km < bestKm) { bestKm = km; best = name; }
    }
    return best;
  } catch {
    return '';
  }
}

function addToClusters(clusters, name, nd) {
  const key = nameKey(name);
  const c = clusters.find((cl) => cl.key === key && distKm(cl, nd) < MERGE_KM);
  if (c) {
    c.n += 1;
    c.sumLon += nd.lon; c.sumLat += nd.lat;
    c.lon = c.sumLon / c.n; c.lat = c.sumLat / c.n;
  } else {
    clusters.push({ key, name, n: 1, sumLon: nd.lon, sumLat: nd.lat, lon: nd.lon, lat: nd.lat });
  }
}

/**
 * Stop positions on the tracks (and stop members) of the relations, merged so that
 * each station is one point: one stop position per track/line → their average.
 */
async function collectStations(relations, kind) {
  const seen = new Set();
  const clusters = [];
  const unnamed = [];
  for (const { nodes } of relations) {
    for (const nd of nodes.values()) {
      if (seen.has(nd.id) || !isStop(nd.tags)) continue;
      seen.add(nd.id);
      const name = stationName(nd.tags);
      if (name) addToClusters(clusters, name, nd);
      else unnamed.push(nd);
    }
  }
  // Unnamed stop positions: group those of one station, then look its name up once.
  const groups = [];
  for (const nd of unnamed) {
    const g = groups.find((gr) => distKm(gr[0], nd) < 0.8);
    g ? g.push(nd) : groups.push([nd]);
  }
  for (const g of groups) {
    const centre = { lon: g.reduce((s, n) => s + n.lon, 0) / g.length, lat: g.reduce((s, n) => s + n.lat, 0) / g.length };
    const name = await nearbyStationName(centre, kind);
    console.log(`  unnamed stop(s) at ${centre.lat.toFixed(4)},${centre.lon.toFixed(4)} → ${name || '(skipped)'}`);
    if (name) for (const nd of g) addToClusters(clusters, name, nd);
  }
  return clusters.map(({ name, lon, lat }) => ({ name, coords: [round5(lon), round5(lat)] }));
}

// ── Taipei MRT colours ────────────────────────────────────────────────────────
const MRT_LINE_COLORS = {
  R: '#E3002C', BL: '#0070BD', G: '#008659', O: '#F8B61C', BR: '#C48A00',
  Y: '#FAD518', V: '#FEBEB5', K: '#C3B091',
};
const MRT_NAME_COLOR = [
  [/淡水|信義/, '#E3002C'], [/板南/, '#0070BD'], [/松山|新店/, '#008659'],
  [/中和|新蘆/, '#F8B61C'], [/文湖/, '#C48A00'], [/環狀/, '#FAD518'],
  [/新北投/, '#F890A5'], [/小碧潭/, '#CEDC00'], [/淡海|藍海|綠山/, '#FEBEB5'], [/安坑/, '#C3B091'],
];
function tagColor(tags = {}) {
  if (tags.colour) return tags.colour;
  if (tags.color) return tags.color;
  if (tags.ref && MRT_LINE_COLORS[tags.ref]) return MRT_LINE_COLORS[tags.ref];
  const name = tags.name || tags['name:zh'] || '';
  for (const [re, color] of MRT_NAME_COLOR) if (re.test(name)) return color;
  return null;
}

// ── Routes ────────────────────────────────────────────────────────────────────
// Taipei MRT + light rail: every line relation (both directions and branches).
const MRT_RELATIONS = [
  3343808, 5378981, 5633242, 9439377, // R 淡水信義線
  2665129, 9437206,                   // 新北投支線
  199038, 9437776,                    // BL 板南線
  447449, 4264892,                    // BR 文湖線
  447471, 4250356, 4250357, 9437777,  // G 松山新店線
  4250380, 4250381,                   // 小碧潭支線
  4250352, 4250353, 4250354, 4250355, // O 中和新蘆線
  3322093, 8165684,                   // Y 環狀線
  5990742, 9154523, 9154524, 13611116, // V 淡海輕軌
  15443525, 15443526,                 // K 安坑輕軌
];
// TRA passenger lines (route=railway relations; their stations are stop positions on the track).
const TRA_RELATIONS = [
  5867233, 5867234, 5571202, 1827334, 4252440, 4252441, 5224215, // 縱貫線 ×2, 臺中線(山線), 海岸線, 沙崙線 ×2, 成追線
  1827336, 5571467, 5571509, 20450147, 21055406,                 // 屏東線, 南迴線, 臺東線
  5867230, 5872818, 5867231, 5867232, 5149859, 5149860,          // 北迴線 ×2, 宜蘭線 ×2, 平溪線, 深澳線
  5207992, 5224213, 5224214, 5224252,                            // 內灣線, 六家線 ×2, 集集線
];
// Kaohsiung MRT: red, orange and both directions of the circular light rail.
const KRTC_RELATIONS = { 4174828: '#FF0000', 4174827: '#FFA500', 6826886: '#80B352', 6826887: '#80B352' };

const ROUTES = {
  async mrt() {
    const rels = await fetchRelations(MRT_RELATIONS, 'MRT');
    const entries = collectWays(rels, (way, role, rel) =>
      isTrack(way, role) && (tagColor(way.tags) ?? tagColor(rel.tags) ?? '#AAAAAA'));
    return { lines: groupByColor(entries), stations: await collectStations(rels, 'metro') };
  },
  async thsr() {
    // relation 9825284 = 高鐵 603 南港→左營, whose way members cover the whole line.
    // Stations stay in transportData.ts (THSR_STATIONS).
    const rels = await fetchRelations([9825284], 'THSR');
    return { lines: collectWays(rels, (way) => way.tags?.railway === 'rail' && '').map((e) => e.segment) };
  },
  async tra() {
    const rels = await fetchRelations(TRA_RELATIONS, 'TRA');
    const lines = collectWays(rels, (way) => way.tags?.railway === 'rail' && '').map((e) => e.segment);
    return { lines, stations: await collectStations(rels, 'train') };
  },
  async tymc() {
    const rels = await fetchRelations([2108764], '桃捷');
    return { lines: collectWays(rels, (way, role) => isTrack(way, role) && '').map((e) => e.segment), stations: await collectStations(rels, 'metro') };
  },
  async tmrt() {
    const rels = await fetchRelations([11330355, 11330356], '中捷');
    return { lines: collectWays(rels, (way, role) => isTrack(way, role) && '').map((e) => e.segment), stations: await collectStations(rels, 'metro') };
  },
  async krtc() {
    const rels = await fetchRelations(Object.keys(KRTC_RELATIONS).map(Number), '高捷');
    const entries = collectWays(rels, (way, role, rel) =>
      isTrack(way, role) && (rel.tags?.colour || rel.tags?.color || KRTC_RELATIONS[rel.id]));
    return { lines: groupByColor(entries), stations: await collectStations(rels, 'metro') };
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const only = process.argv.slice(2);
for (const [name, load] of Object.entries(ROUTES)) {
  if (only.length && !only.includes(name)) continue;
  const { lines, stations } = await load();
  if (!lines.length) throw new Error(`${name}: no geometry`);
  const file = path.join(OUT_DIR, `${name}.json`);
  const body = {
    source: '© OpenStreetMap contributors (ODbL)',
    fetched: new Date().toISOString().slice(0, 10),
    lines,
    ...(stations && { stations }),
  };
  fs.writeFileSync(file, JSON.stringify(body));
  const segs = lines.reduce((n, l) => n + (l.segments ? l.segments.length : 1), 0);
  console.log(`  → ${path.relative(process.cwd(), file)} (${(fs.statSync(file).size / 1024).toFixed(0)} KB, ${segs} segments${stations ? `, ${stations.length} stations` : ''})`);
}
