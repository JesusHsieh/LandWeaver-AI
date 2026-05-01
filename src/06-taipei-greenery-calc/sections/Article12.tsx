import type { GreeneryCalc } from '../hooks/useGreeneryCalc';
import { n } from '../utils';
import { cardCls, hCls, labelCls } from '../styles';

type Props = Pick<GreeneryCalc, 'pavTotal' | 'setPavTotal' | 'pavPerm' | 'setPavPerm' | 'permeableRate'>;

export function Article12({ pavTotal, setPavTotal, pavPerm, setPavPerm, permeableRate }: Props) {
  const hasData = n(pavTotal) > 0;
  const pass    = permeableRate >= 50;

  return (
    <div className={cardCls}>
      <h2 className={hCls}>
        <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
        第12條：透水鋪面
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="bg-surface-container-low rounded-xl p-5">
          <label className={labelCls}>鋪面總面積 (m²)</label>
          <input type="number" value={pavTotal} onChange={e => setPavTotal(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
          <p className="text-xs text-on-surface-variant mt-2">車道、人行步道或廣場</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5">
          <label className={labelCls}>透水鋪面面積 (m²)</label>
          <input type="number" value={pavPerm} onChange={e => setPavPerm(e.target.value)}
            className="input-accent text-2xl w-full py-1" placeholder="0" min="0" />
        </div>
      </div>

      {hasData && (
        <div className={`rounded-xl p-5 flex flex-wrap justify-between items-center gap-3 ${
          pass ? 'bg-tertiary-container/40' : 'bg-error-container/20'
        }`}>
          <div>
            <div className="text-xs text-on-surface-variant">
              {n(pavPerm).toFixed(2)} m² ÷ {n(pavTotal).toFixed(2)} m²
            </div>
            <div className={`text-3xl font-black font-headline mt-1 ${pass ? 'text-primary' : 'text-error'}`}>
              {permeableRate.toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant">需達</div>
            <div className="text-3xl font-black font-headline text-on-surface">≥ 50%</div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${
            pass ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'
          }`}>
            {pass ? '✓ 符合' : '✗ 不足'}
          </div>
        </div>
      )}
    </div>
  );
}
