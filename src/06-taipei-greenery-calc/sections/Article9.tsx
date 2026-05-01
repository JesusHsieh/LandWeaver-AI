import { n } from '../utils';
import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { Tag } from '../components/Tag';
import { cardCls, hCls, labelCls } from '../styles';

type Props = Pick<GreeneryCalc,
  | 'roofTotal' | 'setRoofTotal' | 'roofNonGreen' | 'setRoofNonGreen'
  | 'roofHsArea' | 'setRoofHsArea' | 'roofLsArea' | 'setRoofLsArea'
  | 'roofPalmArea' | 'setRoofPalmArea' | 'roofShrub' | 'setRoofShrub'
  | 'roofOther' | 'setRoofOther'
  | 'roofHs' | 'roofLs' | 'roofPalm' | 'roofShrubArea' | 'roofGreen'
  | 'greenableRoof' | 'roofRate' | 'roofShrubPct'
>;

export function Article9({ roofTotal, setRoofTotal, roofNonGreen, setRoofNonGreen,
  roofHsArea, setRoofHsArea, roofLsArea, setRoofLsArea,
  roofPalmArea, setRoofPalmArea, roofShrub, setRoofShrub, roofOther, setRoofOther,
  roofHs, roofLs, roofPalm, roofShrubArea, roofGreen,
  greenableRoof, roofRate, roofShrubPct }: Props) {
  return (
    <div className={cardCls}>
      <h2 className={hCls}>
        <span className="material-symbols-outlined text-primary text-[20px]">roofing</span>
        第9條：屋頂平臺綠化
      </h2>
      <p className="text-xs text-on-surface-variant mb-5">
        覆土：喬木 ≥ 70 cm、灌木 ≥ 40 cm、其他 ≥ 10 cm（第9條第1款）
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="bg-surface-container-low rounded-xl p-5">
          <label className={labelCls}>屋頂平臺總面積 (m²)</label>
          <input type="number" value={roofTotal} onChange={e => setRoofTotal(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">作為綠覆率分母</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5">
          <label className={labelCls}>無法綠化面積 (m²)</label>
          <input type="number" value={roofNonGreen} onChange={e => setRoofNonGreen(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">太陽能光電設備、洗窗機軌道等</p>
          {greenableRoof > 0 && (
            <p className="text-xs text-primary font-semibold mt-1">→ 可綠化面積 = {greenableRoof.toFixed(2)} m²</p>
          )}
        </div>
      </div>

      {/* 喬木 */}
      <div className="bg-surface-container-low rounded-xl p-5 mb-4">
        <h3 className="font-bold text-on-surface text-sm mb-4">屋頂喬木及棕櫚類（輸入實際種植面積）</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '高遮蔭喬木面積 (m²)', val: roofHsArea, set: setRoofHsArea, tag: '×3.0綠容', equiv: (roofHs*3).toFixed(2) },
            { label: '低遮蔭喬木面積 (m²)', val: roofLsArea, set: setRoofLsArea, tag: '×2.0綠容', equiv: (roofLs*2).toFixed(2) },
            { label: '棕櫚類面積 (m²)',      val: roofPalmArea, set: setRoofPalmArea, tag: '×2.0綠容', equiv: (roofPalm*2).toFixed(2) },
          ].map(({ label, val, set, tag, equiv }) => (
            <div key={label}>
              <div className="flex items-center gap-1 mb-2 flex-wrap">
                <label className={labelCls + ' mb-0'}>{label}</label>
                <Tag label={tag} color="green" />
              </div>
              <input type="number" value={val} onChange={e => set(e.target.value)}
                className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm font-semibold text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="0" min="0" />
              <p className="text-xs text-primary font-semibold mt-1">等效 {equiv} m²</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className={labelCls + ' mb-0'}>灌木面積 (m²)</label>
            <Tag label="應≥屋頂綠覆30%" color="purple" />
            <Tag label="×1.2綠容" color="green" />
          </div>
          <input type="number" value={roofShrub} onChange={e => setRoofShrub(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">覆土 ≥ 40 cm</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className={labelCls + ' mb-0'}>草花、地被、草皮 (m²)</label>
            <Tag label="×1.0綠容" color="orange" />
          </div>
          <input type="number" value={roofOther} onChange={e => setRoofOther(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">覆土 ≥ 10 cm</p>
        </div>
      </div>

      {/* 即時檢核 */}
      {n(roofTotal) > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '屋頂平臺綠覆率（第9條第2項）', val: roofRate,     pass: roofRate >= 50,    detail: `${roofGreen.toFixed(2)} ÷ ${greenableRoof.toFixed(2)} m²　需 ≥ 50%` },
            { label: '屋頂灌木面積比例（第9條第1項）', val: roofShrubPct, pass: roofShrubPct >= 30, detail: `${roofShrubArea.toFixed(2)} ÷ ${roofGreen.toFixed(2)} m²　需 ≥ 30%` },
          ].map(({ label, val, pass, detail }) => (
            <div key={label} className={`rounded-xl p-4 ${pass ? 'bg-tertiary-container/40' : 'bg-error-container/20'}`}>
              <div className="text-xs text-on-surface-variant mb-2">{label}</div>
              <div className={`text-2xl font-black font-headline ${pass ? 'text-primary' : 'text-error'}`}>
                {val.toFixed(2)}%
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">{detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
