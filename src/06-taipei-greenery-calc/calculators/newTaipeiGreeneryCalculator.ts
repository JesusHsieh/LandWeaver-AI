/** 附表一：喬木綠覆面積（m²/株） */
export const NT_TREE_COVER = { small: 10, medium: 15, large: 20 } as const;

export interface NewTaipeiGreeneryInput {
  openSpace: string;
  greenArea: string;
  nonGreenable43: string;
  isDesignReview: boolean;
  roofArea44: string;
  roofPlantArea44: string;
  roofSolarArea44: string;
  treeSmall: string;
  treeMedium: string;
  treeLarge: string;
  shrubArea: string;
  groundCoverArea: string;
  grassBrickArea: string;
  pondArea: string;
  vineArea: string;
  roofGreenArea: string;
  includeRoofInCoverage: boolean;
}

export interface NewTaipeiGreeneryResult {
  os: number;
  ga: number;
  treeSmallCount: number;
  treeMediumCount: number;
  treeLargeCount: number;
  totalTreeCount: number;
  requiredTrees: number;
  treeCover: number;
  shrubCover: number;
  groundCover: number;
  grassBrickCover: number;
  pondCover: number;
  vineCover: number;
  roofCover: number;
  totalCover: number;
  coverRate: number;
  greenableArea43: number;
  requiredPlant43: number;
  actualPlant43: number;
  roofA44: number;
  roofPA44: number;
  roofSA44: number;
  roofGreenEnergy44: number;
  roofGreenRate44: number;
  // ── Explicit pass/fail flags (derived from computed values; no new formulas) ──
  plant43Pass: boolean | null;   // 第43條：實設空地植栽面積
  treePass:    boolean | null;   // 第8條(一)-3：喬木配置數量
  coverPass:   boolean | null;   // 第8條(三)：綠覆率 ≥ 100%
  roof44Pass:  boolean | null;   // 第44條：屋頂綠能設施 ≥ 50%
  checks: Array<{
    art: string;
    name: string;
    req: string;
    act: string;
    pass: boolean | null;
    formula: string;
  }>;
  passCount: number;
  failCount: number;
  pendingCount: number;
}

const n = (v: string) => parseFloat(v) || 0;

