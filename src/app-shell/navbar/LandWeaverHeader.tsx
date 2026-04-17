import React from 'react';

interface LandWeaverHeaderProps {
  projectName: string;
  projectEmoji?: string;
  subtitle?: string;
  dark?: boolean; // true for dark-theme projects (03, 04)
}

const LandWeaverHeader: React.FC<LandWeaverHeaderProps> = ({
  projectName,
  projectEmoji = '🌿',
  subtitle,
  dark = false,
}) => {
  const bg = dark ? 'var(--color-header-dark)' : 'var(--color-header-light)';
  const borderColor = dark ? 'var(--color-header-border-dark)' : 'var(--color-header-border-light)';

  return (
    <div
      style={{
        background: bg,
        borderBottom: `1px solid ${borderColor}`,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        flexShrink: 0,
      }}
    >
      {/* Left: logo + project name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px', height: '28px',
            borderRadius: '7px',
            background: '#2d6330',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0,
          }}
        >
          🌿
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '12px', fontWeight: '600',
              color: 'var(--color-header-text)', letterSpacing: '0.03em',
            }}>
              LandWeaver AI
            </span>
            <span style={{ color: '#3d7d3d', fontSize: '11px' }}>›</span>
            <span style={{
              fontSize: '12px', fontWeight: '500',
              color: 'var(--color-header-text-sub)',
            }}>
              {projectEmoji} {projectName}
            </span>
          </div>
          {subtitle && (
            <div style={{ fontSize: '10px', color: '#5a8f5a', marginTop: '1px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right: back to home */}
      <a
        href="/"
        title="返回工具集首頁"
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-header-text)',
          textDecoration: 'none',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid #2d6330',
          background: 'rgba(45,99,48,0.25)',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(45,99,48,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(45,99,48,0.25)')}
      >
        ← 返回首頁
      </a>
    </div>
  );
};

export default LandWeaverHeader;
