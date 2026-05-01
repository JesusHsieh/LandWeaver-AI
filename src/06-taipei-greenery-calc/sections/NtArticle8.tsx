import { n } from '../utils';
import { NT_TREE_COVER } from '../hooks/useNewTaipeiCalc';
import type { NewTaipeiCalc } from '../hooks/useNewTaipeiCalc';
import { cardCls, hCls, inputCls, labelCls } from '../styles';

type Props = Pick<NewTaipeiCalc,
  | 'openSpace' | 'setOpenSpace' | 'greenArea' | 'setGreenArea'
  | 'nonGreenable43' | 'setNonGreenable43'
  | 'isDesignReview' | 'setIsDesignReview'
  | 'roofArea44' | 'setRoofArea44'
  | 'roofPlantArea44' | 'setRoofPlantArea44'
  | 'roofSolarArea44' | 'setRoofSolarArea44'
  | 'treeSmall' | 'setTreeSmall' | 'treeMedium' | 'setTreeMedium' | 'treeLarge' | 'setTreeLarge'
  | 'shrubArea' | 'setShrubArea'
  | 'groundCoverArea' | 'setGroundCoverArea'
  | 'grassBrickArea' | 'setGrassBrickArea'
  | 'pondArea' | 'setPondArea'
  | 'vineArea' | 'setVineArea'
  | 'roofGreenArea' | 'setRoofGreenArea'
  | 'includeRoofInCoverage' | 'setIncludeRoofInCoverage'
  | 'os' | 'ga'
  | 'treeSmallCount' | 'treeMediumCount' | 'treeLargeCount' | 'totalTreeCount' | 'requiredTrees'
  | 'shrubCover' | 'groundCover' | 'grassBrickCover' | 'pondCover' | 'vineCover' | 'roofCover'
  | 'totalCover' | 'coverRate'
  | 'greenableArea43' | 'requiredPlant43' | 'actualPlant43'
  | 'roofA44' | 'roofPA44' | 'roofSA44' | 'roofGreenEnergy44' | 'roofGreenRate44'
>;

