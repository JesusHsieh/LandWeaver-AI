import React, { useState, useEffect } from 'react';
import {
  Layers,
  ChevronRight,
  Map as MapIcon,
  Tent,
  Navigation,
  Mountain
} from 'lucide-react';
import { MapSettings, LandscapeDesignData, MicroClimateData } from '../types';
import { GISService } from '../services/gisService';

interface SidebarProps {
  settings: MapSettings;
  setSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ settings, setSettings }) => {
  const [landscapeData, setLandscapeData] = useState<LandscapeDesignData | null>(null);
  const [microData, setMicroData] = useState<MicroClimateData | null>(null);

  const updateSetting = (key: keyof MapSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (settings.analysisPoint) {
      const fetchData = async () => {
        const microResult = await GISService.getMicroClimateData(
          settings.analysisPoint!.lat,
          settings.analysisPoint!.lng,
          settings.currentTime
        );
        setMicroData(microResult);
        const landscapeResult = await GISService.getLandscapeDecisionData(
          settings.analysisPoint!.lat,
          settings.analysisPoint!.lng,
          microResult
        );
        setLandscapeData(landscapeResult);
      };
      fetchData();
    }
  }, [settings.analysisPoint, settings.currentTime]);

  return (
    <div className="w-[280px] h-full bg-elegant-surface border-r border-elegant-border flex flex-col z-10 overflow-y-auto p-5">
      <div className="space-y-6">
        {/* Base Mapping Section */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4">基礎圖層</h2>
          <div className="space-y-2">
            <LayerItem 
              label="Google Earth 實景 3D" 
              active={settings.showGoogle3DTiles} 
              onClick={() => updateSetting('showGoogle3DTiles', !settings.showGoogle3DTiles)} 
            />
            <div className="pt-2 border-t border-elegant-border opacity-50"></div>
            <LayerItem 
              label="OSM 2D 平面地圖" 
              active={settings.showOsmImagery} 
              onClick={() => updateSetting('showOsmImagery', !settings.showOsmImagery)} 
            />
            <LayerItem 
              label="OSM 3D 建築模型" 
              active={settings.showOsmBuildings} 
              onClick={() => updateSetting('showOsmBuildings', !settings.showOsmBuildings)} 
            />
            <div className="pt-2 border-t border-elegant-border opacity-50"></div>
            <LayerItem 
              label="地貌起伏 (Terrain)" 
              active={settings.showTerrain} 
              onClick={() => updateSetting('showTerrain', !settings.showTerrain)} 
            />
          </div>
        </div>

        {/* Analysis Tools Section */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4">分析工具</h2>
          <div className="space-y-2">
            <LayerItem 
              label="日照與陰影模擬 (含方位角)" 
              active={settings.showShadows} 
              onClick={() => updateSetting('showShadows', !settings.showShadows)} 
            />
            <LayerItem 
              label="微氣候監測 (風力/雨量/PM2.5)" 
              active={settings.showMicroClimate} 
              onClick={() => updateSetting('showMicroClimate', !settings.showMicroClimate)} 
            />
            <LayerItem 
              label="地貌坡度與淨流量分析" 
              active={settings.showSlopeAnalysis} 
              onClick={() => updateSetting('showSlopeAnalysis', !settings.showSlopeAnalysis)} 
            />
          </div>
        </div>

        {/* NEW: Landscape Decision Layer Section */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4">景觀設計決策層</h2>
          <div className="space-y-2">
            <LayerItem 
              label="微氣候空間分區 (Zoning)" 
              active={settings.showZoning} 
              onClick={() => updateSetting('showZoning', !settings.showZoning)} 
            />
            <LayerItem 
              label="植栽適地適種評分 (Plant Matching)" 
              active={settings.showPlantMatching} 
              onClick={() => updateSetting('showPlantMatching', !settings.showPlantMatching)} 
            />
            <LayerItem 
              label="地表熱環境與都市干擾 (Urban Stress)" 
              active={settings.showUrbanStress} 
              onClick={() => updateSetting('showUrbanStress', !settings.showUrbanStress)} 
            />
            <LayerItem 
              label="土壤滲透與排水分析 (Soil)" 
              active={settings.showSoilAnalysis} 
              onClick={() => updateSetting('showSoilAnalysis', !settings.showSoilAnalysis)} 
            />
            <LayerItem 
              label="集水區與雨水流向 (Hydrology)" 
              active={settings.showHydrology} 
              onClick={() => updateSetting('showHydrology', !settings.showHydrology)} 
            />
          </div>
        </div>

        {/* Site Details Section */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4">當前基地資訊</h2>
          <div className="bg-[#121416] p-4 border border-elegant-border rounded space-y-3">
            <div className="flex items-start justify-between">
               <div className="flex flex-col">
                  <span className="text-elegant-accent font-bold text-xs">{settings.selectedBase?.name}</span>
                  <span className="text-[9px] text-elegant-text-secondary font-mono mt-1">
                    LAT: {settings.analysisPoint?.lat.toFixed(4)} / LNG: {settings.analysisPoint?.lng.toFixed(4)}
                  </span>
               </div>
               <ChevronRight className="w-3 h-3 text-elegant-text-secondary mt-1" />
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-start gap-2">
                <Navigation className="w-3 h-3 text-elegant-accent mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] text-elegant-text-secondary block">都市計畫分區</span>
                  <span className="text-[10px] text-white font-medium leading-tight">
                    {landscapeData?.landUseZone || '查詢中...'}
                  </span>
                  {landscapeData && (
                    <span className={`text-[9px] mt-0.5 block ${landscapeData._sources.zoning === 'nlscWfs' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {landscapeData._sources.zoning === 'nlscWfs' ? '✓ 國土測繪 WFS' : '⚠ 查詢失敗'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="w-3 h-3 text-elegant-text-secondary" />
                <span className="text-[10px] text-elegant-text-secondary">地面高程: </span>
                <span className="text-[10px] text-white font-mono">
                  {microData ? `${microData.elevation.toFixed(1)} m` : '--'}
                </span>
                {microData && (
                  <span className={`text-[9px] ${microData._sources.elevation === 'openElevation' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {microData._sources.elevation === 'openElevation' ? '✓' : '⚠'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Tent className="w-3 h-3 text-elegant-text-secondary" />
                <span className="text-[10px] text-elegant-text-secondary">坡度/坡向: </span>
                <span className="text-[10px] text-white font-mono">
                  {microData ? `${microData.slopePct.toFixed(1)}% · ${microData.aspectDir}` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayerItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
      active ? 'bg-elegant-accent-glow border-elegant-accent' : 'bg-[#121416] border-elegant-border hover:border-elegant-text-secondary'
    }`}
  >
    <span className={`text-[13px] ${active ? 'text-elegant-text-primary font-medium' : 'text-elegant-text-secondary'}`}>{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-elegant-accent' : 'bg-[#333]'}`}>
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-0.5' : 'left-0.5'}`} />
    </div>
  </button>
);

