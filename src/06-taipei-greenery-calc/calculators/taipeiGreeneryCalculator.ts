import { STANDARDS, TREE_AREA, COOL, CARBON } from '../constants';
import type { TaipeiGreeneryInput } from '../types';

export interface TaipeiGreeneryResult {
  std: typeof STANDARDS[keyof typeof STANDARDS];
  base: number;
  legalSpace: number;
  calcFootprint: number;
  A_prime: number;
  alpha: number;
  hsArea: number;
  lsArea: number;
  groundShrubArea: number;
  groundOther: number;
  grassArea: number;
  ditchExtra: number;
  brickArea: number;
  pondArea: number;
  wallArea: number;
  vertHsArea: number;
  vertLsArea: number;
  vertShrubArea: number;
  vertOtherArea: number;
  roofHs: number;
  roofLs: number;
  roofPalm: number;
  roofShrubArea: number;
  roofOtherArea: number;
  roofGreen: number;
  greenableRoof: number;
  allHs: number;
  allLs: number;
  allShrub: number;
  allOther: number;
  totalGreen: number;
  coverRate: number;
  effectiveGreen: number;
  volumeRate: number;
  ecoLayerVal: number;
  carbonLargeArea: number;
  carbonSmallArea: number;
  carbonPalmArea: number;
  actualCarbon: number;
  reqCarbon: number;
  roadsideTrees: number;
  roadsideCover: number;
  roofRate: number;
  roofShrubPct: number;
  permeableRate: number;
  // ── Explicit pass/fail flags (derived from computed values; no new formulas) ──
  coverPass: boolean | null;       // 第5條第1項：綠覆率 ≥ std.cover
  volumePass: boolean | null;      // 第5條第2項：綠容率 ≥ std.volume
  carbonPass: boolean | null;      // 第6條：固碳量 ≥ reqCarbon
  roadsidePass: boolean | null;    // 第7條第2項：臨道路喬木綠覆率 ≥ 80%
  roofShrubPass: boolean | null;   // 第9條第1項：屋頂灌木比例 ≥ 30%
  roofRatePass: boolean | null;    // 第9條第2項：屋頂綠覆率 ≥ 50%
  permeablePass: boolean | null;   // 第12條：透水鋪面比例 ≥ 50%
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

const treeGroupArea = (L: string, M: string, S: string, P: string, factor = 1) =>
  (n(L) * TREE_AREA.large + n(M) * TREE_AREA.medium + n(S) * TREE_AREA.small + n(P) * TREE_AREA.palm) * factor;

export function computeTaipeiGreenery(input: TaipeiGreeneryInput): TaipeiGreeneryResult {
  const { site, tree, ground, roof } = input;

  // ── 計算：基地 ────────────────────────────────────────────────────────────
  const std           = STANDARDS[site.buildingClass];
  const base          = n(site.baseArea);
  const legalSpace    = base * (1 - n(site.bcr) / 100);
  const calcFootprint = base * n(site.bcr) / 100;

  // A'（最小綠化面積）— 技術規範公式(4)：(A₀-Ap)×(1-r)，且不得低於 0.15×A₀
  const A_prime = base > 0
    ? Math.max((base - n(site.nonGreenable)) * (1 - n(site.bcr) / 100), 0.15 * base)
    : 0;

  // α（生態綠化修正係數）— 全無生態綠化者為 0.8，全面者為 1.3
  const alpha = Math.max(0.8, Math.min(1.3, n(site.alphaInput) || 0.8));

  // ── 計算：法定空地喬木 ────────────────────────────────────────────────────
  const hsArea =
    treeGroupArea(tree.hs150L,tree.hs150M,tree.hs150S,tree.hs150P,1.0) +
    treeGroupArea(tree.hs120L,tree.hs120M,tree.hs120S,tree.hs120P,0.8) +
    treeGroupArea(tree.hs100L,tree.hs100M,tree.hs100S,tree.hs100P,0.6);

  const lsArea =
    treeGroupArea(tree.ls150L,tree.ls150M,tree.ls150S,tree.ls150P,1.0) +
    treeGroupArea(tree.ls120L,tree.ls120M,tree.ls120S,tree.ls120P,0.8) +
    treeGroupArea(tree.ls100L,tree.ls100M,tree.ls100S,tree.ls100P,0.6);

  // ── 計算：法定空地其他植栽 ────────────────────────────────────────────────
  const grassArea       = n(ground.groundGrass);
  const ditchExtra      = n(ground.groundDitch) * 0.4 * 0.1;
  const brickArea       = n(ground.groundBrick) / 3;
  const pondArea        = n(ground.groundPond) / 3;
  const wallArea        = n(ground.groundWallW) * 3 * n(ground.groundWallF);
  const groundOther     = grassArea + ditchExtra + brickArea + pondArea + wallArea;
  const groundShrubArea = n(ground.groundShrub);

  // ── 計算：立體綠化 ────────────────────────────────────────────────────────
  const vertHsArea    = treeGroupArea(tree.vertHsL,tree.vertHsM,tree.vertHsS,tree.vertHsP);
  const vertLsArea    = treeGroupArea(tree.vertLsL,tree.vertLsM,tree.vertLsS,tree.vertLsP);
  const vertShrubArea = n(ground.vertShrub);
  const vertOtherArea = n(ground.vertOther);

  // ── 計算：屋頂 ────────────────────────────────────────────────────────────
  const roofHs        = n(roof.roofHsArea);
  const roofLs        = n(roof.roofLsArea);
  const roofPalm      = n(roof.roofPalmArea);
  const roofShrubArea = n(roof.roofShrub);
  const roofOtherArea = n(roof.roofOther);
  const roofGreen     = roofHs + roofLs + roofPalm + roofShrubArea + roofOtherArea;
  const greenableRoof = Math.max(0, n(roof.roofTotal) - n(roof.roofNonGreen));

  // ── 計算：各類別合計（用於降溫係數/綠容率）──────────────────────────────
  const allHs      = hsArea + vertHsArea + roofHs;
  const allLs      = lsArea + vertLsArea + roofLs + roofPalm;
  const allShrub   = groundShrubArea + vertShrubArea + roofShrubArea;
  const allOther   = groundOther + vertOtherArea + roofOtherArea;
  const totalGreen = allHs + allLs + allShrub + allOther;

  // ── 第5條 ─────────────────────────────────────────────────────────────────
  const coverRate      = legalSpace > 0 ? (totalGreen / legalSpace) * 100 : 0;
  const effectiveGreen =
    allHs * COOL.highShade + allLs * COOL.lowShade +
    allShrub * COOL.shrub  + allOther * COOL.other;
  const volumeRate     = base > 0 ? effectiveGreen / base : 0;

  // ── 第6條：固碳計算 ───────────────────────────────────────────────────────
  // 棕櫚類（P欄）獨立計算固碳 Gi=0.66（從 hs/ls 扣除）
  const groundHsPalmArea = (n(tree.hs150P)*1.0 + n(tree.hs120P)*0.8 + n(tree.hs100P)*0.6) * TREE_AREA.palm;
  const groundLsPalmArea = (n(tree.ls150P)*1.0 + n(tree.ls120P)*0.8 + n(tree.ls100P)*0.6) * TREE_AREA.palm;
  const vertHsPalmCarbon = n(tree.vertHsP) * TREE_AREA.palm;
  const vertLsPalmCarbon = n(tree.vertLsP) * TREE_AREA.palm;
  // 棕櫚類總固碳面積（含屋頂）
  const carbonPalmArea  = groundHsPalmArea + groundLsPalmArea + vertHsPalmCarbon + vertLsPalmCarbon + roofPalm;
  // 闊葉大喬木（hs 扣除棕櫚，Gi=1.50）
  const carbonLargeArea = allHs - groundHsPalmArea - vertHsPalmCarbon;
  // 闊葉小喬木（ls 扣除棕櫚，Gi=1.00；roofPalm 已含在 allLs 中故須扣）
  const carbonSmallArea = (lsArea - groundLsPalmArea) + (vertLsArea - vertLsPalmCarbon) + roofLs;

  const ecoLayerVal = n(ground.ecoLayerArea);

  // TCO₂ = (ΣGi×Ai) × α — 技術規範公式(2)
  const actualCarbon = (
    ecoLayerVal     * CARBON.ecoLayer   +
    carbonLargeArea * CARBON.largeBroad +
    carbonSmallArea * CARBON.smallTree  +
    carbonPalmArea  * CARBON.palm       +
    allShrub        * CARBON.shrub      +
    allOther        * CARBON.grass
  ) * alpha;

  // TCO₂c = 0.5 × A' × β — 技術規範公式(3)
  const reqCarbon = A_prime > 0 ? (A_prime / 2) * std.carbon : 0;

  // ── 第7條第2項 ────────────────────────────────────────────────────────────
  const roadsideTrees = n(tree.rsL)*TREE_AREA.large + n(tree.rsM)*TREE_AREA.medium + n(tree.rsS)*TREE_AREA.small;
  const roadsideCover = n(tree.roadsideSpace) > 0 ? (roadsideTrees / n(tree.roadsideSpace)) * 100 : 0;

  // ── 第9條 ─────────────────────────────────────────────────────────────────
  const roofRate     = greenableRoof > 0 ? (roofGreen / greenableRoof) * 100 : 0;
  const roofShrubPct = roofGreen > 0 ? (roofShrubArea / roofGreen) * 100 : 0;

  // ── 第12條 ────────────────────────────────────────────────────────────────
  const permeableRate = n(roof.pavTotal) > 0 ? (n(roof.pavPerm) / n(roof.pavTotal)) * 100 : 0;

  // ── 檢核清單 ──────────────────────────────────────────────────────────────
  const checks = [
    {
      art: '第5條第1項', name: `綠覆率（${std.name}）`,
      req: `≥ ${std.cover}%`, act: `${coverRate.toFixed(2)}%`,
      pass: base > 0 ? coverRate >= std.cover : null,
      formula: `總綠覆面積 ${totalGreen.toFixed(2)} m² ÷ 法定空地 ${legalSpace.toFixed(2)} m²`,
    },
    {
      art: '第5條第2項', name: `綠容率（${std.name}）`,
      req: `≥ ${std.volume}`, act: volumeRate.toFixed(3),
      pass: base > 0 ? volumeRate >= std.volume : null,
      formula: `等效綠覆 ${effectiveGreen.toFixed(2)} m² ÷ 基地面積 ${base.toFixed(2)} m²`,
    },
    {
      art: '第6條', name: '綠化總固碳當量',
      req: `≥ ${reqCarbon.toFixed(2)} kgCO₂e/yr`, act: `${actualCarbon.toFixed(2)} kgCO₂e/yr`,
      pass: base > 0 ? actualCarbon >= reqCarbon : null,
      formula: `(ΣGi×Ai)×α(${alpha.toFixed(2)}) ≥ 0.5×A'(${A_prime.toFixed(2)} m²)×β(${std.carbon})`,
    },
    {
      art: '第7條第2項', name: '臨道路開放空間喬木綠覆率',
      req: '≥ 80%', act: n(tree.roadsideSpace) > 0 ? `${roadsideCover.toFixed(2)}%` : '無此空間',
      pass: n(tree.roadsideSpace) > 0 ? roadsideCover >= 80 : null,
      formula: `喬木面積 ${roadsideTrees.toFixed(2)} m² ÷ 開放空間 ${n(tree.roadsideSpace).toFixed(2)} m²`,
    },
    {
      art: '第9條第1項', name: '屋頂灌木面積比例',
      req: '≥ 30%', act: `${roofShrubPct.toFixed(2)}%`,
      pass: n(roof.roofTotal) > 0 ? roofShrubPct >= 30 : null,
      formula: `灌木 ${roofShrubArea.toFixed(2)} m² ÷ 屋頂綠覆 ${roofGreen.toFixed(2)} m²`,
    },
    {
      art: '第9條第2項', name: '屋頂平臺綠覆率',
      req: '≥ 50%', act: `${roofRate.toFixed(2)}%`,
      pass: n(roof.roofTotal) > 0 ? roofRate >= 50 : null,
      formula: `綠覆 ${roofGreen.toFixed(2)} m² ÷ 可綠化屋頂 ${greenableRoof.toFixed(2)} m²`,
    },
    {
      art: '第12條', name: '透水鋪面比例',
      req: '≥ 50%', act: `${permeableRate.toFixed(2)}%`,
      pass: n(roof.pavTotal) > 0 ? permeableRate >= 50 : null,
      formula: `透水面積 ${n(roof.pavPerm).toFixed(2)} m² ÷ 鋪面總計 ${n(roof.pavTotal).toFixed(2)} m²`,
    },
  ];

  const passCount    = checks.filter(c => c.pass === true).length;
  const failCount    = checks.filter(c => c.pass === false).length;
  const pendingCount = checks.filter(c => c.pass === null).length;

  // ── Explicit pass/fail flags (derived from same conditions as checks array) ──
  const coverPass:      boolean | null = base > 0          ? coverRate >= std.cover       : null;
  const volumePass:     boolean | null = base > 0          ? volumeRate >= std.volume     : null;
  const carbonPass:     boolean | null = base > 0          ? actualCarbon >= reqCarbon    : null;
  const roadsidePass:   boolean | null = n(tree.roadsideSpace) > 0 ? roadsideCover >= 80 : null;
  const roofShrubPass:  boolean | null = n(roof.roofTotal) > 0 ? roofShrubPct >= 30      : null;
  const roofRatePass:   boolean | null = n(roof.roofTotal) > 0 ? roofRate >= 50          : null;
  const permeablePass:  boolean | null = n(roof.pavTotal)  > 0 ? permeableRate >= 50     : null;

  return {
    std, base, legalSpace, calcFootprint, A_prime,
    alpha,
    hsArea, lsArea, groundShrubArea, groundOther,
    grassArea, ditchExtra, brickArea, pondArea, wallArea,
    vertHsArea, vertLsArea, vertShrubArea, vertOtherArea,
    roofHs, roofLs, roofPalm, roofShrubArea, roofOtherArea,
    roofGreen, greenableRoof,
    allHs, allLs, allShrub, allOther, totalGreen,
    coverRate, effectiveGreen, volumeRate,
    ecoLayerVal, carbonLargeArea, carbonSmallArea, carbonPalmArea,
    actualCarbon, reqCarbon,
    roadsideTrees, roadsideCover,
    roofRate, roofShrubPct,
    permeableRate,
    coverPass, volumePass, carbonPass, roadsidePass,
    roofShrubPass, roofRatePass, permeablePass,
    checks, passCount, failCount, pendingCount,
  };
}
