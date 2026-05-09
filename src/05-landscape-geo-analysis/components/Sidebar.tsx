import React, { useState } from 'react';
import { MapSettings, MicroClimateData } from '../types';

interface SidebarProps {
  settings: MapSettings;
  setSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  microData: MicroClimateData | null;
}

/* ── Mini toggle switch ── */
const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`gis-toggle ${on ? 'on' : ''}`}
    aria-checked={on}
    role="switch"
  />
);

/* ── Compact layer row ── */
const LayerRow = ({
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
}) => (
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

/* ── Section block wrapper (collapsible) ── */
const Section = ({
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
  // strip leading "▸ " so we control the arrow ourselves
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

/* ── Flat button group ── */
const BtnGroup = ({
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

/* ── Thin divider ── */
const Divider = () => (
  <div style={{ height: '1px', background: '#222', margin: '4px 0' }} />
);

/* ── API Settings panel (overlays sidebar) ── */
const API_FIELDS = [
  {
    key: 'IMAGE_GEN_KEY',
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

interface SettingsPanelProps {
  onClose: () => void;
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

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

const SettingsPanel = ({ onClose, settings, set }: SettingsPanelProps) => {
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

export const Sidebar: React.FC<SidebarProps> = ({ settings, setSettings, microData }) => {
  const [showSettings, setShowSettings] = useState(false);

  // WMS ImageryLayer 疊加圖層（在 Google 3D mesh 下面，需切 OSM 2D）
  // 08G/08H 改用 OSM Entity 渲染（直接疊在 Google 3D 上，不需切換）
  // 單向輔助切換：開啟 WMS 圖層時自動切 OSM 2D；關閉時不強制還原，讓使用者自行決定底圖
  const OVERLAY_KEYS: (keyof MapSettings)[] = [
    'showUrbanPlan', 'showLiquefaction', 'showDebrisFlow', 'showActiveFault',
    'showFloodPotential', 'showSlopeSensitive',
    'showNlscLandSect', 'showNlscContour', 'showNlscHillShade', 'showNlscAdminBound',
  ];

  const set = (key: keyof MapSettings, value: unknown) =>
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (OVERLAY_KEYS.includes(key) && value === true && prev.showGoogle3DTiles) {
        // 開啟 WMS 圖層時，若目前是 Google 3D → 自動切換至 OSM 2D（WMS 需要 2D 底圖才可見）
        next.showGoogle3DTiles = false;
        next.showOsmImagery = true;
      }
      // 關閉圖層時不自動還原底圖，避免覆蓋使用者手動設定
      return next;
    });

  return (
    <aside
      className="h-full flex flex-col z-10 relative"
      style={{
        width: '220px',
        background: 'rgba(14,14,14,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Site Header ── */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #222' }}>
        <div className="text-[12px] font-bold leading-tight" style={{ color: '#F0F0F0' }}>
          {settings.selectedBase?.name ?? '景觀地理分析 AI'}
        </div>
        <div className="text-[9px] mt-0.5 font-mono" style={{ color: '#444' }}>
          {settings.analysisPoint
            ? `${settings.analysisPoint.lat.toFixed(4)}°N · ${settings.analysisPoint.lng.toFixed(4)}°E`
            : '點選地圖設定分析基地'}
        </div>
        {microData && (
          <div className="text-[10px] mt-1 font-mono" style={{ color: '#E05A2B' }}>
            {microData.elevation.toFixed(0)} m · {microData.slopePct.toFixed(1)}% · {microData.aspectDir}
          </div>
        )}
      </div>

      {/* ── Scrollable sections ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ━━━ BLOCK 1 : 基礎圖層 ━━━ */}
        <Section label="▸ Layers · 基礎圖層">
          {/* Google / OSM */}
          <LayerRow label="Google Earth 實景 3D"
            sub="Cesium Ion · 全球攝影測量"
            active={settings.showGoogle3DTiles}
            onClick={() => set('showGoogle3DTiles', !settings.showGoogle3DTiles)}
            accent="#4285F4" />
          <LayerRow label="OSM 2D 平面地圖"
            sub="openstreetmap.org"
            active={settings.showOsmImagery}
            onClick={() => set('showOsmImagery', !settings.showOsmImagery)}
            accent="#7EBC6F" />
          {/* 底圖主題 — 緊接在 OSM 2D 下方 */}
          <div className="flex gap-1 pl-4 mb-1 -mt-0.5">
            {(['OSM', 'DARK', 'LIGHT'] as const).map(t => (
              <button
                key={t}
                onClick={() => set('baseTheme', t)}
                className="text-[8px] px-1.5 py-0.5 rounded transition-opacity hover:opacity-90"
                style={{
                  background: settings.baseTheme === t ? '#3A3A3A' : '#1C1C1C',
                  color: settings.baseTheme === t ? '#F0F0F0' : '#555',
                  border: `1px solid ${settings.baseTheme === t ? '#555' : '#2A2A2A'}`,
                }}
              >{t}</button>
            ))}
          </div>
          <LayerRow label="OSM 3D 建築模型"
            sub="Ion 96188 · 需開啟地形才貼合"
            active={settings.showOsmBuildings}
            onClick={() => set('showOsmBuildings', !settings.showOsmBuildings)}
            accent={`hsl(${settings.osmBuildingHue},45%,62%)`} />
          {/* OSM 3D 色相 + 透明度滑桿 */}
          <div className="pl-4 pr-2 mb-1.5 -mt-0.5 space-y-1.5">
            {/* 色相 */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] w-5 shrink-0" style={{ color: '#555' }}>色</span>
              <div className="relative flex-1 h-3 rounded-full overflow-hidden" style={{
                background: 'linear-gradient(to right,hsl(0,55%,60%),hsl(30,55%,60%),hsl(60,55%,60%),hsl(120,55%,60%),hsl(180,55%,60%),hsl(240,55%,60%),hsl(300,55%,60%),hsl(360,55%,60%))'
              }}>
                <input
                  type="range" min={0} max={360} step={1}
                  value={settings.osmBuildingHue}
                  onChange={e => set('osmBuildingHue', +e.target.value)}
                  className="osm-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {/* thumb indicator */}
                <div className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none" style={{
                  left: `${(settings.osmBuildingHue / 360) * 100}%`,
                  background: '#fff',
                  boxShadow: '0 0 3px rgba(0,0,0,0.8)',
                }} />
              </div>
              <span className="text-[8px] w-6 text-right shrink-0 font-mono" style={{ color: '#555' }}>
                {settings.osmBuildingHue}°
              </span>
            </div>
            {/* 透明度 */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] w-5 shrink-0" style={{ color: '#555' }}>透</span>
              <div className="relative flex-1 h-3 rounded-full overflow-hidden" style={{
                background: `linear-gradient(to right, transparent, hsl(${settings.osmBuildingHue},55%,60%))`,
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0), hsl(${settings.osmBuildingHue},55%,60%)), repeating-linear-gradient(45deg,#2a2a2a 0px,#2a2a2a 4px,#1a1a1a 4px,#1a1a1a 8px)`,
              }}>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={settings.osmBuildingOpacity}
                  onChange={e => set('osmBuildingOpacity', +e.target.value)}
                  className="osm-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none" style={{
                  left: `${settings.osmBuildingOpacity * 100}%`,
                  background: '#fff',
                  boxShadow: '0 0 3px rgba(0,0,0,0.8)',
                }} />
              </div>
              <span className="text-[8px] w-6 text-right shrink-0 font-mono" style={{ color: '#555' }}>
                {Math.round(settings.osmBuildingOpacity * 100)}%
              </span>
            </div>
          </div>
          <LayerRow label="地貌起伏 Terrain"
            sub="Cesium World Terrain · SRTM-based"
            active={settings.showTerrain}
            onClick={() => set('showTerrain', !settings.showTerrain)}
            accent="#A0522D" />

          {/* NLSC 國土測繪 */}
          <div className="mt-2 mb-1" style={{ height: '1px', background: '#1E1E1E' }} />
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: '#4A8F5C' }}>
            國土測繪中心 NLSC
          </div>
          <LayerRow label="電子地圖 EMAP"
            sub="wmts.nlsc.gov.tw · 官方底圖"
            active={settings.showNlscEmap}
            onClick={() => set('showNlscEmap', !settings.showNlscEmap)}
            accent="#4A8F5C" />
          <LayerRow label="正射影像 PHOTO2"
            sub="wmts.nlsc.gov.tw · 航照圖"
            active={settings.showNlscPhoto}
            onClick={() => set('showNlscPhoto', !settings.showNlscPhoto)}
            accent="#2E7D32" />

          {/* 圖臺 API 額外圖層 */}
          <div className="mt-2 mb-1" style={{ height: '1px', background: '#1E1E1E' }} />
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: '#4A8F5C' }}>
            圖臺 API · 地籍 / 地形
          </div>
          <LayerRow label="地籍圖 LANDSECT"
            sub="wmts.nlsc.gov.tw · 地段範圍線"
            active={settings.showNlscLandSect}
            onClick={() => set('showNlscLandSect', !settings.showNlscLandSect)}
            accent="#FF9800" />
          <LayerRow label="等高線 CONTOUR"
            sub="MOI_CONTOUR · 10m 等高距"
            active={settings.showNlscContour}
            onClick={() => set('showNlscContour', !settings.showNlscContour)}
            accent="#795548" />
          <LayerRow label="山體陰影 HILLSHADE"
            sub="MOI_HILLSHADE · 地形分析"
            active={settings.showNlscHillShade}
            onClick={() => set('showNlscHillShade', !settings.showNlscHillShade)}
            accent="#607D8B" />
          <LayerRow label="鄉鎮市區界 TOWN"
            sub="wmts.nlsc.gov.tw · 行政區界"
            active={settings.showNlscAdminBound}
            onClick={() => set('showNlscAdminBound', !settings.showNlscAdminBound)}
            accent="#9C27B0" />

          {/* Terrain data source note */}
          <div
            className="mt-2 text-[9px] px-2 py-1.5 rounded leading-relaxed"
            style={{ background: 'rgba(255,152,0,0.06)', color: '#666', border: '1px solid rgba(255,152,0,0.12)' }}
          >
            ⚠ 地形資料非台灣官方來源<br />
            官方 DEM：NLSC LiDAR 1m/5m<br />
            尚未提供 CesiumJS TerrainProvider
          </div>
        </Section>

        <Divider />

        {/* ━━━ BLOCK 2 : 分析工具 ━━━ */}
        <Section label="▸ Analysis · 分析工具" defaultCollapsed>
          <LayerRow label="日照與陰影模擬"        active={settings.showShadows}       onClick={() => set('showShadows', !settings.showShadows)} />
          <LayerRow label="微氣候監測"            active={settings.showMicroClimate}  onClick={() => set('showMicroClimate', !settings.showMicroClimate)} />
          <LayerRow label="坡度與淨流量分析"      active={settings.showSlopeAnalysis} onClick={() => set('showSlopeAnalysis', !settings.showSlopeAnalysis)} />

          {/* Buffer 半徑圈 */}
          <div className="mt-2 mb-1">
            <div className="text-[9px] mb-1.5 tracking-widest uppercase" style={{ color: '#555' }}>Buffer 半徑圈</div>
            <div className="flex gap-1 flex-wrap">
              {([0, 100, 300, 500, 800] as const).map(r => (
                <button
                  key={r}
                  onClick={() => set('bufferRadius', r)}
                  className="text-[9px] px-2 py-0.5 rounded transition-all"
                  style={{
                    background: settings.bufferRadius === r ? 'rgba(224,90,43,0.25)' : 'rgba(255,255,255,0.04)',
                    color: settings.bufferRadius === r ? '#E05A2B' : '#666',
                    border: `1px solid ${settings.bufferRadius === r ? 'rgba(224,90,43,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {r === 0 ? 'Off' : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {/* 量測工具 */}
          <div className="mt-2 mb-0.5" style={{ height: '1px', background: '#222' }} />
          <LayerRow
            label="距離量測"
            sub={settings.showMeasureTool ? '點選兩點測量距離' : '兩點直線距離'}
            active={settings.showMeasureTool}
            onClick={() => set('showMeasureTool', !settings.showMeasureTool)}
            accent="#00BCD4"
          />
          <LayerRow
            label="高程剖面"
            sub={settings.showElevProfile ? '點選兩點取樣高程' : '兩點高程斷面圖'}
            active={settings.showElevProfile}
            onClick={() => set('showElevProfile', !settings.showElevProfile)}
            accent="#8BC34A"
          />

          {/* 概略分析圖層 */}
          <div className="mt-2 mb-0.5" style={{ height: '1px', background: '#222' }} />
          <div className="text-[9px] mb-1 tracking-widest uppercase" style={{ color: '#555' }}>概略環境圖層</div>
          <LayerRow
            label="不透水面概略"
            sub="以熱指數推估 · 僅供參考"
            active={settings.showImperviousLayer}
            onClick={() => set('showImperviousLayer', !settings.showImperviousLayer)}
            accent="#FF7043"
          />
          <LayerRow
            label="綠覆 / NDVI 概略"
            sub="OSM 公園森林節點"
            active={settings.showNdviLayer}
            onClick={() => set('showNdviLayer', !settings.showNdviLayer)}
            accent="#4CAF50"
          />
          <LayerRow
            label="建物密度熱區"
            sub="OSM 建物密度格網"
            active={settings.showBuildingDensity}
            onClick={() => set('showBuildingDensity', !settings.showBuildingDensity)}
            accent="#FF9800"
          />
          <LayerRow
            label="行道樹"
            sub="台北市官方 · 其他縣市 OSM"
            active={settings.showStreetTreeLayer}
            onClick={() => set('showStreetTreeLayer', !settings.showStreetTreeLayer)}
            accent="#76FF03"
          />
        </Section>

        <Divider />

        {/* ━━━ BLOCK 3 : 地政法規查詢 ━━━ */}
        <Section label="▸ Regulatory · 地政法規查詢" labelColor="#C8A84B" defaultCollapsed>
          {/* 說明列 */}
          <div
            className="text-[9px] px-2 py-1.5 rounded mb-2 leading-relaxed"
            style={{ background: 'rgba(200,168,75,0.08)', color: '#888', border: '1px solid rgba(200,168,75,0.15)' }}
          >
            開啟圖層將自動切換為 OSM 2D 底圖<br />
            <span style={{ color: '#4CAF50' }}>✓ 08A–F WMS · 08G/H OSM · 08I 查表</span>
          </div>

          <LayerRow
            label="08A · 都市計畫分區"
            sub="NLSC LUIMAP · wms.nlsc.gov.tw"
            active={settings.showUrbanPlan}
            onClick={() => set('showUrbanPlan', !settings.showUrbanPlan)}
            accent="#2196F3"
          />
          <LayerRow
            label="08B · 地盤液化潛勢"
            sub="地質調查及礦業管理中心 · 2021"
            active={settings.showLiquefaction}
            onClick={() => set('showLiquefaction', !settings.showLiquefaction)}
            accent="#FF9800"
          />
          <LayerRow
            label="08C · 崩塌地潛勢"
            sub="地質調查及礦業管理中心 · 2013"
            active={settings.showDebrisFlow}
            onClick={() => set('showDebrisFlow', !settings.showDebrisFlow)}
            accent="#FF5722"
          />
          <LayerRow
            label="08D · 活動斷層敏感區"
            sub="地質調查及礦業管理中心 CGS"
            active={settings.showActiveFault}
            onClick={() => set('showActiveFault', !settings.showActiveFault)}
            accent="#F44336"
          />
          <LayerRow
            label="08E · 淹水潛勢"
            sub="水利署 WRA · 114年裸地深度"
            active={settings.showFloodPotential}
            onClick={() => set('showFloodPotential', !settings.showFloodPotential)}
            accent="#03A9F4"
          />
          <LayerRow
            label="08F · 山崩地滑敏感區"
            sub="地質調查及礦業管理中心 CGS"
            active={settings.showSlopeSensitive}
            onClick={() => set('showSlopeSensitive', !settings.showSlopeSensitive)}
            accent="#8D6E63"
          />
          <LayerRow
            label="08G · 飲用水保護區"
            sub="OSM 水庫/水源地 · 點標記"
            active={settings.showDrinkingWater}
            onClick={() => set('showDrinkingWater', !settings.showDrinkingWater)}
            accent="#00BCD4"
          />
          <LayerRow
            label="08H · 文化資產"
            sub="OSM historic · 支援 Google 3D"
            active={settings.showCulturalHeritage}
            onClick={() => set('showCulturalHeritage', !settings.showCulturalHeritage)}
            accent="#9C27B0"
          />
          <LayerRow
            label="08I · 容積率 / 建蔽率"
            sub="依都市計畫分區查表 · 無需額外 API"
            active={settings.showZoningRegulation}
            onClick={() => set('showZoningRegulation', !settings.showZoningRegulation)}
            accent="#C8A84B"
          />
        </Section>

        <Divider />

        {/* ━━━ BLOCK 5 : 交通區位 + 流動層 ━━━ */}
        <Section label="▸ Transport · 交通區位" labelColor="#FF6F00" defaultCollapsed>

          {/* ── 道路分級 + 生活機能 ── */}
          <div className="text-[8px] font-bold mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>道路 · 生活機能</div>

          <LayerRow
            label="道路分級"
            sub="主幹道 / 次幹道 / 地方道 · 壓力標籤"
            active={settings.showRoadLayer}
            onClick={() => set('showRoadLayer', !settings.showRoadLayer)}
            accent="#FF7043"
          />
          {settings.showRoadLayer && (
            <div className="mt-1 mb-2 px-1 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: '#E53935', label: '快速道路' },
                { color: '#FF7043', label: '主幹道' },
                { color: '#FFA726', label: '次幹道' },
                { color: '#FFD54F', label: '地方道' },
                { color: '#78909C', label: '住宅路' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1 text-[9px]" style={{ color: '#888' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 3, background: color, borderRadius: 2 }} />
                  {label}
                </span>
              ))}
            </div>
          )}

          <LayerRow
            label="生活機能 POI"
            sub="學校 · 公園 · 市場 · 醫療 · 公車 · 公共設施"
            active={settings.showPoiLayer}
            onClick={() => set('showPoiLayer', !settings.showPoiLayer)}
            accent="#4FC3F7"
          />
          {settings.showPoiLayer && (
            <div className="mt-1 mb-1 px-1 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: '#4FC3F7', label: '🎓 學校' },
                { color: '#81C784', label: '🌿 公園' },
                { color: '#FFB74D', label: '🛒 市場' },
                { color: '#F48FB1', label: '🏥 醫療' },
                { color: '#CE93D8', label: '🚌 公車' },
                { color: '#80CBC4', label: '🏛 公共' },
              ].map(({ color, label }) => (
                <span key={label} className="text-[9px]" style={{ color }}>{label}</span>
              ))}
            </div>
          )}
          {settings.showPoiLayer && (
            <div className="mb-2 text-[9px] px-1" style={{ color: '#444' }}>
              實心大點 = 500m 內 · 淡小點 = 500–600m · 統計標籤顯示於地圖
            </div>
          )}

          <div className="mt-2 mb-1" style={{ height: '1px', background: '#222' }} />

          {/* ── 大眾運輸動態 ── */}
          <div className="text-[8px] font-bold mt-1 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>大眾運輸動態</div>
          <div className="text-[9px] mb-2 px-1" style={{ color: '#555' }}>
            Cesium GroundPolylinePrimitive · 路線貼合地球表面
          </div>

          {/* ── 台北捷運 ── */}
          <div className="text-[8px] font-bold mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台北捷運 TRTC</div>
          <LayerRow label="路線 + 站點"
            sub="OSM subway way · 5 條線"
            active={settings.showMrtLayer}
            onClick={() => set('showMrtLayer', !settings.showMrtLayer)}
            accent="#E3002C" />

          {/* ── 台灣高鐵 ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台灣高鐵 THSR</div>
          <LayerRow label="路線 + 站點"
            sub="OSM highspeed way · 12 站"
            active={settings.showThsrLayer}
            onClick={() => set('showThsrLayer', !settings.showThsrLayer)}
            accent="#DC3232" />

          {/* ── 台鐵 TRA ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台鐵 TRA</div>
          <LayerRow label="路線 + 站點"
            sub="OSM rail way · 全島幹線"
            active={settings.showTRALayer}
            onClick={() => set('showTRALayer', !settings.showTRALayer)}
            accent="#3A7BD5" />

          {/* ── 桃園捷運 ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>桃園捷運 TYMC</div>
          <LayerRow label="路線 + 站點"
            sub="OSM · 機場線"
            active={settings.showTaoyuanMrtLayer}
            onClick={() => set('showTaoyuanMrtLayer', !settings.showTaoyuanMrtLayer)}
            accent="#8B5CF6" />

          {/* ── 台中捷運 ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台中捷運 TMRT</div>
          <LayerRow label="路線 + 站點"
            sub="OSM · 綠線"
            active={settings.showTaichungMrtLayer}
            onClick={() => set('showTaichungMrtLayer', !settings.showTaichungMrtLayer)}
            accent="#22C55E" />

          {/* ── 高雄捷運 ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>高雄捷運 KRTC</div>
          <LayerRow label="路線 + 站點"
            sub="OSM · 紅線 + 橘線 + 輕軌"
            active={settings.showKaohsiungMrtLayer}
            onClick={() => set('showKaohsiungMrtLayer', !settings.showKaohsiungMrtLayer)}
            accent="#EF4444" />

          {/* ── 列車動態提示 ── */}
          <div
            className="mt-2 text-[9px] px-2 py-1.5 rounded flex items-center justify-between"
            style={{ background: 'rgba(255,111,0,0.06)', border: '1px solid rgba(255,111,0,0.15)' }}
          >
            <span style={{ color: '#666' }}>列車動態需 TDX API Key</span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[8px] px-1.5 py-0.5 rounded hover:opacity-80"
              style={{ background: 'rgba(255,111,0,0.2)', color: '#FF9800' }}
            >⚙ 設定 &amp; 開啟</button>
          </div>

          {/* ── YouBike ── */}
          <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>YouBike 2.0</div>
          <LayerRow label="站點可借率"
            sub="data.taipei 即時 · 無需 Key"
            active={settings.showYouBikeLayer}
            onClick={() => set('showYouBikeLayer', !settings.showYouBikeLayer)}
            accent="#4CAF50" />

        </Section>

        <Divider />

        {/* ━━━ BLOCK 5 : 景觀決策層 ━━━ */}
        <Section label="▸ Decision · 景觀決策層" defaultCollapsed>
          <LayerRow label="微氣候分區 Zoning"     active={settings.showZoning}        onClick={() => set('showZoning', !settings.showZoning)}        accent="#E05A2B" />
          <LayerRow label="植栽適地評分"          active={settings.showPlantMatching} onClick={() => set('showPlantMatching', !settings.showPlantMatching)} accent="#4CAF50" />
          <LayerRow label="都市干擾 Urban Stress" active={settings.showUrbanStress}   onClick={() => set('showUrbanStress', !settings.showUrbanStress)}   accent="#F44336" />
          <LayerRow label="土壤滲透 Soil"         active={settings.showSoilAnalysis}  onClick={() => set('showSoilAnalysis', !settings.showSoilAnalysis)}  accent="#795548" />
          <LayerRow label="集水水文 Hydrology"    active={settings.showHydrology}     onClick={() => set('showHydrology', !settings.showHydrology)}        accent="#2196F3" />
          <div className="mt-1 mb-0.5" style={{ height: '1px', background: '#222' }} />
          <LayerRow
            label="景觀／空間策略建議"
            sub="AI 綜合評估 · 需 Gemini API Key"
            active={settings.showLandscapeStrategy}
            onClick={() => set('showLandscapeStrategy', !settings.showLandscapeStrategy)}
            accent="#BCFD49"
          />
        </Section>

        <Divider />

      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 flex items-center justify-end" style={{ borderTop: '1px solid #222' }}>
        {/* Settings gear button */}
        <button
          onClick={() => setShowSettings(true)}
          title="API 金鑰設定"
          className="flex items-center justify-center w-7 h-7 rounded hover:opacity-80 transition-opacity shrink-0"
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#666' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* ── Settings overlay ── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} settings={settings} set={set} />}
    </aside>
  );
};
