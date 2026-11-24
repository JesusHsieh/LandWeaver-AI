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
    <LayerRow label="植栽建議（規則篩選）"  active={settings.showPlantMatching} onClick={() => set('showPlantMatching', !settings.showPlantMatching)} accent="#4CAF50" />
    <LayerRow label="熱與風環境"            active={settings.showUrbanStress}   onClick={() => set('showUrbanStress', !settings.showUrbanStress)}   accent="#F44336" />
    <LayerRow label="地表排水（依坡度）"    active={settings.showSoilAnalysis}  onClick={() => set('showSoilAnalysis', !settings.showSoilAnalysis)}  accent="#795548" />
    <LayerRow label="地表逕流方向"          active={settings.showHydrology}     onClick={() => set('showHydrology', !settings.showHydrology)}        accent="#2196F3" />
    <div className="mt-1 mb-0.5" style={{ height: '1px', background: '#222' }} />
    <LayerRow
      label="場址規則檢核"
      sub="逐項判讀 · 可複製給 AI 分析"
      active={settings.showLandscapeStrategy}
      onClick={() => set('showLandscapeStrategy', !settings.showLandscapeStrategy)}
      accent="#BCFD49"
    />
  </Section>
);
