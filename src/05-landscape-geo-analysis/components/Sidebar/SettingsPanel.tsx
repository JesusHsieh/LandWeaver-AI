import React, { useState } from 'react';
import { MapSettings } from '../../types';
import { IMAGE_API_KEY_STORE } from '../../../shared/apiKeyService';

const API_FIELDS = [
  {
    key: IMAGE_API_KEY_STORE,
    label: 'Google Gemini API Key',
    sub: 'AI 景觀策略診斷 · gemini-2.0-flash',
    placeholder: 'AIzaSy...',
    url: 'https://aistudio.google.com/apikey',
    color: '#BCFD49',
    needsReload: false,
  },
  {
    key: 'VITE_CWA_API_KEY',
    label: '中央氣象署 CWA',
    sub: '氣溫・濕度・風速・降雨',
    placeholder: 'CWA-XXXXXXXX...',
    url: 'https://opendata.cwa.gov.tw/userLogin',
    color: '#2196F3',
    needsReload: false,
  },
  {
    key: 'VITE_EPA_API_KEY',
    label: '環境部 EPA',
    sub: 'PM2.5・AQI 空氣品質',
    placeholder: 'epa_api_key...',
    url: 'https://data.moenv.gov.tw/',
    color: '#4CAF50',
    needsReload: false,
  },
  {
    key: 'VITE_CESIUM_ION_TOKEN',
    label: 'Cesium Ion Token',
    sub: 'Google Earth 3D・衛星底圖',
    placeholder: 'eyJh...',
    url: 'https://ion.cesium.com/tokens',
    color: '#E05A2B',
    needsReload: true,
  },
  {
    key: 'VITE_TDX_CLIENT_ID',
    label: 'TDX Client ID',
    sub: '北捷・高鐵・台鐵・桃捷・中捷・高捷列車動態',
    placeholder: 'tdx-xxxxxxxx-xxxx...',
    url: 'https://tdx.transportdata.tw/register',
    color: '#FF6F00',
    needsReload: false,
  },
  {
    key: 'VITE_TDX_CLIENT_SECRET',
    label: 'TDX Client Secret',
    sub: 'tdx.transportdata.tw · 免費方案 100 req/min',
    placeholder: 'xxxxxxxx-xxxx-xxxx...',
    url: 'https://tdx.transportdata.tw/register',
    color: '#FF6F00',
    needsReload: false,
  },
  {
    key: 'VITE_SEGIS_APP_ID',
    label: 'SEGIS APPID',
    sub: '內政部統計地圖 · 都市土地使用分區',
    placeholder: 'APPID...',
    url: 'https://segis.moi.gov.tw/SEGIS/',
    color: '#9C27B0',
    needsReload: false,
  },
  {
    key: 'VITE_SEGIS_API_KEY',
    label: 'SEGIS APIKEY',
    sub: 'segis.moi.gov.tw · 免費申請',
    placeholder: 'APIKEY...',
    url: 'https://segis.moi.gov.tw/SEGIS/',
    color: '#9C27B0',
    needsReload: false,
  },
] as const;

/** TDX 列車動態開關清單（需 TDX Key） */
const TDX_TRAIN_TOGGLES: {
  key: keyof MapSettings;
  label: string;
  color: string;
}[] = [
  { key: 'showMrtTrains',          label: '北捷列車',  color: '#FFD600' },
  { key: 'showThsrTrains',         label: '高鐵列車',  color: '#FF8A80' },
  { key: 'showTRATrains',          label: '台鐵列車',  color: '#60A5FA' },
  { key: 'showTaoyuanMrtTrains',   label: '桃捷列車',  color: '#C4B5FD' },
  { key: 'showTaichungMrtTrains',  label: '中捷列車',  color: '#86EFAC' },
  { key: 'showKaohsiungMrtTrains', label: '高捷列車',  color: '#FCA5A5' },
];

