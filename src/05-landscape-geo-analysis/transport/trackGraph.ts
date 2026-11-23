/**
 * trackGraph — routes trains along the real track between two stations.
 *
 * The route snapshot (data/routes/*.json) keeps every junction and stop position
 * as an exact shared vertex, so the segments form a connected network: vertices
 * are graph nodes, consecutive vertices are edges. A leg between two stations is
 * the shortest path between their nearest vertices.
 */

type LngLat = [number, number];

export interface TrackPath {
  pts: LngLat[];
  /** cumulative length in metres at each point */
  cum: number[];
  total: number;
}

const M_PER_DEG = 111_320;

function metres(a: LngLat, b: LngLat): number {
  const kx = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  return Math.hypot((b[0] - a[0]) * kx, b[1] - a[1]) * M_PER_DEG;
}

function makePath(pts: LngLat[]): TrackPath {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + metres(pts[i - 1], pts[i]));
  return { pts, cum, total: cum[cum.length - 1] };
}

/** Point at `frac` (0–1) of the path's length. */
export function pointAlong(path: TrackPath, frac: number): LngLat {
  const { pts, cum, total } = path;
  if (pts.length === 1 || total === 0) return pts[0];
  const d = Math.min(Math.max(frac, 0), 1) * total;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid; else hi = mid;
  }
  const span = cum[hi] - cum[lo];
  const t = span ? (d - cum[lo]) / span : 0;
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t];
}

// ── Min-heap of [distance, node] ─────────────────────────────────────────────
class Heap {
  private d: number[] = [];
  private n: number[] = [];
  get size() { return this.d.length; }
  push(dist: number, node: number) {
    const { d, n } = this;
    let i = d.length;
    d.push(dist); n.push(node);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (d[p] <= d[i]) break;
      [d[p], d[i]] = [d[i], d[p]]; [n[p], n[i]] = [n[i], n[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const { d, n } = this;
    const top: [number, number] = [d[0], n[0]];
    const ld = d.pop()!, ln = n.pop()!;
    if (d.length) {
      d[0] = ld; n[0] = ln;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < d.length && d[l] < d[m]) m = l;
        if (r < d.length && d[r] < d[m]) m = r;
        if (m === i) break;
        [d[m], d[i]] = [d[i], d[m]]; [n[m], n[i]] = [n[i], n[m]];
        i = m;
      }
    }
    return top;
  }
}

export class TrackGraph {
  private coords: LngLat[] = [];
  private adj: { to: number; len: number }[][] = [];
  private paths = new Map<string, TrackPath>();
  private stationNodes = new Map<string, number>();
  /** vertices [0, trackCount) are track; station nodes are appended after them */
  private trackCount = 0;

  constructor(segments: LngLat[][]) {
    const index = new Map<string, number>();
    const node = (p: LngLat) => {
      const key = `${p[0]},${p[1]}`;
      let i = index.get(key);
      if (i === undefined) {
        i = this.coords.length;
        index.set(key, i);
        this.coords.push(p);
        this.adj.push([]);
      }
      return i;
    };
    for (const seg of segments) {
      for (let k = 1; k < seg.length; k++) {
        const a = node(seg[k - 1]), b = node(seg[k]);
        if (a === b) continue;
        const len = metres(seg[k - 1], seg[k]);
        this.adj[a].push({ to: b, len });
        this.adj[b].push({ to: a, len });
      }
    }
    this.bridgeGaps();
    this.trackCount = this.coords.length;
  }

