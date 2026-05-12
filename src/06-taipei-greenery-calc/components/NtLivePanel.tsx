import type { NewTaipeiCalc } from '../hooks/useNewTaipeiCalc';

interface Props {
  nt: NewTaipeiCalc;
}

export function NtLivePanel({ nt }: Props) {
  const coverOk = nt.coverPass === true;
  const treeOk  = nt.treePass  === true;

  return (
    <section className="glass-panel p-7 rounded-xl shadow-xl border border-white/30 sticky top-[72px]">
      <div className="flex items-center justify-between mb-7">
        <h3 className="font-headline text-base font-bold text-[#0D4D4D]">即時試算結果</h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-sm font-bold uppercase tracking-wider">Live</span>
      </div>

      {/* 大指標：綠覆率 */}
      <div className="mb-6">
        <div className="text-xs text-on-surface-variant font-medium mb-1">綠覆率</div>
        <div className={`text-5xl font-black font-headline tracking-tighter ${coverOk ? 'text-primary' : nt.os > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
          {nt.os > 0 ? `${nt.coverRate.toFixed(1)}%` : '—'}
        </div>
        <div className="text-xs text-on-surface-variant mt-1">法規門檻 <span className="font-bold text-on-surface">100%</span></div>
        {nt.os > 0 && (
          <div className="mt-3 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${coverOk ? 'bg-primary' : 'bg-error'}`}
              style={{ width: `${Math.min(nt.coverRate, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 mb-7">
        {[
          { label: '總綠覆面積', val: nt.totalCover > 0 ? `${nt.totalCover.toFixed(2)} m²` : '—' },
          { label: '實設空地',   val: nt.os > 0 ? `${nt.os.toFixed(2)} m²` : '—' },
          { label: '喬木配置',   val: nt.ga > 0 ? `${nt.totalTreeCount} / ${nt.requiredTrees} 棵` : '—', ok: treeOk },
        ].map(({ label, val, ok }) => (
          <div key={label} className="flex justify-between items-baseline">
            <span className="text-sm text-on-surface-variant">{label}</span>
            <span className={`text-base font-bold font-headline ${ok === true ? 'text-primary' : ok === false ? 'text-error' : 'text-on-surface'}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* 通過/不通過/待確認 */}
      <div className="grid grid-cols-3 gap-2 pt-5 border-t border-surface-container">
        {[
          { count: nt.passCount,    label: '通過',  cls: 'bg-tertiary-container text-on-tertiary-container' },
          { count: nt.failCount,    label: '未通過', cls: 'bg-error-container    text-on-error-container'    },
          { count: nt.pendingCount, label: '待確認', cls: 'bg-surface-container  text-on-surface-variant'    },
        ].map(({ count, label, cls }) => (
          <div key={label} className={`${cls} rounded-lg p-3 text-center`}>
            <div className="text-2xl font-black font-headline">{count}</div>
            <div className="text-[10px] font-semibold mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-outline mt-5 leading-relaxed">
        依《新北市都市設計審議原則》第8條 及《都市計畫法新北市施行細則》計算。
      </p>
    </section>
  );
}
