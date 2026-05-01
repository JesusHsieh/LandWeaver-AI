import { STANDARDS } from '../constants';
import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { cardCls, hCls, labelCls, subCardCls } from '../styles';

type Props = Pick<GreeneryCalc,
  | 'buildingClass' | 'setBuildingClass'
  | 'baseArea' | 'setBaseArea'
  | 'bcr' | 'setBcr'
  | 'nonGreenable' | 'setNonGreenable'
  | 'alphaInput' | 'setAlphaInput'
  | 'std' | 'legalSpace' | 'calcFootprint' | 'A_prime' | 'totalGreen'
>;

export function SiteBasics({ buildingClass, setBuildingClass, baseArea, setBaseArea, bcr, setBcr,
  nonGreenable, setNonGreenable, alphaInput, setAlphaInput,
  std, legalSpace, calcFootprint, A_prime, totalGreen }: Props) {
  return (
    <>
      {/* 第4條：建築基地分類 */}
      <div className={cardCls}>
        <h2 className={hCls}>
          <span className="material-symbols-outlined text-primary text-[20px]">category</span>
          第4條：建築基地分類
        </h2>
        <select
          value={buildingClass}
          onChange={e => setBuildingClass(e.target.value as keyof typeof STANDARDS)}
          className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm font-medium text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        >
          <option value="1">第一類 — 新開闢 ≥ 1ha 公園用地</option>
          <option value="2">第二類 — 完整街廓 / 公有建築 / ≥1000m²且增加容積</option>
          <option value="3">第三類 — 基地面積 ≥ 1,000 m²（或500–1000m²增加容積）</option>
          <option value="4">第四類 — 基地面積 500–1,000 m²（或住宅區 ≥ 300 m²）</option>
          <option value="5">第五類 — 其他建築基地</option>
        </select>

        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { label: '綠覆率要求',    value: `≥ ${std.cover}%`              },
            { label: '綠容率要求',    value: `≥ ${std.volume}`              },
            { label: '固碳當量基準',  value: `${std.carbon} kg/m²·yr`       },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-low rounded-xl p-4">
              <div className="text-xs text-on-surface-variant mb-2">{label}</div>
              <div className="text-xl font-black font-headline text-primary">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 基地環境基礎數值 */}
      <div className={cardCls}>
        <h2 className={hCls}>
          <span className="material-symbols-outlined text-primary text-[20px]">straighten</span>
          基地環境基礎數值
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[
            {
              label: '建築基地面積 A₀ (m²)',
              val: baseArea, set: setBaseArea,
              placeholder: '請輸入基地面積',
              hint: null,
            },
            {
              label: '建蔽率 r (%)',
              val: bcr, set: setBcr,
              placeholder: '0 – 100',
              hint: `建築面積：${calcFootprint.toFixed(2)} m²`,
            },
            {
              label: '無法綠化面積 Ap (m²)',
              val: nonGreenable, set: setNonGreenable,
              placeholder: '0',
              hint: '消防救災空間、騎樓、基地內通路等',
            },
            {
              label: '生態綠化修正係數 α',
              val: alphaInput, set: setAlphaInput,
              placeholder: '0.80',
              hint: '0.80（無計畫）～ 1.30（全面原生種），無計畫書填 0.80',
            },
          ].map(({ label, val, set, placeholder, hint }) => (
            <div key={label} className="bg-surface-container-low rounded-xl p-5">
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                min="0"
                className="input-accent text-2xl w-full py-1"
              />
              {hint && <p className="text-xs text-on-surface-variant mt-2">{hint}</p>}
            </div>
          ))}
        </div>

        {/* 衍生計算值 */}
        <div className={subCardCls}>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">衍生計算值</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '法定空地面積',   val: legalSpace, sub: '= A₀ × (1 − r)',
                ok: legalSpace > 0 ? totalGreen / legalSpace * 100 >= std.cover : undefined },
              { label: "最小綠化面積 A'", val: A_prime,   sub: '= max((A₀−Ap)×(1−r), 0.15×A₀)' },
              { label: '目前總綠覆面積', val: totalGreen, sub: '= 所有植栽合計',
                ok: legalSpace > 0 ? totalGreen / legalSpace * 100 >= std.cover : undefined },
            ].map(({ label, val, sub, ok }) => (
              <div key={label} className="bg-surface-container-lowest rounded-xl p-4 text-center shadow-sm">
                <div className="text-xs text-on-surface-variant mb-1">{label}</div>
                <div className={`text-2xl font-black font-headline ${ok === false ? 'text-error' : 'text-primary'}`}>
                  {val.toFixed(2)}
                </div>
                <div className="text-[10px] text-outline mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
