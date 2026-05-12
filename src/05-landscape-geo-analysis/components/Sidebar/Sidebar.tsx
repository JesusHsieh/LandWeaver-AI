import React, { useState } from 'react';
import { MapSettings, MicroClimateData } from '../../types';
import { Divider } from './ui/Divider';
import { LayersBlock } from './blocks/LayersBlock';
import { AnalysisBlock } from './blocks/AnalysisBlock';
import { RegulatoryBlock } from './blocks/RegulatoryBlock';
import { TransportBlock } from './blocks/TransportBlock';
import { DecisionBlock } from './blocks/DecisionBlock';
import { SettingsPanel } from './SettingsPanel';

interface SidebarProps {
  settings: MapSettings;
  setSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  microData: MicroClimateData | null;
}

// WMS ImageryLayer 疊加圖層（在 Google 3D mesh 下面，需切 OSM 2D）
// 08G/08H 改用 OSM Entity 渲染（直接疊在 Google 3D 上，不需切換）
// 單向輔助切換：開啟 WMS 圖層時自動切 OSM 2D；關閉時不強制還原，讓使用者自行決定底圖
const OVERLAY_KEYS: (keyof MapSettings)[] = [
  'showUrbanPlan', 'showLiquefaction', 'showDebrisFlow', 'showActiveFault',
  'showFloodPotential', 'showSlopeSensitive',
  'showNlscLandSect', 'showNlscContour', 'showNlscHillShade', 'showNlscAdminBound',
];

export const Sidebar: React.FC<SidebarProps> = ({ settings, setSettings, microData }) => {
  const [showSettings, setShowSettings] = useState(false);

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
        <LayersBlock settings={settings} set={set} />

        <Divider />

        {/* ━━━ BLOCK 2 : 分析工具 ━━━ */}
        <AnalysisBlock settings={settings} set={set} />

        <Divider />

        {/* ━━━ BLOCK 3 : 地政法規查詢 ━━━ */}
        <RegulatoryBlock settings={settings} set={set} />

        <Divider />

        {/* ━━━ BLOCK 4 : 交通區位 + 流動層 ━━━ */}
        <TransportBlock settings={settings} set={set} onOpenSettings={() => setShowSettings(true)} />

        <Divider />

        {/* ━━━ BLOCK 5 : 景觀決策層 ━━━ */}
        <DecisionBlock settings={settings} set={set} />

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