  /**
   * Route relations leave short gaps at some stations and junctions (the connecting
   * station tracks are not relation members), which would split the network or force
   * detours. Join each dead end to the nearest vertex of another track within
   * `maxMetres`, ignoring vertices of its own track (reachable within 600 m).
   */
  private bridgeGaps(maxMetres = 300) {
    const CELL = 0.003; // ≈ 300 m
    const cell = (p: LngLat) => `${Math.floor(p[0] / CELL)},${Math.floor(p[1] / CELL)}`;
    const grid = new Map<string, number[]>();
    this.coords.forEach((p, i) => {
      const k = cell(p);
      const list = grid.get(k);
      if (list) list.push(i); else grid.set(k, [i]);
    });
    const ends = this.coords.map((_, i) => i).filter(i => this.adj[i].length === 1);
    for (const e of ends) {
      const own = this.reachable(e, 600);
      const [cx, cy] = cell(this.coords[e]).split(',').map(Number);
      let best = -1, bestD = maxMetres;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (const j of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
            if (own.has(j)) continue;
            const d = metres(this.coords[e], this.coords[j]);
            if (d < bestD) { bestD = d; best = j; }
          }
        }
      }
      if (best >= 0) {
        this.adj[e].push({ to: best, len: bestD });
        this.adj[best].push({ to: e, len: bestD });
      }
    }
  }

  /** Vertices within `limit` metres of `src` along the track. */
  private reachable(src: number, limit: number): Set<number> {
    const seen = new Map<number, number>([[src, 0]]);
    const stack = [src];
    while (stack.length) {
      const u = stack.pop()!;
      const du = seen.get(u)!;
      for (const { to, len } of this.adj[u]) {
        const d = du + len;
        if (d <= limit && d < (seen.get(to) ?? Infinity)) { seen.set(to, d); stack.push(to); }
      }
    }
    return new Set(seen.keys());
  }

  /** Where a train stops for a station: on the nearest track (the station itself if far from any). */
  stationPoint(p: LngLat): LngLat {
    const node = this.stationNode(p);
    return node >= 0 ? this.coords[node] : p;
  }

  /**
   * Graph node for a station: a vertex on the nearest track, linked to every track
   * vertex near the station. The two directions of double track are separate ways in
   * the data and only meet at junctions; linking them at stations lets a train change
   * track there instead of detouring to the next junction. -1 if no track within 1.5 km.
   */
  private stationNode(p: LngLat): number {
    const key = `${p[0]},${p[1]}`;
    const hit = this.stationNodes.get(key);
    if (hit !== undefined) return hit;
    const dist: number[] = [];
    let d0 = Infinity, nearest = -1;
    for (let i = 0; i < this.trackCount; i++) {
      dist.push(metres(p, this.coords[i]));
      if (dist[i] < d0) { d0 = dist[i]; nearest = i; }
    }
    let node = -1;
    if (d0 <= 1_500) {
      const at = this.coords[nearest];
      node = this.coords.length;
      this.coords.push(at);
      this.adj.push([]);
      const reach = Math.max(200, d0 + 100);
      for (let i = 0; i < this.trackCount; i++) {
        if (dist[i] > reach) continue;
        const len = metres(at, this.coords[i]);
        this.adj[node].push({ to: i, len });
        this.adj[i].push({ to: node, len });
      }
    }
    this.stationNodes.set(key, node);
    return node;
  }

  /**
   * Track path between two stations (cached). Falls back to a straight line when a
   * station is far from the track, the network has a gap, or the found path is an
   * implausible detour.
   */
  path(from: LngLat, to: LngLat): TrackPath {
    const key = `${from}|${to}`;
    const cached = this.paths.get(key);
    if (cached) return cached;
    const a = this.stationNode(from), b = this.stationNode(to);
    const straight = makePath([from, to]);
    let result = straight;
    if (a >= 0 && b >= 0 && a !== b) {
      const pts = this.shortest(a, b);
      if (pts) {
        const p = makePath(pts);
        if (p.total <= straight.total * 2.5 + 2_000) result = p;
      }
    }
    this.paths.set(key, result);
    return result;
  }

  private shortest(src: number, dst: number): LngLat[] | null {
    const dist = new Float64Array(this.coords.length).fill(Infinity);
    const prev = new Int32Array(this.coords.length).fill(-1);
    const heap = new Heap();
    dist[src] = 0;
    heap.push(0, src);
    while (heap.size) {
      const [d, u] = heap.pop();
      if (d > dist[u]) continue;
      if (u === dst) break;
      for (const { to, len } of this.adj[u]) {
        const nd = d + len;
        if (nd < dist[to]) { dist[to] = nd; prev[to] = u; heap.push(nd, to); }
      }
    }
    if (!Number.isFinite(dist[dst])) return null;
    const pts: LngLat[] = [];
    for (let u = dst; u !== -1; u = prev[u]) pts.push(this.coords[u]);
    return pts.reverse();
  }
}
