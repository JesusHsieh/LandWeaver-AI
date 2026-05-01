import { useState } from 'react';
import { n } from '../utils';

/** 附表一：喬木綠覆面積（m²/株） */
export const NT_TREE_COVER = { small: 10, medium: 15, large: 20 } as const;

export function useNewTaipeiCalc() {
  // ── 基地基本資料 ──────────────────────────────────────────────────────────
  const [openSpace, setOpenSpace] = useState('');   // 實設空地面積
  const [greenArea, setGreenArea] = useState('');   // 應綠化範圍面積（喬木需求計算用）

  // ── 第43條：植栽面積 ─────────────────────────────────────────────────────
  const [nonGreenable43, setNonGreenable43] = useState('');  // 無法綠化之面積

  // ── 第44條：屋頂綠能 ─────────────────────────────────────────────────────
  const [isDesignReview, setIsDesignReview]     = useState(false);
  const [roofArea44, setRoofArea44]             = useState('');  // 屋頂總面積
  const [roofPlantArea44, setRoofPlantArea44]   = useState('');  // 屋頂綠化面積
  const [roofSolarArea44, setRoofSolarArea44]   = useState('');  // 太陽光電設備面積

  // ── 喬木（附表一三分級）─────────────────────────────────────────────────
  const [treeSmall,  setTreeSmall]  = useState('');
  const [treeMedium, setTreeMedium] = useState('');
  const [treeLarge,  setTreeLarge]  = useState('');

  // ── 其他植栽 ──────────────────────────────────────────────────────────────
  const [shrubArea,       setShrubArea]       = useState('');
  const [groundCoverArea, setGroundCoverArea] = useState('');
  const [grassBrickArea,  setGrassBrickArea]  = useState('');
  const [pondArea,        setPondArea]        = useState('');
  const [vineArea,        setVineArea]        = useState('');

  // ── 立體綠化（屋頂、陽台補償）─────────────────────────────────────────────
  const [roofGreenArea,          setRoofGreenArea]          = useState('');
  const [includeRoofInCoverage,  setIncludeRoofInCoverage]  = useState(true);

  // ── 計算 ──────────────────────────────────────────────────────────────────
  const os = n(openSpace);
  const ga = n(greenArea);

  // 喬木
  const treeSmallCount  = Math.floor(n(treeSmall));
  const treeMediumCount = Math.floor(n(treeMedium));
  const treeLargeCount  = Math.floor(n(treeLarge));
  const totalTreeCount  = treeSmallCount + treeMediumCount + treeLargeCount;
  const requiredTrees   = ga > 0 ? Math.floor(ga / 36) : 0;

  // 各類綠覆面積（第8條(四)）
  const treeCover       = treeSmallCount * NT_TREE_COVER.small
                        + treeMediumCount * NT_TREE_COVER.medium
                        + treeLargeCount  * NT_TREE_COVER.large;
  const shrubCover      = n(shrubArea) * 1.5;
  const groundCover     = n(groundCoverArea);
  const grassBrickCover = n(grassBrickArea) * 0.5;
  const pondCover       = n(pondArea) / 3;
  const vineCover       = n(vineArea);
  const roofCover       = includeRoofInCoverage ? n(roofGreenArea) : 0;

  const totalCover = treeCover + shrubCover + groundCover + grassBrickCover + pondCover + vineCover + roofCover;
  const coverRate  = os > 0 ? (totalCover / os) * 100 : 0;

  // ── 第43條 ────────────────────────────────────────────────────────────────
  const greenableArea43 = Math.max(0, os - n(nonGreenable43));
  const requiredPlant43 = greenableArea43 / 2;
  // 植栽實際面積（喬木以樹冠投影計，其餘以實際面積計，立體綠化補償計入）
  const actualPlant43   = treeCover
                        + n(shrubArea)
                        + n(groundCoverArea)
                        + n(grassBrickArea)
                        + n(pondArea)
                        + n(vineArea)
                        + n(roofGreenArea);

  // ── 第44條 ────────────────────────────────────────────────────────────────
  const roofA44          = n(roofArea44);
  const roofPA44         = n(roofPlantArea44);
  const roofSA44         = n(roofSolarArea44);
  const roofGreenEnergy44 = roofPA44 + roofSA44;           // 合計綠能面積
  const roofGreenRate44  = roofA44 > 0 ? (roofGreenEnergy44 / roofA44) * 100 : 0;

  // ── 檢核清單 ──────────────────────────────────────────────────────────────
  const checks = [
    {
      art: '第43條', name: '實設空地植栽面積',
      req: os > 0 ? `≥ ${requiredPlant43.toFixed(2)} m²` : '—',
      act: `${actualPlant43.toFixed(2)} m²`,
      pass: os > 0 ? actualPlant43 >= requiredPlant43 : null,
      formula: `可綠化空地 (${os.toFixed(2)} − ${n(nonGreenable43).toFixed(2)}) m² × 50% = ${requiredPlant43.toFixed(2)} m²`,
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
      req: isDesignReview ? '≥ 50%' : '不適用',
      act: isDesignReview ? (roofA44 > 0 ? `${roofGreenRate44.toFixed(2)}%` : '—') : '—',
      pass: isDesignReview ? (roofA44 > 0 ? roofGreenRate44 >= 50 : null) : null,
      formula: isDesignReview
        ? `（屋頂綠化 ${roofPA44.toFixed(2)} + 太陽光電 ${roofSA44.toFixed(2)}）m² ÷ 屋頂面積 ${roofA44.toFixed(2)} m²`
        : '非都設會審議案，免設',
    },
  ];

  const passCount    = checks.filter(c => c.pass === true).length;
  const failCount    = checks.filter(c => c.pass === false).length;
  const pendingCount = checks.filter(c => c.pass === null).length;

  return {
    openSpace, setOpenSpace, greenArea, setGreenArea,
    nonGreenable43, setNonGreenable43,
    isDesignReview, setIsDesignReview,
    roofArea44, setRoofArea44,
    roofPlantArea44, setRoofPlantArea44,
    roofSolarArea44, setRoofSolarArea44,
    treeSmall, setTreeSmall, treeMedium, setTreeMedium, treeLarge, setTreeLarge,
    shrubArea, setShrubArea,
    groundCoverArea, setGroundCoverArea,
    grassBrickArea, setGrassBrickArea,
    pondArea, setPondArea,
    vineArea, setVineArea,
    roofGreenArea, setRoofGreenArea,
    includeRoofInCoverage, setIncludeRoofInCoverage,
    os, ga,
    treeSmallCount, treeMediumCount, treeLargeCount, totalTreeCount, requiredTrees,
    treeCover, shrubCover, groundCover, grassBrickCover, pondCover, vineCover, roofCover,
    totalCover, coverRate,
    greenableArea43, requiredPlant43, actualPlant43,
    roofA44, roofPA44, roofSA44, roofGreenEnergy44, roofGreenRate44,
    checks, passCount, failCount, pendingCount,
  };
}

export type NewTaipeiCalc = ReturnType<typeof useNewTaipeiCalc>;
