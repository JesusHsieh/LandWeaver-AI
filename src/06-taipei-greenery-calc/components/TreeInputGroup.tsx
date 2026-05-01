import { n } from '../utils';
import { TREE_AREA } from '../constants';

const TYPES = ['大喬木', '中喬木', '小喬木', '棕櫚類'] as const;
const AREAS = [TREE_AREA.large, TREE_AREA.medium, TREE_AREA.small, TREE_AREA.palm];

export interface TreeGroupProps {
  label: string;
  borderCls: string;
  factor: number;
  vars: [string, string, string, string];
  setters: [(v: string) => void, (v: string) => void, (v: string) => void, (v: string) => void];
}

export function TreeInputGroup({ label, borderCls, factor, vars, setters }: TreeGroupProps) {
  const subtotal = AREAS.reduce((s, a, i) => s + n(vars[i]) * a, 0) * factor;
  return (
    <div className={`bg-white rounded-lg p-3 mb-2 border-2 ${borderCls}`}>
      <div className="text-sm font-semibold text-slate-700 mb-2 flex justify-between items-center">
        <span>{label}</span>
        <span className="text-xs text-slate-500">
          小計：<span className="font-bold text-slate-700">{subtotal.toFixed(2)} m²</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((type, ti) => (
          <div key={ti}>
            <label className="block text-xs text-slate-500 mb-1">
              {type} (株)<br />
              <span className="text-slate-400">{AREAS[ti]} m²/株 × {factor}</span>
            </label>
            <input
              type="number" value={vars[ti]} onChange={e => setters[ti](e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="0" min="0"
            />
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              = {(n(vars[ti]) * AREAS[ti] * factor).toFixed(2)} m²
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
