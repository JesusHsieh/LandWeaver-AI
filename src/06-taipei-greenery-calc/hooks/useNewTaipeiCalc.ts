import { useState } from 'react';
import { computeNewTaipeiGreenery } from '../calculators/newTaipeiGreeneryCalculator';
export { NT_TREE_COVER } from '../calculators/newTaipeiGreeneryCalculator';

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

  // ── Assemble input and compute ────────────────────────────────────────────
  const result = computeNewTaipeiGreenery({
    openSpace, greenArea, nonGreenable43,
    isDesignReview,
    roofArea44, roofPlantArea44, roofSolarArea44,
    treeSmall, treeMedium, treeLarge,
    shrubArea, groundCoverArea, grassBrickArea, pondArea, vineArea,
    roofGreenArea, includeRoofInCoverage,
  });

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
    ...result,
  };
}

export type NewTaipeiCalc = ReturnType<typeof useNewTaipeiCalc>;
