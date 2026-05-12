import React from 'react';
import { fmtDist } from '../utils/geo';

interface ElevProfilePanelProps {
  data: { d: number; e: number }[];
  onClose: () => void;
}

// Simple SVG elevation profile
export const ElevProfilePanel: React.FC<ElevProfilePanelProps> = ({ data, onClose }) => {
  if (!data.length) return null;
  const minE = Math.min(...data.map(p => p.e));
  const maxE = Math.max(...data.map(p => p.e));
  const totalD = data[data.length - 1].d;
  const W = 220; const H = 80; const PAD = 16;
  const iW = W - PAD * 2; const iH = H - PAD * 2;
  const scaleX = (d: number) => PAD + (d / totalD) * iW;
  const scaleY = (e: number) => PAD + iH - ((e - minE) / Math.max(maxE - minE, 1)) * iH;
  const pts = data.map(p => `${scaleX(p.d).toFixed(1)},${scaleY(p.e).toFixed(1)}`).join(' ');
  const area = `M${scaleX(0)},${scaleY(data[0].e)} ` +
    data.map(p => `L${scaleX(p.d).toFixed(1)},${scaleY(p.e).toFixed(1)}`).join(' ') +
    ` L${scaleX(totalD)},${H - PAD} L${scaleX(0)},${H - PAD} Z`;
  return (
    <div style={{
      position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(14,14,14,0.92)', border: '1px solid rgba(139,195,74,0.35)',
      borderRadius: 6, padding: '8px 10px', zIndex: 40, pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: '#8BC34A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          高程剖面 · {fmtDist(totalD)}
        </span>
        <button onClick={onClose} style={{ fontSize: 10, color: '#555', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 8 }}>✕</button>
      </div>
      <svg width={W} height={H}>
        <path d={area} fill="rgba(139,195,74,0.15)" />
        <polyline points={pts} fill="none" stroke="#8BC34A" strokeWidth={1.5} />
        {data.map((p, i) => (
          <circle key={i} cx={scaleX(p.d)} cy={scaleY(p.e)} r={2} fill="#8BC34A" />
        ))}
        <text x={PAD} y={PAD - 4} fontSize={8} fill="#666">{maxE.toFixed(0)} m</text>
        <text x={PAD} y={H - 4} fontSize={8} fill="#666">{minE.toFixed(0)} m</text>
      </svg>
    </div>
  );
};
