import { useState } from 'react';
import LandWeaverHeader from '../shared/LandWeaverHeader';
import { useGreeneryCalc }  from './hooks/useGreeneryCalc';
import { useNewTaipeiCalc } from './hooks/useNewTaipeiCalc';
import { SiteBasics }       from './sections/SiteBasics';
import { Article7 }         from './sections/Article7';
import { Article8 }         from './sections/Article8';
import { Article9 }         from './sections/Article9';
import { Article12 }        from './sections/Article12';
import { Article5Summary }  from './sections/Article5Summary';
import { CheckResults }     from './sections/CheckResults';
import { NtArticle8 }       from './sections/NtArticle8';
import { NtCheckResults }   from './sections/NtCheckResults';
import { TaipeiLivePanel }  from './components/TaipeiLivePanel';
import { NtLivePanel }      from './components/NtLivePanel';
import type { City, TaipeiTreeProps, TaipeiGroundProps, NtStateProps, NtResultProps } from './types';

const NAV_ITEMS = [
  { icon: 'calculate', label: '台北市', id: 'taipei'    as City },
  { icon: 'eco',       label: '新北市', id: 'newtaipei' as City },
];

/* ══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [city, setCity] = useState<City>('taipei');
  const c  = useGreeneryCalc();
  const nt = useNewTaipeiCalc();

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body">
      <LandWeaverHeader projectName="綠化法規計算機" projectEmoji="🌿" />
    <div className="flex flex-1">

      {/* ══ 左側導覽列 ══ */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 left-0 w-60 bg-surface-container-low p-6 gap-8 z-50 shrink-0">
        {/* Logo */}
        <div className="flex flex-col gap-1">
          <span className="text-lg font-black font-headline text-[#0D4D4D] tracking-tight">Greenery Architect</span>
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">Clinical Precision</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-grow">
          {NAV_ITEMS.map(({ icon, label, id }) => (
            <button
              key={id}
              onClick={() => setCity(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors w-full ${
                city === id
                  ? 'bg-surface-container-lowest text-[#0D4D4D] font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={city === id ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
              <div className="flex flex-col">
                <span className="text-sm leading-tight">{label}</span>
                <span className="text-[10px] font-normal text-on-surface-variant leading-tight">
                  {id === 'taipei' ? '綠化實施規則' : '都市設計審議'}
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* 底部 */}
        <div className="flex flex-col gap-3">
          <button className="signature-gradient text-on-primary py-3 px-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">description</span>
            匯出報告
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors text-sm">
            <span className="material-symbols-outlined text-[20px]">help</span>
            說明文件
          </button>
        </div>
      </aside>

      {/* ══ 主內容區 ══ */}
      <main className="flex-grow flex flex-col min-w-0">

        {/* ── 頂部列 ── */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-container flex justify-between items-center px-6 md:px-8 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-bold font-headline text-[#0D4D4D]">
              {city === 'taipei' ? '台北市綠化計算機' : '新北市景觀計畫'}
            </h1>
            {/* mobile city toggle */}
            <div className="flex md:hidden gap-1">
              {NAV_ITEMS.map(({ id, label }) => (
                <button key={id} onClick={() => setCity(id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${city === id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant">
            <span className="text-xs text-outline hidden sm:block">
              {city === 'taipei' ? '民國115年1月1日施行' : '民國110年1月14日修正'}
            </span>
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </header>

        {/* ── 內容 grid ── */}
        <div className="p-6 md:p-8 max-w-screen-xl w-full mx-auto">
          <div className="grid grid-cols-12 gap-8">

            {/* ── 左欄：輸入區（8欄） ── */}
            <div className="col-span-12 lg:col-span-8 flex flex-col">

              {city === 'taipei' && (
                <>
                  <SiteBasics
                    buildingClass={c.buildingClass} setBuildingClass={c.setBuildingClass}
                    baseArea={c.baseArea} setBaseArea={c.setBaseArea}
                    bcr={c.bcr} setBcr={c.setBcr}
                    nonGreenable={c.nonGreenable} setNonGreenable={c.setNonGreenable}
                    alphaInput={c.alphaInput} setAlphaInput={c.setAlphaInput}
                    std={c.std} legalSpace={c.legalSpace} calcFootprint={c.calcFootprint}
                    A_prime={c.A_prime} totalGreen={c.totalGreen}
                  />
                  <Article7
                    trees={{
                      hs150L:c.hs150L, setHs150L:c.setHs150L, hs150M:c.hs150M, setHs150M:c.setHs150M,
                      hs150S:c.hs150S, setHs150S:c.setHs150S, hs150P:c.hs150P, setHs150P:c.setHs150P,
                      hs120L:c.hs120L, setHs120L:c.setHs120L, hs120M:c.hs120M, setHs120M:c.setHs120M,
                      hs120S:c.hs120S, setHs120S:c.setHs120S, hs120P:c.hs120P, setHs120P:c.setHs120P,
                      hs100L:c.hs100L, setHs100L:c.setHs100L, hs100M:c.hs100M, setHs100M:c.setHs100M,
                      hs100S:c.hs100S, setHs100S:c.setHs100S, hs100P:c.hs100P, setHs100P:c.setHs100P,
                      ls150L:c.ls150L, setLs150L:c.setLs150L, ls150M:c.ls150M, setLs150M:c.setLs150M,
                      ls150S:c.ls150S, setLs150S:c.setLs150S, ls150P:c.ls150P, setLs150P:c.setLs150P,
                      ls120L:c.ls120L, setLs120L:c.setLs120L, ls120M:c.ls120M, setLs120M:c.setLs120M,
                      ls120S:c.ls120S, setLs120S:c.setLs120S, ls120P:c.ls120P, setLs120P:c.setLs120P,
                      ls100L:c.ls100L, setLs100L:c.setLs100L, ls100M:c.ls100M, setLs100M:c.setLs100M,
                      ls100S:c.ls100S, setLs100S:c.setLs100S, ls100P:c.ls100P, setLs100P:c.setLs100P,
                      roadsideSpace:c.roadsideSpace, setRoadsideSpace:c.setRoadsideSpace,
                      rsL:c.rsL, setRsL:c.setRsL, rsM:c.rsM, setRsM:c.setRsM, rsS:c.rsS, setRsS:c.setRsS,
                      hsArea:c.hsArea, lsArea:c.lsArea,
                      roadsideTrees:c.roadsideTrees, roadsideCover:c.roadsideCover,
                    } satisfies TaipeiTreeProps}
                    ground={{
                      ecoLayerArea:c.ecoLayerArea, setEcoLayerArea:c.setEcoLayerArea,
                      groundShrub:c.groundShrub, setGroundShrub:c.setGroundShrub,
                      groundGrass:c.groundGrass, setGroundGrass:c.setGroundGrass,
                      groundDitch:c.groundDitch, setGroundDitch:c.setGroundDitch,
                      groundBrick:c.groundBrick, setGroundBrick:c.setGroundBrick,
                      groundPond:c.groundPond,   setGroundPond:c.setGroundPond,
                      groundWallW:c.groundWallW, setGroundWallW:c.setGroundWallW,
                      groundWallF:c.groundWallF, setGroundWallF:c.setGroundWallF,
                      groundShrubArea:c.groundShrubArea, groundOther:c.groundOther,
                      grassArea:c.grassArea, ditchExtra:c.ditchExtra,
                      brickArea:c.brickArea, pondArea:c.pondArea, wallArea:c.wallArea,
                    } satisfies TaipeiGroundProps}
                  />
                  <Article8
                    vertHsL={c.vertHsL} setVertHsL={c.setVertHsL} vertHsM={c.vertHsM} setVertHsM={c.setVertHsM}
                    vertHsS={c.vertHsS} setVertHsS={c.setVertHsS} vertHsP={c.vertHsP} setVertHsP={c.setVertHsP}
                    vertLsL={c.vertLsL} setVertLsL={c.setVertLsL} vertLsM={c.vertLsM} setVertLsM={c.setVertLsM}
                    vertLsS={c.vertLsS} setVertLsS={c.setVertLsS} vertLsP={c.vertLsP} setVertLsP={c.setVertLsP}
                    vertShrub={c.vertShrub} setVertShrub={c.setVertShrub}
                    vertOther={c.vertOther} setVertOther={c.setVertOther}
                    vertHsArea={c.vertHsArea} vertLsArea={c.vertLsArea}
                    vertShrubArea={c.vertShrubArea} vertOtherArea={c.vertOtherArea}
                  />
                  <Article9
                    roofTotal={c.roofTotal}       setRoofTotal={c.setRoofTotal}
                    roofNonGreen={c.roofNonGreen} setRoofNonGreen={c.setRoofNonGreen}
                    roofHsArea={c.roofHsArea}     setRoofHsArea={c.setRoofHsArea}
                    roofLsArea={c.roofLsArea}     setRoofLsArea={c.setRoofLsArea}
                    roofPalmArea={c.roofPalmArea} setRoofPalmArea={c.setRoofPalmArea}
                    roofShrub={c.roofShrub}       setRoofShrub={c.setRoofShrub}
                    roofOther={c.roofOther}       setRoofOther={c.setRoofOther}
                    roofHs={c.roofHs} roofLs={c.roofLs} roofPalm={c.roofPalm}
                    roofShrubArea={c.roofShrubArea} roofGreen={c.roofGreen}
                    greenableRoof={c.greenableRoof} roofRate={c.roofRate} roofShrubPct={c.roofShrubPct}
                    roofRatePass={c.roofRatePass} roofShrubPass={c.roofShrubPass}
                  />
                  <Article12
                    pavTotal={c.pavTotal} setPavTotal={c.setPavTotal}
                    pavPerm={c.pavPerm}   setPavPerm={c.setPavPerm}
                    permeableRate={c.permeableRate}
                    permeablePass={c.permeablePass}
                  />
                  <Article5Summary
                    allHs={c.allHs} allLs={c.allLs} allShrub={c.allShrub} allOther={c.allOther}
                    totalGreen={c.totalGreen} effectiveGreen={c.effectiveGreen}
                    coverRate={c.coverRate} volumeRate={c.volumeRate} std={c.std}
                    actualCarbon={c.actualCarbon} reqCarbon={c.reqCarbon}
                    alpha={c.alpha} A_prime={c.A_prime}
                    ecoLayerVal={c.ecoLayerVal}
                    carbonLargeArea={c.carbonLargeArea}
                    carbonSmallArea={c.carbonSmallArea}
                    carbonPalmArea={c.carbonPalmArea}
                    coverPass={c.coverPass} volumePass={c.volumePass} carbonPass={c.carbonPass}
                  />
                  <CheckResults checks={c.checks} />
                </>
              )}

              {city === 'newtaipei' && (
                <>
                  <NtArticle8
                    state={{
                      openSpace:nt.openSpace, setOpenSpace:nt.setOpenSpace,
                      greenArea:nt.greenArea, setGreenArea:nt.setGreenArea,
                      nonGreenable43:nt.nonGreenable43, setNonGreenable43:nt.setNonGreenable43,
                      isDesignReview:nt.isDesignReview, setIsDesignReview:nt.setIsDesignReview,
                      roofArea44:nt.roofArea44, setRoofArea44:nt.setRoofArea44,
                      roofPlantArea44:nt.roofPlantArea44, setRoofPlantArea44:nt.setRoofPlantArea44,
                      roofSolarArea44:nt.roofSolarArea44, setRoofSolarArea44:nt.setRoofSolarArea44,
                      treeSmall:nt.treeSmall, setTreeSmall:nt.setTreeSmall,
                      treeMedium:nt.treeMedium, setTreeMedium:nt.setTreeMedium,
                      treeLarge:nt.treeLarge, setTreeLarge:nt.setTreeLarge,
                      shrubArea:nt.shrubArea, setShrubArea:nt.setShrubArea,
                      groundCoverArea:nt.groundCoverArea, setGroundCoverArea:nt.setGroundCoverArea,
                      grassBrickArea:nt.grassBrickArea, setGrassBrickArea:nt.setGrassBrickArea,
                      pondArea:nt.pondArea, setPondArea:nt.setPondArea,
                      vineArea:nt.vineArea, setVineArea:nt.setVineArea,
                      roofGreenArea:nt.roofGreenArea, setRoofGreenArea:nt.setRoofGreenArea,
                      includeRoofInCoverage:nt.includeRoofInCoverage,
                      setIncludeRoofInCoverage:nt.setIncludeRoofInCoverage,
                    } satisfies NtStateProps}
                    results={{
                      os:nt.os, ga:nt.ga,
                      treeSmallCount:nt.treeSmallCount, treeMediumCount:nt.treeMediumCount,
                      treeLargeCount:nt.treeLargeCount, totalTreeCount:nt.totalTreeCount,
                      requiredTrees:nt.requiredTrees,
                      shrubCover:nt.shrubCover, groundCover:nt.groundCover,
                      grassBrickCover:nt.grassBrickCover, pondCover:nt.pondCover,
                      vineCover:nt.vineCover, roofCover:nt.roofCover,
                      totalCover:nt.totalCover, coverRate:nt.coverRate,
                      greenableArea43:nt.greenableArea43, requiredPlant43:nt.requiredPlant43,
                      actualPlant43:nt.actualPlant43,
                      roofA44:nt.roofA44, roofPA44:nt.roofPA44, roofSA44:nt.roofSA44,
                      roofGreenEnergy44:nt.roofGreenEnergy44, roofGreenRate44:nt.roofGreenRate44,
                      plant43Pass:nt.plant43Pass, treePass:nt.treePass,
                      coverPass:nt.coverPass, roof44Pass:nt.roof44Pass,
                    } satisfies NtResultProps}
                  />
                  <NtCheckResults checks={nt.checks} />
                </>
              )}
            </div>

            {/* ── 右欄：即時結果（4欄） ── */}
            <div className="col-span-12 lg:col-span-4">
              {city === 'taipei'    && <TaipeiLivePanel c={c}   />}
              {city === 'newtaipei' && <NtLivePanel     nt={nt} />}
            </div>

          </div>
        </div>
      </main>

      {/* ══ 行動版底部導覽 ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-surface-container px-6 py-3 flex justify-around items-center z-50">
        {NAV_ITEMS.map(({ icon, label, id }) => (
          <button key={id} onClick={() => setCity(id)}
            className={`flex flex-col items-center gap-1 ${city === id ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={city === id ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>

    </div>
    </div>
  );
}
