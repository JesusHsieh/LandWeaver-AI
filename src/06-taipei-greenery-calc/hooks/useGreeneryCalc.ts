import { useState } from 'react';
import type { BuildingClass } from '../constants';
import { useTreeInputState } from './useTreeInputState';
import { useGroundCoverState } from './useGroundCoverState';
import { useRooftopState } from './useRooftopState';
import { computeTaipeiGreenery } from '../calculators/taipeiGreeneryCalculator';
import type { TaipeiGreeneryInput } from '../types';

export function useGreeneryCalc() {
  // ── 基地基本資料 ──────────────────────────────────────────────────────────
  const [buildingClass, setBuildingClass] = useState<BuildingClass>('5');
  const [baseArea,      setBaseArea]      = useState('');
  const [bcr,           setBcr]           = useState('');
  const [nonGreenable,  setNonGreenable]  = useState('');

  // ── 第6條：生態綠化修正係數 α（0.80–1.30；無生態綠化計畫填 0.80）────────
  const [alphaInput, setAlphaInput] = useState('0.80');

  // ── Sub-hook state ────────────────────────────────────────────────────────
  const treeState    = useTreeInputState();
  const groundState  = useGroundCoverState();
  const rooftopState = useRooftopState();

  // ── Assemble input and compute ────────────────────────────────────────────
  const input: TaipeiGreeneryInput = {
    site: { buildingClass, baseArea, bcr, nonGreenable, alphaInput },
    tree: {
      hs150L: treeState.hs150L, hs150M: treeState.hs150M, hs150S: treeState.hs150S, hs150P: treeState.hs150P,
      hs120L: treeState.hs120L, hs120M: treeState.hs120M, hs120S: treeState.hs120S, hs120P: treeState.hs120P,
      hs100L: treeState.hs100L, hs100M: treeState.hs100M, hs100S: treeState.hs100S, hs100P: treeState.hs100P,
      ls150L: treeState.ls150L, ls150M: treeState.ls150M, ls150S: treeState.ls150S, ls150P: treeState.ls150P,
      ls120L: treeState.ls120L, ls120M: treeState.ls120M, ls120S: treeState.ls120S, ls120P: treeState.ls120P,
      ls100L: treeState.ls100L, ls100M: treeState.ls100M, ls100S: treeState.ls100S, ls100P: treeState.ls100P,
      roadsideSpace: treeState.roadsideSpace, rsL: treeState.rsL, rsM: treeState.rsM, rsS: treeState.rsS,
      vertHsL: treeState.vertHsL, vertHsM: treeState.vertHsM, vertHsS: treeState.vertHsS, vertHsP: treeState.vertHsP,
      vertLsL: treeState.vertLsL, vertLsM: treeState.vertLsM, vertLsS: treeState.vertLsS, vertLsP: treeState.vertLsP,
    },
    ground: {
      ecoLayerArea: groundState.ecoLayerArea,
      groundShrub: groundState.groundShrub, groundGrass: groundState.groundGrass,
      groundDitch: groundState.groundDitch, groundBrick: groundState.groundBrick,
      groundPond: groundState.groundPond, groundWallW: groundState.groundWallW, groundWallF: groundState.groundWallF,
      vertShrub: groundState.vertShrub, vertOther: groundState.vertOther,
    },
    roof: {
      roofTotal: rooftopState.roofTotal, roofNonGreen: rooftopState.roofNonGreen,
      roofHsArea: rooftopState.roofHsArea, roofLsArea: rooftopState.roofLsArea, roofPalmArea: rooftopState.roofPalmArea,
      roofShrub: rooftopState.roofShrub, roofOther: rooftopState.roofOther,
      pavTotal: rooftopState.pavTotal, pavPerm: rooftopState.pavPerm,
    },
  };

  const result = computeTaipeiGreenery(input);

  return {
    // ── Site ──
    buildingClass, setBuildingClass,
    baseArea, setBaseArea, bcr, setBcr, nonGreenable, setNonGreenable,
    alphaInput, setAlphaInput,
    // ── Art7 HS trees ──
    ...treeState,
    // ── Art7 eco-layer + ground + vertical shrub/other ──
    ...groundState,
    // ── Art9 roof + Art12 pav ──
    ...rooftopState,
    // ── Computed ──
    ...result,
  };
}

export type GreeneryCalc = ReturnType<typeof useGreeneryCalc>;
