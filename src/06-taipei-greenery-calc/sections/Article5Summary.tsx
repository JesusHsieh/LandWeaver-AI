import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { CARBON } from '../constants';
import { cardCls, hCls } from '../styles';

type Props = Pick<GreeneryCalc,
  | 'allHs' | 'allLs' | 'allShrub' | 'allOther' | 'totalGreen' | 'effectiveGreen'
  | 'coverRate' | 'volumeRate' | 'std'
  | 'actualCarbon' | 'reqCarbon' | 'alpha' | 'A_prime'
  | 'ecoLayerVal' | 'carbonLargeArea' | 'carbonSmallArea' | 'carbonPalmArea'
>;

export function Article5Summary({
  allHs, allLs, allShrub, allOther, totalGreen, effectiveGreen,
  coverRate, volumeRate, std,
  actualCarbon, reqCarbon, alpha, A_prime,
  ecoLayerVal, carbonLargeArea, carbonSmallArea, carbonPalmArea,
}: Props) {

  const coolRows = [
    { label: '高遮蔭喬木（法定空地+立體+屋頂）',      area: allHs,    coeff: 3.0 },
    { label: '低遮蔭喬木+棕櫚（法定空地+立體+屋頂）', area: allLs,    coeff: 2.0 },
    { label: '灌木（法定空地+立體+屋頂）',             area: allShrub, coeff: 1.2 },
    { label: '其他植栽（法定空地+立體+屋頂）',         area: allOther, coeff: 1.0 },
  ];

  const sumGiAi =
    ecoLayerVal     * CARBON.ecoLayer   +
    carbonLargeArea * CARBON.largeBroad +
    carbonSmallArea * CARBON.smallTree  +
    carbonPalmArea  * CARBON.palm       +
    allShrub        * CARBON.shrub      +
    allOther        * CARBON.grass;

  const carbonRows = [
    { label: '生態複層（喬木間距≤3.5m密植）',    gi: CARBON.ecoLayer,   area: ecoLayerVal     },
    { label: '闊葉大喬木（高遮蔭，成樹≥10m）',   gi: CARBON.largeBroad, area: carbonLargeArea },
    { label: '闊葉小喬木/針葉/疏葉（低遮蔭）',   gi: CARBON.smallTree,  area: carbonSmallArea },
    { label: '棕櫚類',                             gi: CARBON.palm,       area: carbonPalmArea  },
    { label: '灌木（每㎡栽植2株以上）',            gi: CARBON.shrub,      area: allShrub        },
    { label: '草花/地被/草皮/薄層/壁掛/其他',     gi: CARBON.grass,      area: allOther        },
  ];

  const coverOk  = coverRate  >= std.cover;
  const volumeOk = volumeRate >= std.volume;
  const carbonOk = A_prime > 0 && actualCarbon >= reqCarbon;

  return (
    <>
      {/* 第5條：等效綠覆面積彙整 */}
      <div className={cardCls}>
        <h2 className={hCls}>
          <span className="material-symbols-outlined text-primary text-[20px]">summarize</span>
          第5條：等效綠覆面積彙整
        </h2>

        <div className="overflow-x-auto mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant rounded-tl-lg">植栽種類</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant">面積 (m²)</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant">降溫係數</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant rounded-tr-lg">等效面積 (m²)</th>
              </tr>
            </thead>
            <tbody>
              {coolRows.map(({ label, area, coeff }, i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface'}>
                  <td className="px-4 py-3 text-on-surface text-xs">{label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-on-surface text-xs">{area.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary text-xs">× {coeff}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary text-xs">{(area*coeff).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-bold">
                <td className="px-4 py-3 text-on-surface text-sm rounded-bl-lg">合計</td>
                <td className="px-4 py-3 text-right text-on-surface text-sm">{totalGreen.toFixed(2)}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right text-primary text-sm rounded-br-lg">{effectiveGreen.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 綠覆率 / 綠容率 */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '綠覆率', sub: '總綠覆 ÷ 法定空地', val: `${coverRate.toFixed(2)}%`, req: `≥ ${std.cover}%`, ok: coverOk },
            { label: '綠容率', sub: '等效綠覆 ÷ 基地面積', val: volumeRate.toFixed(3), req: `≥ ${std.volume}`, ok: volumeOk },
          ].map(({ label, sub, val, req, ok }) => (
            <div key={label} className={`rounded-xl p-5 text-center ${ok ? 'bg-tertiary-container/40' : 'bg-error-container/20'}`}>
              <div className="text-xs text-on-surface-variant mb-1">{label}</div>
              <div className="text-xs text-on-surface-variant mb-2">{sub}</div>
              <div className={`text-3xl font-black font-headline ${ok ? 'text-primary' : 'text-error'}`}>{val}</div>
              <div className="text-xs text-on-surface-variant mt-2">需 {req}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 第6條：固碳當量 */}
      <div className={cardCls}>
        <h2 className={hCls}>
          <span className="material-symbols-outlined text-primary text-[20px]">co2</span>
          第6條：固碳當量明細
        </h2>
        <p className="text-xs text-on-surface-variant mb-5">
          依建築基地綠化設計技術規範 表1 ｜ TCO₂ = (ΣGi × Ai) × α　vs　TCO₂c = 0.5 × A'({A_prime.toFixed(2)} m²) × β({std.carbon})
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant rounded-tl-lg">植栽類型</th>
                <th className="text-right px-4 py-3 font-bold text-on-surface-variant">Gi</th>
                <th className="text-right px-4 py-3 font-bold text-on-surface-variant">Ai (m²)</th>
                <th className="text-right px-4 py-3 font-bold text-on-surface-variant rounded-tr-lg">Gi × Ai</th>
              </tr>
            </thead>
            <tbody>
              {carbonRows.map(({ label, gi, area }, i) => (
                <tr key={label} className={`${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface'} ${area <= 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-on-surface">{label}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{gi.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{area.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-on-surface">{(gi * area).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-bold">
                <td className="px-4 py-3 rounded-bl-lg" colSpan={3}>ΣGi × Ai（× α 之前）</td>
                <td className="px-4 py-3 text-right text-on-surface rounded-br-lg">{sumGiAi.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* α */}
        <div className="flex items-center gap-3 mb-4 bg-surface-container-low rounded-xl p-4">
          <span className="text-xs text-on-surface-variant font-semibold">× 生態綠化修正係數 α =</span>
          <span className="text-2xl font-black font-headline text-primary">{alpha.toFixed(2)}</span>
          <span className="text-xs text-on-surface-variant">（0.80 無計畫 ～ 1.30 全面原生植物）</span>
        </div>

        {/* 固碳量比較 */}
        <div className={`flex flex-wrap justify-between items-center rounded-xl p-5 gap-3 ${carbonOk ? 'bg-tertiary-container/40' : A_prime > 0 ? 'bg-error-container/20' : 'bg-surface-container-low'}`}>
          <div>
            <div className="text-xs text-on-surface-variant mb-1">綠化總固碳當量 TCO₂</div>
            <div className={`text-3xl font-black font-headline ${carbonOk ? 'text-primary' : A_prime > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
              {actualCarbon.toFixed(2)}
              <span className="text-sm font-normal text-on-surface-variant ml-1">kgCO₂e/yr</span>
            </div>
          </div>
          <div className={`text-2xl font-black ${carbonOk ? 'text-primary' : 'text-error'}`}>
            {A_prime > 0 ? (carbonOk ? '≥' : '<') : '—'}
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant mb-1">固碳當量基準值 TCO₂c</div>
            <div className="text-3xl font-black font-headline text-on-surface">
              {reqCarbon.toFixed(2)}
              <span className="text-sm font-normal text-on-surface-variant ml-1">kgCO₂e/yr</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-1">= 0.5 × {A_prime.toFixed(2)} × {std.carbon}</div>
          </div>
        </div>
      </div>
    </>
  );
}
