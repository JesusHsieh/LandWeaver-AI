import { COOL } from '../constants';
import { Tag } from './Tag';
import { TreeInputGroup } from './TreeInputGroup';
import type { TreeGroupProps } from './TreeInputGroup';

interface Props {
  title: string;
  shade: '高遮蔭' | '低遮蔭';
  bgCls: string;
  borderCls: string;
  titleCls: string;
  totalCls: string;
  totalBorderCls: string;
  groups: TreeGroupProps[];
  total: number;
}

export function TreeSection({ title, shade, bgCls, borderCls, titleCls, totalCls, totalBorderCls, groups, total }: Props) {
  const coeff = shade === '高遮蔭' ? COOL.highShade : COOL.lowShade;
  return (
    <div className={`${bgCls} rounded-lg p-4 border ${borderCls} mb-4`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`font-bold ${titleCls}`}>{title}</h3>
        <Tag label={`綠容率 ×${coeff}`} color={shade === '高遮蔭' ? 'green' : 'blue'} />
        <Tag label="綠覆率" color="green" />
      </div>
      {groups.map((g, i) => <TreeInputGroup key={i} {...g} />)}
      <div className={`p-3 rounded-lg border-2 ${totalBorderCls} bg-white flex justify-between items-center`}>
        <span className={`font-bold ${titleCls}`}>{title}總面積</span>
        <div className="text-right">
          <div className={`text-xl font-bold ${totalCls}`}>{total.toFixed(2)} m²</div>
          <div className="text-xs text-slate-500">等效：{(total * coeff).toFixed(2)} m²（×{coeff}）</div>
        </div>
      </div>
    </div>
  );
}
