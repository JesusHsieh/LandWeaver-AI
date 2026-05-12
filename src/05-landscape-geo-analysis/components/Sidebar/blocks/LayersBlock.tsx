import React from 'react';
import { MapSettings } from '../../../types';
import { Section, LayerRow } from '../ui/SectionGroup';

interface LayersBlockProps {
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
}

export const LayersBlock: React.FC<LayersBlockProps> = ({ settings, set }) => (
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
);
