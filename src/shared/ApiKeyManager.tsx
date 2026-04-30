import React, { useState, useEffect } from 'react';
import {
  ImageProvider,
  PROVIDER_LABELS,
  PROVIDER_KEY_HINT,
  PROVIDER_LINK,
  getImageProvider,
  getImageProviderKey,
  setImageProvider,
  setImageProviderKey,
  clearImageProvider,
  isImageProviderReady,
} from './imageGenerationService';

const PROVIDERS: ImageProvider[] = ['gemini', 'together', 'huggingface', 'stability'];

const ApiKeyManager: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState<ImageProvider>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getImageProvider();
    const k = getImageProviderKey();
    setProvider(p);
    setKeyInput(k);
    const isReady = isImageProviderReady();
    setReady(isReady);
    if (!isReady) setShowModal(true);
  }, []);

  const handleProviderChange = (p: ImageProvider) => {
    setProvider(p);
    // Load saved key for new provider if any
    setKeyInput(getImageProviderKey());
  };

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setImageProvider(provider);
    setImageProviderKey(trimmed);
    setReady(true);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowModal(false); }, 900);
  };

  const handleClear = () => {
    clearImageProvider();
    setProvider('gemini');
    setKeyInput('');
    setReady(false);
    setShowModal(true);
  };

  const canSave = keyInput.trim().length > 0;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setShowModal(true); setSaved(false); }}
        title="設定圖片生成 API"
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          width: '44px', height: '44px', borderRadius: '50%',
          border: ready ? '2px solid #2d6330' : '2px solid #dc2626',
          background: ready ? '#1f3f21' : '#7f1d1d',
          color: 'white', fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🔑
      </button>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', background: '#1f3f21',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
              }}>🌿</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>圖片生成 API</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>選擇服務商，Key 僅儲存於本機瀏覽器</p>
              </div>
            </div>

            {/* Provider selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                服務商
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PROVIDERS.map(p => {
                  const isSelected = provider === p;
                  return (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: isSelected ? '2px solid #2d6330' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#f0fdf4' : '#f8fafc',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: '#1e293b' }}>
                        {PROVIDER_LABELS[p]}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        color: '#92400e', background: '#fef3c7',
                        padding: '2px 7px', borderRadius: '99px',
                      }}>
                        需 API Key
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key input */}
            <div style={{ marginBottom: '4px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                API Key
                <a href={PROVIDER_LINK[provider]} target="_blank" rel="noreferrer"
                  style={{ marginLeft: '8px', fontSize: '11px', color: '#2d6330', textDecoration: 'none' }}>
                  申請 →
                </a>
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSave && handleSave()}
                placeholder={PROVIDER_KEY_HINT[provider]}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '14px', color: '#1e293b', background: '#f8fafc',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                }}
                onFocus={e => (e.target.style.borderColor = '#2d6330')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  flex: 1, padding: '10px',
                  background: canSave ? '#2d6330' : '#94a3b8',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
              >
                {saved ? '✓ 已儲存！' : '儲存並繼續'}
              </button>
              {ready && (
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 16px', background: 'transparent',
                    border: '1.5px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', color: '#64748b', cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              )}
            </div>

            {ready && (
              <button
                onClick={handleClear}
                style={{
                  marginTop: '10px', width: '100%', padding: '8px',
                  background: 'transparent', border: 'none',
                  fontSize: '12px', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                清除設定
              </button>
            )}

            {/* Links */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>申請 API Key 連結</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PROVIDERS.map(p => (
                  <a key={p} href={PROVIDER_LINK[p]} target="_blank" rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0',
                      textDecoration: 'none', background: '#f8fafc', fontSize: '12px',
                      color: '#374151', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0fdf4'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f8fafc'; }}
                  >
                    <span>{PROVIDER_LABELS[p]}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/><path d="M10 14 21 3"/>
                      <path d="M21 16v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Legacy export kept for backward compatibility
export const getApiKey = (): string => getImageProviderKey();

export default ApiKeyManager;
