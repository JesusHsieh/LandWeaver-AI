import React from 'react';
import { MapSettings } from '../../../types';
import { Section, LayerRow } from '../ui/SectionGroup';

interface DecisionBlockProps {
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

export const DecisionBlock: React.FC<DecisionBlockProps> = ({ settings, set }) => (
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
);
