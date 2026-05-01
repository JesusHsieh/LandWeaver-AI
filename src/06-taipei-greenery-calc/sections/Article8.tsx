import { TREE_AREA } from '../constants';
import { n } from '../utils';
import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { Tag } from '../components/Tag';
import { cardCls, hCls, labelCls } from '../styles';

type Props = Pick<GreeneryCalc,
  | 'vertHsL' | 'setVertHsL' | 'vertHsM' | 'setVertHsM' | 'vertHsS' | 'setVertHsS' | 'vertHsP' | 'setVertHsP'
  | 'vertLsL' | 'setVertLsL' | 'vertLsM' | 'setVertLsM' | 'vertLsS' | 'setVertLsS' | 'vertLsP' | 'setVertLsP'
  | 'vertShrub' | 'setVertShrub' | 'vertOther' | 'setVertOther'
  | 'vertHsArea' | 'vertLsArea' | 'vertShrubArea' | 'vertOtherArea'
>;

const TREE_TYPES = ['大喬木', '中喬木', '小喬木', '棕櫚類'] as const;
const AREAS = [TREE_AREA.large, TREE_AREA.medium, TREE_AREA.small, TREE_AREA.palm];

export function Article8({ vertHsL, setVertHsL, vertHsM, setVertHsM, vertHsS, setVertHsS, vertHsP, setVertHsP,
  vertLsL, setVertLsL, vertLsM, setVertLsM, vertLsS, setVertLsS, vertLsP, setVertLsP,
  vertShrub, setVertShrub, vertOther, setVertOther,
  vertHsArea, vertLsArea, vertShrubArea, vertOtherArea }: Props) {

  const hsVals: [string,string,string,string] = [vertHsL, vertHsM, vertHsS, vertHsP];
  const hsSets = [setVertHsL, setVertHsM, setVertHsS, setVertHsP];
  const lsVals: [string,string,string,string] = [vertLsL, vertLsM, vertLsS, vertLsP];
  const lsSets = [setVertLsL, setVertLsM, setVertLsS, setVertLsP];

  return (
    <div className={cardCls}>
      <h2 className={hCls}>
        <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
        第8條：立體綠化設施
      </h2>
      <p className="text-xs text-on-surface-variant mb-5">
        覆土：喬木 ≥ 70 cm、灌木 ≥ 40 cm、其他 ≥ 10 cm（第8條第1款）
      </p>

      {/* 高遮蔭喬木 */}
      <div className="bg-surface-container-low rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h3 className="font-bold text-on-surface text-sm">高遮蔭喬木</h3>
          <Tag label="綠容率 ×3.0" color="green" />
          <Tag label="綠覆率" color="green" />
          <span className="text-xs text-on-surface-variant">覆土 ≥ 70 cm，不分覆土深度折算</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {TREE_TYPES.map((type, ti) => (
            <div key={type}>
              <label className="block text-xs text-on-surface-variant mb-2">
                {type} (株)<br />
                <span className="text-outline">{AREAS[ti]} m²/株</span>
              </label>
              <input type="number" value={hsVals[ti]} onChange={e => hsSets[ti](e.target.value)}
                className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm font-semibold text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="0" min="0" />
              <p className="text-xs text-primary font-semibold mt-1">= {(n(hsVals[ti])*AREAS[ti]).toFixed(2)} m²</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-on-surface">小計</span>
          <div className="text-right">
            <span className="font-bold text-primary">{vertHsArea.toFixed(2)} m²</span>
            <span className="text-xs text-on-surface-variant ml-2">等效 {(vertHsArea*3).toFixed(2)} m²</span>
          </div>
        </div>
      </div>

      {/* 低遮蔭喬木 */}
      <div className="bg-surface-container-low rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h3 className="font-bold text-on-surface text-sm">低遮蔭喬木</h3>
          <Tag label="綠容率 ×2.0" color="blue" />
          <Tag label="綠覆率" color="green" />
          <span className="text-xs text-on-surface-variant">覆土 ≥ 70 cm，不分覆土深度折算</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {TREE_TYPES.map((type, ti) => (
            <div key={type}>
              <label className="block text-xs text-on-surface-variant mb-2">
                {type} (株)<br />
                <span className="text-outline">{AREAS[ti]} m²/株</span>
              </label>
              <input type="number" value={lsVals[ti]} onChange={e => lsSets[ti](e.target.value)}
                className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm font-semibold text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="0" min="0" />
              <p className="text-xs text-primary font-semibold mt-1">= {(n(lsVals[ti])*AREAS[ti]).toFixed(2)} m²</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-surface-container-lowest rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-on-surface">小計</span>
          <div className="text-right">
            <span className="font-bold text-primary">{vertLsArea.toFixed(2)} m²</span>
            <span className="text-xs text-on-surface-variant ml-2">等效 {(vertLsArea*2).toFixed(2)} m²</span>
          </div>
        </div>
      </div>

      {/* 灌木、其他 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className={labelCls + ' mb-0'}>灌木面積 (m²)</label>
            <Tag label="×1.2綠容" color="green" />
          </div>
          <input type="number" value={vertShrub} onChange={e => setVertShrub(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">覆土 ≥ 40 cm</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className={labelCls + ' mb-0'}>其他植栽面積 (m²)</label>
            <Tag label="×1.0綠容" color="orange" />
          </div>
          <input type="number" value={vertOther} onChange={e => setVertOther(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">覆土 ≥ 10 cm（藤蔓、草花、地被、草皮）</p>
        </div>
      </div>

      {/* 合計 */}
      <div className="p-4 bg-surface-container-low rounded-xl flex justify-between items-center">
        <span className="font-semibold text-on-surface text-sm">立體綠化合計</span>
        <div className="text-right">
          <span className="font-bold text-primary">{(vertHsArea+vertLsArea+vertShrubArea+vertOtherArea).toFixed(2)} m²</span>
          <div className="text-xs text-on-surface-variant mt-0.5">
            等效 {(vertHsArea*3 + vertLsArea*2 + vertShrubArea*1.2 + vertOtherArea).toFixed(2)} m²
          </div>
        </div>
      </div>
    </div>
  );
}
