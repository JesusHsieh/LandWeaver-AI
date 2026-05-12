import React from 'react';
import { MapSettings } from '../../../types';
import { Section, LayerRow } from '../ui/SectionGroup';

interface RegulatoryBlockProps {
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

export const RegulatoryBlock: React.FC<RegulatoryBlockProps> = ({ settings, set }) => (
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
      sub="水利署 WRA · 114nfp 裸地/深度"
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
);
