import React, { useState } from 'react';

export const LayerRow = ({
  label,
  sub,
  active,
  onClick,
  accent,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) => {
  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`gis-toggle ${on ? 'on' : ''}`}
      aria-checked={on}
      role="switch"
    />
  );

  return (
    <div className="gis-layer-row">
      <div className="flex items-center gap-2 min-w-0">
        {accent && <span className="gis-swatch shrink-0" style={{ background: accent }} />}
        <div className="min-w-0">
          <span
            className="text-[11px] leading-tight block truncate"
            style={{ color: active ? '#F0F0F0' : '#888' }}
          >
            {label}
          </span>
          {sub && (
            <span className="text-[9px] block truncate" style={{ color: '#444' }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      <Toggle on={active} onClick={onClick} />
    </div>
  );
};

export const Section = ({
  label,
  labelColor,
  children,
  defaultCollapsed = false,
}: {
  label: string;
  labelColor?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const cleanLabel = label.replace(/^▸\s*/, '');
  return (
    <section>
      <button
        className="gis-section-label mb-2 w-full text-left flex items-center justify-between gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        style={labelColor ? { color: labelColor } : undefined}
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          <span
            className="shrink-0 text-[8px]"
            style={{
              display: 'inline-block',
              transition: 'transform 0.18s',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            }}
          >
            ▶
          </span>
          {cleanLabel}
        </span>
      </button>
      {!collapsed && children}
    </section>
  );
};

export const BtnGroup = ({
  options,
  active,
  onSelect,
}: {
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) => (
  <div className="gis-btn-group">
    {options.map((opt) => (
      <button
        key={opt}
        className={`gis-btn ${active === opt ? 'active' : ''}`}
        onClick={() => onSelect(opt)}
      >
        {opt}
      </button>
    ))}
  </div>
);
