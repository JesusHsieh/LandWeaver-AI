import React from 'react';
import { MapSettings } from '../../../types';
import { Section, LayerRow } from '../ui/SectionGroup';

interface AnalysisBlockProps {
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

export const AnalysisBlock: React.FC<AnalysisBlockProps> = ({ settings, set }) => (
  <Section label="▸ Analysis · 分析工具" defaultCollapsed>
    <LayerRow label="日照與陰影模擬"        active={settings.showShadows}       onClick={() => set('showShadows', !settings.showShadows)} />
    <LayerRow label="微氣候監測"            active={settings.showMicroClimate}  onClick={() => set('showMicroClimate', !settings.showMicroClimate)} />
    <LayerRow label="地形坡度分析"          active={settings.showSlopeAnalysis} onClick={() => set('showSlopeAnalysis', !settings.showSlopeAnalysis)} />

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
    <div className="text-[9px] mb-1 tracking-widest uppercase" style={{ color: '#555' }}>周邊環境圖層</div>
    <LayerRow
      label="OSM 綠地標記"
      sub="公園、林地、草地標籤 · 非衛星植生指數"
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
);
