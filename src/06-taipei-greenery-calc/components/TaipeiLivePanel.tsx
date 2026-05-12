import type { GreeneryCalc } from '../hooks/useGreeneryCalc';

interface Props {
  c: GreeneryCalc;
}

export function TaipeiLivePanel({ c }: Props) {
  const coverOk   = c.coverPass  === true;
  const volumeOk  = c.volumePass === true;
  const carbonOk  = c.carbonPass === true;

  return (
    <>
      {/* 即時試算 */}
      <section className="glass-panel p-7 rounded-xl shadow-xl border border-white/30 sticky top-[72px]">
        <div className="flex items-center justify-between mb-7">
          <h3 className="font-headline text-base font-bold text-[#0D4D4D]">即時試算結果</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-sm font-bold uppercase tracking-wider">Live</span>
        </div>

        {/* 大指標 */}
        <div className="mb-6">
          <div className="text-xs text-on-surface-variant font-medium mb-1">綠覆率</div>
          <div className={`text-5xl font-black font-headline tracking-tighter ${coverOk ? 'text-primary' : c.legalSpace > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
            {c.legalSpace > 0 ? `${c.coverRate.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-on-surface-variant mt-1">
            法規門檻 <span className="font-bold text-on-surface">{c.std.cover}%</span>
          </div>
          {c.legalSpace > 0 && (
            <div className="mt-3 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${coverOk ? 'bg-primary' : 'bg-error'}`}
                style={{ width: `${Math.min(c.coverRate / c.std.cover * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 mb-7">
          {[
            { label: '法定空地面積',    val: c.legalSpace  > 0 ? `${c.legalSpace.toFixed(2)} m²`  : '—' },
            { label: "最小綠化面積 A'", val: c.A_prime     > 0 ? `${c.A_prime.toFixed(2)} m²`     : '—' },
            { label: '總綠覆面積',      val: c.totalGreen  > 0 ? `${c.totalGreen.toFixed(2)} m²`  : '—' },
            { label: '綠容率',          val: c.legalSpace  > 0 ? c.volumeRate.toFixed(2)           : '—', ok: volumeOk },
            { label: '固碳量 TCO₂',    val: c.A_prime     > 0 ? `${c.actualCarbon.toFixed(2)}`    : '—', ok: carbonOk },
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
            { count: c.passCount,    label: '通過',  cls: 'bg-tertiary-container text-on-tertiary-container' },
            { count: c.failCount,    label: '未通過', cls: 'bg-error-container    text-on-error-container'    },
            { count: c.pendingCount, label: '待確認', cls: 'bg-surface-container  text-on-surface-variant'    },
          ].map(({ count, label, cls }) => (
            <div key={label} className={`${cls} rounded-lg p-3 text-center`}>
              <div className="text-2xl font-black font-headline">{count}</div>
              <div className="text-[10px] font-semibold mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-outline mt-5 leading-relaxed">
          依《台北市新建築物綠化實施規則》115年版計算，數據僅供參考。
        </p>
      </section>
    </>
  );
}
