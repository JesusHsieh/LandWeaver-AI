import { useState, useMemo } from 'react';
import type { BuildingClass } from '../constants';
import { STANDARDS, TREE_AREA, COOL, CARBON } from '../constants';
import { n, treeGroupArea } from '../utils';

export function useGreeneryCalc() {
  // ── 基地基本資料 ──────────────────────────────────────────────────────────
  const [buildingClass, setBuildingClass] = useState<BuildingClass>('5');
  const [baseArea,      setBaseArea]      = useState('');
  const [bcr,           setBcr]           = useState('');
  const [nonGreenable,  setNonGreenable]  = useState('');

  // ── 第6條：生態綠化修正係數 α（0.80–1.30；無生態綠化計畫填 0.80）────────
  const [alphaInput, setAlphaInput] = useState('0.80');

  // ── 第7條：法定空地 — 高遮蔭喬木（3 覆土深度 × 4 米高徑）─────────────────
  const [hs150L,setHs150L]=useState(''); const [hs150M,setHs150M]=useState('');
  const [hs150S,setHs150S]=useState(''); const [hs150P,setHs150P]=useState('');
  const [hs120L,setHs120L]=useState(''); const [hs120M,setHs120M]=useState('');
  const [hs120S,setHs120S]=useState(''); const [hs120P,setHs120P]=useState('');
  const [hs100L,setHs100L]=useState(''); const [hs100M,setHs100M]=useState('');
  const [hs100S,setHs100S]=useState(''); const [hs100P,setHs100P]=useState('');

  // ── 第7條：法定空地 — 低遮蔭喬木 ─────────────────────────────────────────
  const [ls150L,setLs150L]=useState(''); const [ls150M,setLs150M]=useState('');
  const [ls150S,setLs150S]=useState(''); const [ls150P,setLs150P]=useState('');
  const [ls120L,setLs120L]=useState(''); const [ls120M,setLs120M]=useState('');
  const [ls120S,setLs120S]=useState(''); const [ls120P,setLs120P]=useState('');
  const [ls100L,setLs100L]=useState(''); const [ls100M,setLs100M]=useState('');
  const [ls100S,setLs100S]=useState(''); const [ls100P,setLs100P]=useState('');

  // ── 第7條：法定空地 — 生態複層（喬木間距≤3.5m 密植混種區）────────────────
  const [ecoLayerArea, setEcoLayerArea] = useState('');

  // ── 第7條：法定空地 — 灌木、其他植栽 ────────────────────────────────────
  const [groundShrub, setGroundShrub] = useState('');
  const [groundGrass, setGroundGrass] = useState('');
  const [groundDitch, setGroundDitch] = useState('');
  const [groundBrick, setGroundBrick] = useState('');
  const [groundPond,  setGroundPond]  = useState('');
  const [groundWallW, setGroundWallW] = useState('');
  const [groundWallF, setGroundWallF] = useState('');

  // ── 第7條第2項：臨道路開放空間 ───────────────────────────────────────────
  const [roadsideSpace, setRoadsideSpace] = useState('');
  const [rsL, setRsL] = useState('');
  const [rsM, setRsM] = useState('');
  const [rsS, setRsS] = useState('');

  // ── 第8條：立體綠化 ───────────────────────────────────────────────────────
  const [vertHsL,setVertHsL]=useState(''); const [vertHsM,setVertHsM]=useState('');
  const [vertHsS,setVertHsS]=useState(''); const [vertHsP,setVertHsP]=useState('');
  const [vertLsL,setVertLsL]=useState(''); const [vertLsM,setVertLsM]=useState('');
  const [vertLsS,setVertLsS]=useState(''); const [vertLsP,setVertLsP]=useState('');
  const [vertShrub, setVertShrub] = useState('');
  const [vertOther, setVertOther] = useState('');

  // ── 第9條：屋頂平臺 ───────────────────────────────────────────────────────
  const [roofTotal,    setRoofTotal]    = useState('');
  const [roofNonGreen, setRoofNonGreen] = useState('');
  const [roofHsArea,   setRoofHsArea]   = useState('');
  const [roofLsArea,   setRoofLsArea]   = useState('');
  const [roofPalmArea, setRoofPalmArea] = useState('');
  const [roofShrub,    setRoofShrub]    = useState('');
  const [roofOther,    setRoofOther]    = useState('');

  // ── 第12條：透水鋪面 ──────────────────────────────────────────────────────
  const [pavTotal, setPavTotal] = useState('');
  const [pavPerm,  setPavPerm]  = useState('');

  // ── 計算：基地 ────────────────────────────────────────────────────────────
  const std           = STANDARDS[buildingClass];
  const base          = n(baseArea);
  const legalSpace    = base * (1 - n(bcr) / 100);
  const calcFootprint = base * n(bcr) / 100;

  // A'（最小綠化面積）— 技術規範公式(4)：(A₀-Ap)×(1-r)，且不得低於 0.15×A₀
  const A_prime = base > 0
    ? Math.max((base - n(nonGreenable)) * (1 - n(bcr) / 100), 0.15 * base)
    : 0;

  // α（生態綠化修正係數）— 全無生態綠化者為 0.8，全面者為 1.3
  const alpha = Math.max(0.8, Math.min(1.3, n(alphaInput) || 0.8));

  // ── 計算：法定空地喬木 ────────────────────────────────────────────────────
  const hsArea = useMemo(() =>
    treeGroupArea(hs150L,hs150M,hs150S,hs150P,1.0) +
    treeGroupArea(hs120L,hs120M,hs120S,hs120P,0.8) +
    treeGroupArea(hs100L,hs100M,hs100S,hs100P,0.6),
    [hs150L,hs150M,hs150S,hs150P,hs120L,hs120M,hs120S,hs120P,hs100L,hs100M,hs100S,hs100P]
  );
  const lsArea = useMemo(() =>
    treeGroupArea(ls150L,ls150M,ls150S,ls150P,1.0) +
    treeGroupArea(ls120L,ls120M,ls120S,ls120P,0.8) +
    treeGroupArea(ls100L,ls100M,ls100S,ls100P,0.6),
    [ls150L,ls150M,ls150S,ls150P,ls120L,ls120M,ls120S,ls120P,ls100L,ls100M,ls100S,ls100P]
  );

  // ── 計算：法定空地其他植栽 ────────────────────────────────────────────────
  const grassArea       = n(groundGrass);
  const ditchExtra      = n(groundDitch) * 0.4 * 0.1;
  const brickArea       = n(groundBrick) / 3;
  const pondArea        = n(groundPond) / 3;
  const wallArea        = n(groundWallW) * 3 * n(groundWallF);
  const groundOther     = grassArea + ditchExtra + brickArea + pondArea + wallArea;
  const groundShrubArea = n(groundShrub);

  // ── 計算：立體綠化 ────────────────────────────────────────────────────────
  const vertHsArea    = treeGroupArea(vertHsL,vertHsM,vertHsS,vertHsP);
  const vertLsArea    = treeGroupArea(vertLsL,vertLsM,vertLsS,vertLsP);
  const vertShrubArea = n(vertShrub);
  const vertOtherArea = n(vertOther);

  // ── 計算：屋頂 ────────────────────────────────────────────────────────────
  const roofHs        = n(roofHsArea);
  const roofLs        = n(roofLsArea);
  const roofPalm      = n(roofPalmArea);
  const roofShrubArea = n(roofShrub);
  const roofOtherArea = n(roofOther);
  const roofGreen     = roofHs + roofLs + roofPalm + roofShrubArea + roofOtherArea;
  const greenableRoof = Math.max(0, n(roofTotal) - n(roofNonGreen));

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
  const groundHsPalmArea = (n(hs150P)*1.0 + n(hs120P)*0.8 + n(hs100P)*0.6) * TREE_AREA.palm;
  const groundLsPalmArea = (n(ls150P)*1.0 + n(ls120P)*0.8 + n(ls100P)*0.6) * TREE_AREA.palm;
  const vertHsPalmCarbon = n(vertHsP) * TREE_AREA.palm;
  const vertLsPalmCarbon = n(vertLsP) * TREE_AREA.palm;
  // 棕櫚類總固碳面積（含屋頂）
  const carbonPalmArea  = groundHsPalmArea + groundLsPalmArea + vertHsPalmCarbon + vertLsPalmCarbon + roofPalm;
  // 闊葉大喬木（hs 扣除棕櫚，Gi=1.50）
  const carbonLargeArea = allHs - groundHsPalmArea - vertHsPalmCarbon;
  // 闊葉小喬木（ls 扣除棕櫚，Gi=1.00；roofPalm 已含在 allLs 中故須扣）
  const carbonSmallArea = (lsArea - groundLsPalmArea) + (vertLsArea - vertLsPalmCarbon) + roofLs;

  const ecoLayerVal = n(ecoLayerArea);

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
  const roadsideTrees = n(rsL)*TREE_AREA.large + n(rsM)*TREE_AREA.medium + n(rsS)*TREE_AREA.small;
  const roadsideCover = n(roadsideSpace) > 0 ? (roadsideTrees / n(roadsideSpace)) * 100 : 0;

  // ── 第9條 ─────────────────────────────────────────────────────────────────
  const roofRate     = greenableRoof > 0 ? (roofGreen / greenableRoof) * 100 : 0;
  const roofShrubPct = roofGreen > 0 ? (roofShrubArea / roofGreen) * 100 : 0;

  // ── 第12條 ────────────────────────────────────────────────────────────────
  const permeableRate = n(pavTotal) > 0 ? (n(pavPerm) / n(pavTotal)) * 100 : 0;

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
      req: '≥ 80%', act: n(roadsideSpace) > 0 ? `${roadsideCover.toFixed(2)}%` : '無此空間',
      pass: n(roadsideSpace) > 0 ? roadsideCover >= 80 : null,
      formula: `喬木面積 ${roadsideTrees.toFixed(2)} m² ÷ 開放空間 ${n(roadsideSpace).toFixed(2)} m²`,
    },
    {
      art: '第9條第1項', name: '屋頂灌木面積比例',
      req: '≥ 30%', act: `${roofShrubPct.toFixed(2)}%`,
      pass: n(roofTotal) > 0 ? roofShrubPct >= 30 : null,
      formula: `灌木 ${roofShrubArea.toFixed(2)} m² ÷ 屋頂綠覆 ${roofGreen.toFixed(2)} m²`,
    },
    {
      art: '第9條第2項', name: '屋頂平臺綠覆率',
      req: '≥ 50%', act: `${roofRate.toFixed(2)}%`,
      pass: n(roofTotal) > 0 ? roofRate >= 50 : null,
      formula: `綠覆 ${roofGreen.toFixed(2)} m² ÷ 可綠化屋頂 ${greenableRoof.toFixed(2)} m²`,
    },
    {
      art: '第12條', name: '透水鋪面比例',
      req: '≥ 50%', act: `${permeableRate.toFixed(2)}%`,
      pass: n(pavTotal) > 0 ? permeableRate >= 50 : null,
      formula: `透水面積 ${n(pavPerm).toFixed(2)} m² ÷ 鋪面總計 ${n(pavTotal).toFixed(2)} m²`,
    },
  ];

  const passCount    = checks.filter(c => c.pass === true).length;
  const failCount    = checks.filter(c => c.pass === false).length;
  const pendingCount = checks.filter(c => c.pass === null).length;

  return {
    // ── Site ──
    buildingClass, setBuildingClass,
    baseArea, setBaseArea, bcr, setBcr, nonGreenable, setNonGreenable,
    alphaInput, setAlphaInput,
    // ── Art7 HS trees ──
    hs150L,setHs150L, hs150M,setHs150M, hs150S,setHs150S, hs150P,setHs150P,
    hs120L,setHs120L, hs120M,setHs120M, hs120S,setHs120S, hs120P,setHs120P,
    hs100L,setHs100L, hs100M,setHs100M, hs100S,setHs100S, hs100P,setHs100P,
    // ── Art7 LS trees ──
    ls150L,setLs150L, ls150M,setLs150M, ls150S,setLs150S, ls150P,setLs150P,
    ls120L,setLs120L, ls120M,setLs120M, ls120S,setLs120S, ls120P,setLs120P,
    ls100L,setLs100L, ls100M,setLs100M, ls100S,setLs100S, ls100P,setLs100P,
    // ── Art7 eco-layer ──
    ecoLayerArea, setEcoLayerArea,
    // ── Art7 ground other ──
    groundShrub,setGroundShrub, groundGrass,setGroundGrass, groundDitch,setGroundDitch,
    groundBrick,setGroundBrick, groundPond,setGroundPond,
    groundWallW,setGroundWallW, groundWallF,setGroundWallF,
    // ── Art7 roadside ──
    roadsideSpace,setRoadsideSpace, rsL,setRsL, rsM,setRsM, rsS,setRsS,
    // ── Art8 vertical ──
    vertHsL,setVertHsL, vertHsM,setVertHsM, vertHsS,setVertHsS, vertHsP,setVertHsP,
    vertLsL,setVertLsL, vertLsM,setVertLsM, vertLsS,setVertLsS, vertLsP,setVertLsP,
    vertShrub,setVertShrub, vertOther,setVertOther,
    // ── Art9 roof ──
    roofTotal,setRoofTotal, roofNonGreen,setRoofNonGreen,
    roofHsArea,setRoofHsArea, roofLsArea,setRoofLsArea, roofPalmArea,setRoofPalmArea,
    roofShrub,setRoofShrub, roofOther,setRoofOther,
    // ── Art12 ──
    pavTotal,setPavTotal, pavPerm,setPavPerm,
    // ── Computed ──
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
    checks, passCount, failCount, pendingCount,
  };
}

export type GreeneryCalc = ReturnType<typeof useGreeneryCalc>;
