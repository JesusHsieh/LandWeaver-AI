import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { cardCls, hCls } from '../styles';

type Props = Pick<GreeneryCalc, 'checks'>;

export function CheckResults({ checks }: Props) {
  return (
    <div className={cardCls}>
      <h2 className={hCls}>
        <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
        法規檢核結果總覽
      </h2>

      <ul className="space-y-3">
        {checks.map((c, i) => (
          <li key={i} className={`rounded-xl p-5 transition-colors ${
            c.pass === null  ? 'bg-surface-container-low'
            : c.pass         ? 'bg-tertiary-container/40'
            :                  'bg-error-container/20'
          }`}>
            <div className="flex flex-wrap justify-between items-start gap-3">
              {/* 左：名稱 + 條號 */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  c.pass === null  ? 'bg-surface-container-highest text-outline'
                  : c.pass         ? 'bg-tertiary-container text-on-tertiary-container'
                  :                  'bg-error-container text-on-error-container'
                }`}>
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'wght' 700" }}>
                    {c.pass === null ? 'horizontal_rule' : c.pass ? 'done' : 'priority_high'}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-on-surface text-sm">{c.name}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">{c.art}</div>
                </div>
              </div>

              {/* 右：應達 / 實際 */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-on-surface-variant">應達</div>
                  <div className="text-sm font-semibold text-on-surface">{c.req}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-on-surface-variant">實際</div>
                  <div className={`text-sm font-bold ${
                    c.pass === null ? 'text-on-surface-variant' : c.pass ? 'text-primary' : 'text-error'
                  }`}>{c.act}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                  c.pass === null  ? 'bg-surface-container-high text-on-surface-variant'
                  : c.pass         ? 'bg-tertiary-container text-on-tertiary-container'
                  :                  'bg-error-container text-on-error-container'
                }`}>
                  {c.pass === null ? '待確認' : c.pass ? '✓ 通過' : '✗ 未通過'}
                </div>
              </div>
            </div>

            {/* 計算式 */}
            <div className="mt-3 ml-8 text-[11px] text-on-surface-variant bg-surface-container-lowest/80 rounded-lg px-3 py-2 inline-block">
              {c.formula}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