interface SettingsPanelProps {
  onClose: () => void;
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, settings, set }) => {
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(API_FIELDS.map(f => [f.key, localStorage.getItem(f.key) ?? '']))
  );
  const [saved, setSaved] = useState(false);

  const tdxIsSet = !!(vals['VITE_TDX_CLIENT_ID']?.trim());

  const handleSave = () => {
    API_FIELDS.forEach(f => {
      const v = vals[f.key].trim();
      if (v) localStorage.setItem(f.key, v);
      else localStorage.removeItem(f.key);
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1100);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(6px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E1E1E' }}>
        <div>
          <div className="text-[11px] font-bold" style={{ color: '#F0F0F0' }}>⚙ API 金鑰設定</div>
          <div className="text-[9px] mt-0.5" style={{ color: '#444' }}>僅儲存於本機 localStorage</div>
        </div>
        <button
          onClick={onClose}
          className="text-[13px] leading-none hover:opacity-60 transition-opacity"
          style={{ color: '#666' }}
        >✕</button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {API_FIELDS.map(f => {
          const isSet = !!vals[f.key].trim();
          return (
            <div key={f.key}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isSet ? '#4CAF50' : '#444' }}
                />
                <span className="text-[10px] font-bold" style={{ color: isSet ? '#F0F0F0' : '#888' }}>
                  {f.label}
                </span>
              </div>
              <div className="text-[9px] mb-1.5 pl-3" style={{ color: '#555' }}>{f.sub}</div>
              <input
                type="password"
                value={vals[f.key]}
                onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full text-[10px] font-mono px-2.5 py-1.5 rounded"
                style={{
                  background: '#111',
                  color: '#CCC',
                  border: `1px solid ${isSet ? f.color + '55' : '#222'}`,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] mt-1 block pl-0.5 hover:opacity-80"
                style={{ color: f.color }}
              >
                🔗 免費申請 →
              </a>
              {f.needsReload && isSet && (
                <div className="text-[8px] mt-0.5 pl-0.5" style={{ color: '#FF9800' }}>
                  ⚠ 需重新整理頁面後生效
                </div>
              )}
            </div>
          );
        })}

        {/* ── TDX 列車動態開關 ── */}
        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '14px' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="text-[9px] font-bold tracking-widest" style={{ color: '#FF6F00' }}>
              列車動態開關
            </div>
            {!tdxIsSet && (
              <span className="text-[8px] px-1 rounded" style={{ background: 'rgba(255,111,0,0.12)', color: '#FF9800' }}>
                需先填入 TDX Key
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {TDX_TRAIN_TOGGLES.map(({ key, label, color }) => {
              const on = settings[key] as boolean;
              return (
                <button
                  key={key}
                  onClick={() => set(key, !on)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors"
                  style={{
                    background: on ? color + '18' : '#111',
                    border: `1px solid ${on ? color + '55' : '#222'}`,
                    opacity: tdxIsSet ? 1 : 0.45,
                    cursor: tdxIsSet ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!tdxIsSet}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: on ? color : '#333' }}
                  />
                  <span className="text-[9px] truncate" style={{ color: on ? '#F0F0F0' : '#666' }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          {!tdxIsSet && (
            <div className="text-[8px] mt-2" style={{ color: '#444' }}>
              填入 TDX Client ID &amp; Secret 後即可啟用
            </div>
          )}
        </div>

        {/* ── 地籍查詢 API 狀態 ── */}
        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: '14px' }}>
          <div className="text-[9px] font-bold mb-2" style={{ color: '#555', letterSpacing: '0.08em' }}>
            內建 API（免申請）
          </div>
          <div
            className="text-[9px] px-2 py-2 rounded leading-relaxed"
            style={{ background: 'rgba(33,150,243,0.06)', border: '1px solid rgba(33,150,243,0.15)' }}
          >
            <span style={{ color: '#C0C0C0' }}>地籍查詢 (TownVillagePointQuery)</span><br />
            <span style={{ color: '#4CAF50' }}>✓ 已接入 · 點選地圖即查詢</span><br />
            <span className="font-mono" style={{ color: '#444' }}>api.nlsc.gov.tw</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1E1E1E' }}>
        <button
          onClick={handleSave}
          className="w-full py-2 rounded text-[11px] font-bold transition-colors"
          style={{ background: saved ? '#2d6330' : '#E05A2B', color: '#fff' }}
        >
          {saved ? '✓ 已儲存' : '儲存金鑰'}
        </button>
      </div>
    </div>
  );
};
