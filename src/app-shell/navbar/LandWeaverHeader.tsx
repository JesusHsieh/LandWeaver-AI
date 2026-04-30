import React from 'react';

interface LandWeaverHeaderProps {
  projectName: string;
  projectEmoji?: string;
  subtitle?: string;
  dark?: boolean;
}

const LandWeaverHeader: React.FC<LandWeaverHeaderProps> = ({
  projectName,
  projectEmoji = '🌿',
  subtitle,
}) => {
  return (
    <div
      style={{
        background: 'rgba(14,14,14,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 20px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        flexShrink: 0,
      }}
    >
      {/* Left: brand + module name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '11px', fontWeight: '900',
          color: '#E05A2B', letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          LandWeaver
        </span>
        <span style={{ color: '#333', fontSize: '10px' }}>／</span>
        <span style={{
          fontSize: '10px', fontWeight: '600',
          color: '#555', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {projectEmoji} {projectName}
        </span>
        {subtitle && (
          <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>
            · {subtitle}
          </span>
        )}
      </div>

      {/* Right: status + home */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '9px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#555',
          }}>
            系統連線中
          </span>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#00FF90',
            boxShadow: '0 0 6px #00FF90',
          }} />
        </div>

        {/* Home button */}
        <a
          href="/"
          title="返回工具集首頁"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '9px', fontWeight: '700',
            color: '#888',
            textDecoration: 'none',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = 'rgba(224,90,43,0.12)';
            el.style.borderColor = 'rgba(224,90,43,0.35)';
            el.style.color = '#E05A2B';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = 'rgba(255,255,255,0.04)';
            el.style.borderColor = 'rgba(255,255,255,0.09)';
            el.style.color = '#888';
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          主頁
        </a>
      </div>
    </div>
  );
};

export default LandWeaverHeader;
