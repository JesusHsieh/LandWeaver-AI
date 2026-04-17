import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'GEMINI_API_KEY';

export const getApiKey = (): string => {
  return localStorage.getItem(STORAGE_KEY) || process.env.API_KEY || '';
};

const ApiKeyManager: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHasKey(true);
      setKeyInput(stored);
    } else if (process.env.API_KEY && process.env.API_KEY !== 'PLACEHOLDER_API_KEY') {
      // Env var exists — auto-save it to localStorage silently
      localStorage.setItem(STORAGE_KEY, process.env.API_KEY);
      setHasKey(true);
      setKeyInput(process.env.API_KEY);
    } else {
      // No key anywhere — show modal on first load
      setShowModal(true);
    }
  }, []);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setHasKey(true);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowModal(false);
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeyInput('');
    setHasKey(false);
    setShowModal(true);
  };

  return (
    <>
      {/* Floating key button */}
      <button
        onClick={() => { setShowModal(true); setSaved(false); }}
        title={hasKey ? '變更 Gemini API Key' : '設定 Gemini API Key'}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          zIndex: 9999,
          width: '44px', height: '44px',
          borderRadius: '50%',
          border: hasKey ? '2px solid #2d6330' : '2px solid #dc2626',
          background: hasKey ? '#1f3f21' : '#7f1d1d',
          color: 'white', fontSize: '18px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s',
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '32px', maxWidth: '460px', width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#1f3f21', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', flexShrink: 0
              }}>🌿</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  LandWeaver AI
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Gemini API Key 設定
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', margin: '16px 0 20px', lineHeight: 1.6 }}>
              請輸入你的 Gemini API Key。Key 僅儲存於本機瀏覽器（localStorage），不會上傳至任何伺服器。
            </p>

            {/* Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                API KEY
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="AIza..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '14px', color: '#1e293b',
                  background: '#f8fafc', outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
                onFocus={e => (e.target.style.borderColor = '#2d6330')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#2d6330', textDecoration: 'underline' }}
            >
              🔗 前往 Google AI Studio 取得免費 API Key
            </a>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={handleSave}
                disabled={!keyInput.trim()}
                style={{
                  flex: 1, padding: '10px',
                  background: keyInput.trim() ? '#2d6330' : '#94a3b8',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: keyInput.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {saved ? '✓ 已儲存！' : '儲存並繼續'}
              </button>
              {hasKey && (
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent', border: '1.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              )}
            </div>

            {/* Clear */}
            {hasKey && (
              <button
                onClick={handleClear}
                style={{
                  marginTop: '12px', width: '100%', padding: '8px',
                  background: 'transparent', border: 'none',
                  fontSize: '12px', color: '#ef4444', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                清除已儲存的 Key
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyManager;