export function NtArticle8({
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
  shrubCover, groundCover, grassBrickCover, pondCover, vineCover, roofCover,
  totalCover, coverRate,
  greenableArea43, requiredPlant43, actualPlant43,
  roofA44, roofPA44, roofSA44, roofGreenEnergy44, roofGreenRate44,
}: Props) {

  const treeEnough  = ga > 0 ? totalTreeCount >= requiredTrees : null;
  const plant43Pass = os > 0 ? actualPlant43 >= requiredPlant43 : null;
  const roof44Pass  = isDesignReview ? (roofA44 > 0 ? roofGreenRate44 >= 50 : null) : null;

  return (
    <>
      {/* ── 基地基本資料 ── */}
      <div className={cardCls}>
        <h2 className={hCls}>基地基本資料</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>實設空地面積 (m²) *</label>
            <input type="number" value={openSpace} onChange={e => setOpenSpace(e.target.value)}
              className={inputCls} placeholder="請輸入實設空地面積" min="0" />
            <p className="text-xs text-slate-400 mt-1">第43條植栽計算基礎、第8條綠覆率分母</p>
          </div>
          <div>
            <label className={labelCls}>應綠化範圍面積 (m²) *</label>
            <input type="number" value={greenArea} onChange={e => setGreenArea(e.target.value)}
              className={inputCls} placeholder="請輸入應綠化範圍面積" min="0" />
            <p className="text-xs text-slate-400 mt-1">用於計算所需喬木棵數（每 36m² 一棵）</p>
          </div>
        </div>
      </div>

      {/* ── 第43條：實設空地植栽面積 ── */}
      <div className={cardCls}>
        <h2 className={hCls}>第43條：實設空地植栽面積</h2>
        <p className="text-xs text-slate-500 mb-4">
          實設空地扣除無法綠化面積後，應留設 <strong>≥ 1/2</strong> 種植花草樹木；不足時得以屋頂、陽台等立體綠化補足。
        </p>

        <div className="mb-4">
          <label className={labelCls}>無法綠化之面積 Ap (m²)</label>
          <input type="number" value={nonGreenable43} onChange={e => setNonGreenable43(e.target.value)}
            className={inputCls} placeholder="0" min="0" />
          <p className="text-xs text-slate-400 mt-1">無遮簷人行道、裝卸位、現有道路及車道等</p>
        </div>

        <div className={`rounded-lg p-4 border-2 ${plant43Pass === true ? 'bg-emerald-50 border-emerald-400' : plant43Pass === false ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">應植栽面積（可綠化空地 × 50%）</div>
              <div className="text-2xl font-bold text-slate-700">
                {os > 0 ? `≥ ${requiredPlant43.toFixed(2)} m²` : '請填入實設空地面積'}
              </div>
              {os > 0 && (
                <div className="text-xs text-slate-400 mt-0.5">
                  ({os.toFixed(2)} − {n(nonGreenable43).toFixed(2)}) × 50% = {greenableArea43.toFixed(2)} × 0.5
                </div>
              )}
            </div>
            <div className="text-slate-300 font-bold text-xl">vs</div>
            <div className="text-right">
              <div className="text-xs text-slate-500">實際植栽面積</div>
              <div className={`text-2xl font-bold ${plant43Pass === true ? 'text-emerald-700' : plant43Pass === false ? 'text-red-600' : 'text-slate-700'}`}>
                {actualPlant43.toFixed(2)} m²
              </div>
              <div className="text-xs text-slate-400">喬木冠＋灌木＋地被＋植草磚＋生態池＋藤蔓＋立體</div>
            </div>
            {plant43Pass !== null && (
              <div className={`text-lg font-bold px-3 py-1 rounded ${plant43Pass ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                {plant43Pass ? '符合' : '不足'}
              </div>
            )}
          </div>
          {plant43Pass === false && os > 0 && (
            <div className="mt-2 text-xs text-red-500">
              尚缺 {(requiredPlant43 - actualPlant43).toFixed(2)} m² 植栽面積
            </div>
          )}
        </div>
      </div>

      {/* ── 第8條(一)-3：喬木配置 ── */}
      <div className={cardCls}>
        <h2 className={hCls}>第8條(一)-3：喬木配置需求</h2>

        <div className="bg-amber-50 rounded-lg p-3 mb-5 border border-amber-200">
          <p className="text-xs font-bold text-amber-800 mb-2">附表一：喬木綠覆面積計算標準（米高徑≥5cm）</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            {[
              { range: '米高徑 5–7 cm', crown: '1.5 m', cover: NT_TREE_COVER.small },
              { range: '米高徑 8–10 cm', crown: '1.5 m', cover: NT_TREE_COVER.medium },
              { range: '米高徑 > 10 cm', crown: '2 m', cover: NT_TREE_COVER.large },
            ].map(({ range, crown, cover }) => (
              <div key={range} className="bg-white rounded p-2 border border-amber-100">
                <div className="font-semibold text-amber-900">{range}</div>
                <div className="text-slate-400">樹冠直徑 {crown}</div>
                <div className="text-lg font-bold text-amber-700">{cover} m²/株</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">
            覆土深度：喬木 &gt; 1.5m｜樹冠底離地 ≥ 2.5m｜樹穴覆土處淨寬 ≥ 1.5m
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: '小喬木（5–7 cm）',  val: treeSmall,  set: setTreeSmall,  cover: NT_TREE_COVER.small,  count: treeSmallCount  },
            { label: '中喬木（8–10 cm）', val: treeMedium, set: setTreeMedium, cover: NT_TREE_COVER.medium, count: treeMediumCount },
            { label: '大喬木（> 10 cm）', val: treeLarge,  set: setTreeLarge,  cover: NT_TREE_COVER.large,  count: treeLargeCount  },
          ].map(({ label, val, set, cover, count }) => (
            <div key={label}>
              <label className={labelCls}>{label}（株）</label>
              <input type="number" value={val} onChange={e => set(e.target.value)}
                className={inputCls} placeholder="0" min="0" />
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                綠覆 = {count} × {cover} = {(count * cover).toFixed(0)} m²
              </p>
            </div>
          ))}
        </div>

        <div className={`rounded-lg p-4 border-2 ${treeEnough === true ? 'bg-emerald-50 border-emerald-400' : treeEnough === false ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">所需喬木數量（每36m²一棵）</div>
              <div className="text-2xl font-bold text-slate-700">
                {ga > 0 ? `≥ ${requiredTrees} 棵` : '請填入綠化範圍面積'}
              </div>
              {ga > 0 && <div className="text-xs text-slate-400">{ga.toFixed(2)} m² ÷ 36 = {requiredTrees} 棵</div>}
            </div>
            <div className="text-slate-300 font-bold text-xl">vs</div>
            <div className="text-right">
              <div className="text-xs text-slate-500">實際種植喬木</div>
              <div className={`text-2xl font-bold ${treeEnough === true ? 'text-emerald-700' : treeEnough === false ? 'text-red-600' : 'text-slate-700'}`}>
                {totalTreeCount} 棵
              </div>
              <div className="text-xs text-slate-400">
                小{treeSmallCount} + 中{treeMediumCount} + 大{treeLargeCount}
              </div>
            </div>
            {treeEnough !== null && (
              <div className={`text-lg font-bold px-3 py-1 rounded ${treeEnough ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                {treeEnough ? '符合' : '不足'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 第8條(四)：綠覆面積計算 ── */}
      <div className={cardCls}>
        <h2 className={hCls}>第8條(四)：綠覆面積計算</h2>
        <p className="text-xs text-slate-500 mb-4">
          綠覆率 = 綠覆面積 ÷ 實設空地 × 100%，應達 <strong>100%</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={labelCls}>灌木面積 (m²)　<span className="text-slate-400 font-normal">× 1.5</span></label>
            <input type="number" value={shrubArea} onChange={e => setShrubArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              計入 = {n(shrubArea).toFixed(2)} × 1.5 = {shrubCover.toFixed(2)} m²
            </p>
          </div>

          <div>
            <label className={labelCls}>地被植物面積 (m²)　<span className="text-slate-400 font-normal">× 1</span></label>
            <input type="number" value={groundCoverArea} onChange={e => setGroundCoverArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              計入 = {groundCover.toFixed(2)} m²
            </p>
          </div>

          <div>
            <label className={labelCls}>植草磚舖設面積 (m²)　<span className="text-slate-400 font-normal">× 0.5</span></label>
            <input type="number" value={grassBrickArea} onChange={e => setGrassBrickArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              計入 = {n(grassBrickArea).toFixed(2)} ÷ 2 = {grassBrickCover.toFixed(2)} m²
            </p>
          </div>

          <div>
            <label className={labelCls}>景觀生態池面積 (m²)　<span className="text-slate-400 font-normal">× 1/3</span></label>
            <input type="number" value={pondArea} onChange={e => setPondArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              計入 = {n(pondArea).toFixed(2)} ÷ 3 = {pondCover.toFixed(2)} m²
            </p>
          </div>

          <div>
            <label className={labelCls}>藤蔓立面攀附面積 (m²)　<span className="text-slate-400 font-normal">× 1</span></label>
            <input type="number" value={vineArea} onChange={e => setVineArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              計入 = {vineCover.toFixed(2)} m²
            </p>
          </div>

          {/* 立體綠化（含計入綠覆率開關） */}
          <div className={`rounded-lg p-3 border-2 transition-colors ${includeRoofInCoverage ? 'border-teal-300 bg-teal-50/30' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">
                屋頂、陽台立體綠化面積 (m²)
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-slate-500">計入綠覆率</span>
                <div
                  onClick={() => setIncludeRoofInCoverage(!includeRoofInCoverage)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${includeRoofInCoverage ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeRoofInCoverage ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>
            <input type="number" value={roofGreenArea} onChange={e => setRoofGreenArea(e.target.value)}
              className={inputCls} placeholder="0" min="0" />
            <p className="text-xs mt-1">
              {includeRoofInCoverage
                ? <span className="text-teal-600 font-semibold">計入 = {roofCover.toFixed(2)} m²（已納入綠覆率）</span>
                : <span className="text-slate-400">未計入綠覆率（第8條(三) 補償用，可依需求開啟）</span>
              }
            </p>
          </div>
        </div>

        {/* 綠覆面積彙整表 */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-2 border border-slate-200">植栽種類</th>
                <th className="text-right p-2 border border-slate-200">輸入值</th>
                <th className="text-right p-2 border border-slate-200">計算係數</th>
                <th className="text-right p-2 border border-slate-200">計入綠覆 (m²)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label:`小喬木（5–7cm）× ${treeSmallCount}株`,   input:`${treeSmallCount}株`,              coeff:`× ${NT_TREE_COVER.small} m²/株`,  val: treeSmallCount * NT_TREE_COVER.small  },
                { label:`中喬木（8–10cm）× ${treeMediumCount}株`, input:`${treeMediumCount}株`,             coeff:`× ${NT_TREE_COVER.medium} m²/株`, val: treeMediumCount * NT_TREE_COVER.medium },
                { label:`大喬木（>10cm）× ${treeLargeCount}株`,   input:`${treeLargeCount}株`,              coeff:`× ${NT_TREE_COVER.large} m²/株`,  val: treeLargeCount * NT_TREE_COVER.large  },
                { label:'灌木',             input:`${n(shrubArea).toFixed(2)} m²`,       coeff:'× 1.5',  val: shrubCover      },
                { label:'地被植物',         input:`${n(groundCoverArea).toFixed(2)} m²`, coeff:'× 1',    val: groundCover     },
                { label:'植草磚',           input:`${n(grassBrickArea).toFixed(2)} m²`,  coeff:'× 0.5',  val: grassBrickCover },
                { label:'景觀生態池',       input:`${n(pondArea).toFixed(2)} m²`,         coeff:'× 1/3',  val: pondCover       },
                { label:'藤蔓立面',         input:`${n(vineArea).toFixed(2)} m²`,         coeff:'× 1',    val: vineCover       },
                {
                  label: includeRoofInCoverage ? '立體綠化（計入）' : '立體綠化（未計入）',
                  input:`${n(roofGreenArea).toFixed(2)} m²`,
                  coeff:'× 1',
                  val: roofCover,
                  dim: !includeRoofInCoverage,
                },
              ].map(({ label, input, coeff, val, dim }) => (
                <tr key={label} className={`border-b border-slate-100 ${(val <= 0 || dim) ? 'opacity-40' : ''}`}>
                  <td className="p-2 border border-slate-200 text-slate-700">{label}</td>
                  <td className="p-2 border border-slate-200 text-right">{input}</td>
                  <td className="p-2 border border-slate-200 text-right text-blue-600">{coeff}</td>
                  <td className="p-2 border border-slate-200 text-right font-bold text-emerald-700">{val.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-sm">
                <td className="p-2 border border-slate-200" colSpan={3}>總綠覆面積</td>
                <td className="p-2 border border-slate-200 text-right text-emerald-700">{totalCover.toFixed(2)} m²</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 綠覆率判斷 */}
        <div className={`flex flex-wrap justify-between items-center rounded-lg p-4 border-2 gap-3 ${coverRate >= 100 ? 'bg-emerald-50 border-emerald-400' : os > 0 ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
          <div>
            <div className="text-xs text-slate-500">總綠覆面積 ÷ 實設空地</div>
            <div className={`text-3xl font-bold ${coverRate >= 100 ? 'text-emerald-700' : os > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {os > 0 ? `${coverRate.toFixed(2)}%` : '—'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">需達</div>
            <div className="text-3xl font-bold text-slate-700">100%</div>
            {os > 0 && coverRate < 100 && (
              <div className="text-xs text-red-500 mt-1">
                尚缺 {(os - totalCover).toFixed(2)} m² 綠覆面積
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 第44條：屋頂綠能設施 ── */}
      <div className={cardCls}>
        <h2 className={hCls}>第44條：屋頂綠能設施</h2>
        <p className="text-xs text-slate-500 mb-4">
          需都設會審議之建築物，屋頂應設置 <strong>≥ 1/2</strong> 面積之綠能設施（屋頂綠化面積 ＋ 太陽光電設備面積）。
        </p>

        {/* 是否需都設會審議 toggle */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
            <div
              onClick={() => setIsDesignReview(!isDesignReview)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDesignReview ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDesignReview ? 'translate-x-6' : ''}`} />
            </div>
            <span className="font-semibold text-slate-700">需都市設計審議（都設會）</span>
          </label>
          <p className="text-xs text-slate-400 mt-1 ml-15">
            {isDesignReview ? '適用第44條屋頂綠能規定' : '非都設會審議案，第44條免設'}
          </p>
        </div>

        {isDesignReview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className={labelCls}>屋頂總面積 (m²)</label>
                <input type="number" value={roofArea44} onChange={e => setRoofArea44(e.target.value)}
                  className={inputCls} placeholder="0" min="0" />
                <p className="text-xs text-slate-400 mt-1">計算基準</p>
              </div>
              <div>
                <label className={labelCls}>屋頂綠化面積 (m²)</label>
                <input type="number" value={roofPlantArea44} onChange={e => setRoofPlantArea44(e.target.value)}
                  className={inputCls} placeholder="0" min="0" />
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {roofPA44.toFixed(2)} m²
                </p>
              </div>
              <div>
                <label className={labelCls}>太陽光電設備面積 (m²)</label>
                <input type="number" value={roofSolarArea44} onChange={e => setRoofSolarArea44(e.target.value)}
                  className={inputCls} placeholder="0" min="0" />
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {roofSA44.toFixed(2)} m²
                </p>
              </div>
            </div>

            {/* 合計帶狀說明 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-4 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span>屋頂綠化 <strong className="text-slate-800">{roofPA44.toFixed(2)}</strong> m²</span>
                <span className="text-slate-400">＋</span>
                <span>太陽光電 <strong className="text-slate-800">{roofSA44.toFixed(2)}</strong> m²</span>
                <span className="text-slate-400">=</span>
                <span className="font-bold text-emerald-700">{roofGreenEnergy44.toFixed(2)} m² 合計綠能面積</span>
              </div>
            </div>

            <div className={`flex flex-wrap justify-between items-center rounded-lg p-4 border-2 gap-3 ${roof44Pass === true ? 'bg-emerald-50 border-emerald-400' : roof44Pass === false ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-300'}`}>
              <div>
                <div className="text-xs text-slate-500">合計綠能面積 ÷ 屋頂總面積</div>
                <div className={`text-3xl font-bold ${roof44Pass === true ? 'text-emerald-700' : roof44Pass === false ? 'text-red-600' : 'text-slate-400'}`}>
                  {roofA44 > 0 ? `${roofGreenRate44.toFixed(2)}%` : '—'}
                </div>
                {roofA44 > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {roofGreenEnergy44.toFixed(2)} ÷ {roofA44.toFixed(2)} m²
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">需達</div>
                <div className="text-3xl font-bold text-slate-700">50%</div>
                {roofA44 > 0 && roofGreenRate44 < 50 && (
                  <div className="text-xs text-red-500 mt-1">
                    尚缺 {(roofA44 * 0.5 - roofGreenEnergy44).toFixed(2)} m²
                  </div>
                )}
              </div>
              {roof44Pass !== null && (
                <div className={`text-lg font-bold px-3 py-1 rounded ${roof44Pass ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                  {roof44Pass ? '符合' : '不足'}
                </div>
              )}
            </div>
          </>
        )}

        {!isDesignReview && (
          <div className="rounded-lg p-4 bg-slate-50 border border-slate-200 text-slate-400 text-sm text-center">
            非都設會審議案，免設屋頂綠能設施
          </div>
        )}
      </div>
    </>
  );
}
