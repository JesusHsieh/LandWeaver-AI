// Shared types for the taipei-greenery-calc module
import type { Dispatch, SetStateAction } from 'react';

export type City = 'taipei' | 'newtaipei';

type S = Dispatch<SetStateAction<string>>;
type B = Dispatch<SetStateAction<boolean>>;

// ── Grouped prop bundles for Article7 ───────────────────────────────────────

export interface TaipeiTreeProps {
  // HS tree inputs (3 soil depths × 4 sizes = 12 values + 12 setters)
  hs150L: string; setHs150L: S; hs150M: string; setHs150M: S;
  hs150S: string; setHs150S: S; hs150P: string; setHs150P: S;
  hs120L: string; setHs120L: S; hs120M: string; setHs120M: S;
  hs120S: string; setHs120S: S; hs120P: string; setHs120P: S;
  hs100L: string; setHs100L: S; hs100M: string; setHs100M: S;
  hs100S: string; setHs100S: S; hs100P: string; setHs100P: S;
  // LS tree inputs
  ls150L: string; setLs150L: S; ls150M: string; setLs150M: S;
  ls150S: string; setLs150S: S; ls150P: string; setLs150P: S;
  ls120L: string; setLs120L: S; ls120M: string; setLs120M: S;
  ls120S: string; setLs120S: S; ls120P: string; setLs120P: S;
  ls100L: string; setLs100L: S; ls100M: string; setLs100M: S;
  ls100S: string; setLs100S: S; ls100P: string; setLs100P: S;
  // Roadside open space
  roadsideSpace: string; setRoadsideSpace: S;
  rsL: string; setRsL: S; rsM: string; setRsM: S; rsS: string; setRsS: S;
  // Computed tree areas
  hsArea: number; lsArea: number;
  roadsideTrees: number; roadsideCover: number;
}

export interface TaipeiGroundProps {
  // Ground cover inputs
  ecoLayerArea: string; setEcoLayerArea: S;
  groundShrub:  string; setGroundShrub:  S;
  groundGrass:  string; setGroundGrass:  S;
  groundDitch:  string; setGroundDitch:  S;
  groundBrick:  string; setGroundBrick:  S;
  groundPond:   string; setGroundPond:   S;
  groundWallW:  string; setGroundWallW:  S;
  groundWallF:  string; setGroundWallF:  S;
  // Computed ground areas
  groundShrubArea: number; groundOther: number;
  grassArea: number; ditchExtra: number;
  brickArea: number; pondArea: number; wallArea: number;
}

// ── Grouped prop bundle for NtArticle8 results ──────────────────────────────

export interface NtResultProps {
  os: number; ga: number;
  treeSmallCount: number; treeMediumCount: number;
  treeLargeCount: number; totalTreeCount: number;
  requiredTrees: number;
  shrubCover: number; groundCover: number;
  grassBrickCover: number; pondCover: number;
  vineCover: number; roofCover: number;
  totalCover: number; coverRate: number;
  greenableArea43: number; requiredPlant43: number; actualPlant43: number;
  roofA44: number; roofPA44: number; roofSA44: number;
  roofGreenEnergy44: number; roofGreenRate44: number;
  plant43Pass: boolean | null;
  treePass:    boolean | null;
  coverPass:   boolean | null;
  roof44Pass:  boolean | null;
}

export interface NtStateProps {
  openSpace: string; setOpenSpace: S;
  greenArea: string; setGreenArea: S;
  nonGreenable43: string; setNonGreenable43: S;
  isDesignReview: boolean; setIsDesignReview: B;
  roofArea44: string; setRoofArea44: S;
  roofPlantArea44: string; setRoofPlantArea44: S;
  roofSolarArea44: string; setRoofSolarArea44: S;
  treeSmall: string; setTreeSmall: S;
  treeMedium: string; setTreeMedium: S;
  treeLarge: string; setTreeLarge: S;
  shrubArea: string; setShrubArea: S;
  groundCoverArea: string; setGroundCoverArea: S;
  grassBrickArea: string; setGrassBrickArea: S;
  pondArea: string; setPondArea: S;
  vineArea: string; setVineArea: S;
  roofGreenArea: string; setRoofGreenArea: S;
  includeRoofInCoverage: boolean; setIncludeRoofInCoverage: B;
}

// Re-export the return types from hooks so other files can import from here
export type { GreeneryCalc } from './hooks/useGreeneryCalc';
export type { NewTaipeiCalc } from './hooks/useNewTaipeiCalc';

// ── Site basics (shared inputs) ─────────────────────────────────────────────
export interface TaipeiSiteInput {
  buildingClass: import('./constants').BuildingClass;
  baseArea: string;
  bcr: string;
  nonGreenable: string;
  alphaInput: string;
}

export interface TaipeiTreeInput {
  hs150L: string; hs150M: string; hs150S: string; hs150P: string;
  hs120L: string; hs120M: string; hs120S: string; hs120P: string;
  hs100L: string; hs100M: string; hs100S: string; hs100P: string;
  ls150L: string; ls150M: string; ls150S: string; ls150P: string;
  ls120L: string; ls120M: string; ls120S: string; ls120P: string;
  ls100L: string; ls100M: string; ls100S: string; ls100P: string;
  roadsideSpace: string; rsL: string; rsM: string; rsS: string;
  vertHsL: string; vertHsM: string; vertHsS: string; vertHsP: string;
  vertLsL: string; vertLsM: string; vertLsS: string; vertLsP: string;
}

export interface TaipeiGroundInput {
  ecoLayerArea: string;
  groundShrub: string; groundGrass: string; groundDitch: string;
  groundBrick: string; groundPond: string; groundWallW: string; groundWallF: string;
  vertShrub: string; vertOther: string;
}

export interface TaipeiRoofInput {
  roofTotal: string; roofNonGreen: string;
  roofHsArea: string; roofLsArea: string; roofPalmArea: string;
  roofShrub: string; roofOther: string;
  pavTotal: string; pavPerm: string;
}

export interface TaipeiGreeneryInput {
  site: TaipeiSiteInput;
  tree: TaipeiTreeInput;
  ground: TaipeiGroundInput;
  roof: TaipeiRoofInput;
}