export function computeNewTaipeiGreenery(input: NewTaipeiGreeneryInput): NewTaipeiGreeneryResult {
  // ── 計算 ──────────────────────────────────────────────────────────────────
  const os = n(input.openSpace);
  const ga = n(input.greenArea);

  // 喬木
  const treeSmallCount  = Math.floor(n(input.treeSmall));
  const treeMediumCount = Math.floor(n(input.treeMedium));
  const treeLargeCount  = Math.floor(n(input.treeLarge));
  const totalTreeCount  = treeSmallCount + treeMediumCount + treeLargeCount;
  const requiredTrees   = ga > 0 ? Math.floor(ga / 36) : 0;

  // 各類綠覆面積（第8條(四)）
  const treeCover       = treeSmallCount * NT_TREE_COVER.small
                        + treeMediumCount * NT_TREE_COVER.medium
                        + treeLargeCount  * NT_TREE_COVER.large;
  const shrubCover      = n(input.shrubArea) * 1.5;
  const groundCover     = n(input.groundCoverArea);
  const grassBrickCover = n(input.grassBrickArea) * 0.5;
  const pondCover       = n(input.pondArea) / 3;
  const vineCover       = n(input.vineArea);
  const roofCover       = input.includeRoofInCoverage ? n(input.roofGreenArea) : 0;

  const totalCover = treeCover + shrubCover + groundCover + grassBrickCover + pondCover + vineCover + roofCover;
  const coverRate  = os > 0 ? (totalCover / os) * 100 : 0;

  // ── 第43條 ────────────────────────────────────────────────────────────────
  const greenableArea43 = Math.max(0, os - n(input.nonGreenable43));
  const requiredPlant43 = greenableArea43 / 2;
  // 植栽實際面積（喬木以樹冠投影計，其餘以實際面積計，立體綠化補償計入）
  const actualPlant43   = treeCover
                        + n(input.shrubArea)
                        + n(input.groundCoverArea)
                        + n(input.grassBrickArea)
                        + n(input.pondArea)
                        + n(input.vineArea)
                        + n(input.roofGreenArea);

  // ── 第44條 ────────────────────────────────────────────────────────────────
  const roofA44          = n(input.roofArea44);
  const roofPA44         = n(input.roofPlantArea44);
  const roofSA44         = n(input.roofSolarArea44);
  const roofGreenEnergy44 = roofPA44 + roofSA44;           // 合計綠能面積
  const roofGreenRate44  = roofA44 > 0 ? (roofGreenEnergy44 / roofA44) * 100 : 0;

  // ── 檢核清單 ──────────────────────────────────────────────────────────────
  const checks = [
    {
      art: '第43條', name: '實設空地植栽面積',
      req: os > 0 ? `≥ ${requiredPlant43.toFixed(2)} m²` : '—',
      act: `${actualPlant43.toFixed(2)} m²`,
      pass: os > 0 ? actualPlant43 >= requiredPlant43 : null,
      formula: `可綠化空地 (${os.toFixed(2)} − ${n(input.nonGreenable43).toFixed(2)}) m² × 50% = ${requiredPlant43.toFixed(2)} m²`,
    },
    {
      art: '第8條(一)第3款', name: '喬木配置需求數量',
      req: `≥ ${requiredTrees} 棵`,
      act: `${totalTreeCount} 棵`,
      pass: ga > 0 ? totalTreeCount >= requiredTrees : null,
      formula: `綠化範圍 ${ga.toFixed(2)} m² ÷ 36 m²/棵 = ${requiredTrees} 棵（取整）`,
    },
    {
      art: '第8條(三)', name: '綠覆率',
      req: '≥ 100%',
      act: `${coverRate.toFixed(2)}%`,
      pass: os > 0 ? coverRate >= 100 : null,
      formula: `總綠覆 ${totalCover.toFixed(2)} m² ÷ 實設空地 ${os.toFixed(2)} m²`,
    },
    {
      art: '第44條', name: '屋頂綠能設施',
      req: input.isDesignReview ? '≥ 50%' : '不適用',
      act: input.isDesignReview ? (roofA44 > 0 ? `${roofGreenRate44.toFixed(2)}%` : '—') : '—',
      pass: input.isDesignReview ? (roofA44 > 0 ? roofGreenRate44 >= 50 : null) : null,
      formula: input.isDesignReview
        ? `（屋頂綠化 ${roofPA44.toFixed(2)} + 太陽光電 ${roofSA44.toFixed(2)}）m² ÷ 屋頂面積 ${roofA44.toFixed(2)} m²`
        : '非都設會審議案，免設',
    },
  ];

  const passCount    = checks.filter(c => c.pass === true).length;
  const failCount    = checks.filter(c => c.pass === false).length;
  const pendingCount = checks.filter(c => c.pass === null).length;

  // ── Explicit pass/fail flags (same conditions as checks array) ──
  const plant43Pass: boolean | null = os > 0 ? actualPlant43 >= requiredPlant43 : null;
  const treePass:    boolean | null = ga > 0 ? totalTreeCount >= requiredTrees   : null;
  const coverPass:   boolean | null = os > 0 ? coverRate >= 100                 : null;
  const roof44Pass:  boolean | null = input.isDesignReview
    ? (roofA44 > 0 ? roofGreenRate44 >= 50 : null)
    : null;

  return {
    os, ga,
    treeSmallCount, treeMediumCount, treeLargeCount, totalTreeCount, requiredTrees,
    treeCover, shrubCover, groundCover, grassBrickCover, pondCover, vineCover, roofCover,
    totalCover, coverRate,
    greenableArea43, requiredPlant43, actualPlant43,
    roofA44, roofPA44, roofSA44, roofGreenEnergy44, roofGreenRate44,
    plant43Pass, treePass, coverPass, roof44Pass,
    checks, passCount, failCount, pendingCount,
  };
}
