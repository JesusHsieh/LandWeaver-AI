import React, { useState } from 'react';
import LandWeaverHeader from '../shared/LandWeaverHeader';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { MapControl } from './components/MapControl';
import { INITIAL_SETTINGS, MapSettings } from './types';
import { format } from 'date-fns';
import { Layers, Search, Sun, Plus, Minus, Globe } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);

  const updateSetting = (key: keyof MapSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLocationClick = (lat: number, lng: number) => {
    const name = `基地座標 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setSettings(prev => ({
      ...prev,
      selectedBase: { lat, lng, name },
      analysisPoint: { lat, lng }
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseInt(e.target.value);
    const newDate = new Date(settings.currentTime);
    newDate.setHours(hours);
    updateSetting('currentTime', newDate);
  };

  return (
    <div className="h-screen w-screen bg-elegant-bg text-elegant-text-primary overflow-hidden flex flex-col font-sans">

      {/* LandWeaver shared navigation header */}
      <LandWeaverHeader projectName="景觀地理分析 AI" projectEmoji="🌍" dark={true} />

      {/* Module-specific sub-header */}
      <header className="h-[50px] bg-elegant-surface border-b border-elegant-border flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-2 font-bold tracking-[1px] text-[15px]">
          LANDSCAPE <span className="text-elegant-accent">GEO ANALYSIS</span> AI
        </div>
        <div className="flex items-center gap-8 text-[13px]">
          <div className="hidden md:block">當前專案: <span className="text-elegant-text-secondary">Taipei_Xinyi_Dist_04</span></div>
          <div className="font-mono bg-black px-3 py-1 rounded border border-elegant-border text-[#00FF90]">
            北緯 {settings.selectedBase?.lat.toFixed(4)}°, 東經 {settings.selectedBase?.lng.toFixed(4)}°
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] text-elegant-accent font-medium hidden sm:block tracking-widest uppercase">系統連線中</div>
          <div className="w-2 h-2 rounded-full bg-[#00FF90] shadow-[0_0_8px_#00FF90]" />
        </div>
      </header>

      {/* Main Container: Sidebar | Map | RightPanel */}
      <div className="flex-grow flex overflow-hidden">
        <Sidebar settings={settings} setSettings={setSettings} />
        
        <main className="flex-grow relative bg-[#090A0B] overflow-hidden">
          {/* Grid Overlay */}
          <div className="absolute inset-0 elegant-grid-overlay pointer-events-none z-10" />
          
          <div id="cesium-container" className="w-full h-full relative z-0">
             <MapControl settings={settings} onLocationClick={handleLocationClick} />
          </div>

          {/* View Controls */}
          <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
            <button className="w-10 h-10 bg-elegant-surface border border-elegant-border rounded-full flex items-center justify-center hover:border-elegant-accent transition-colors"><Plus className="w-4 h-4" /></button>
            <button className="w-10 h-10 bg-elegant-surface border border-elegant-border rounded-full flex items-center justify-center hover:border-elegant-accent transition-colors"><Minus className="w-4 h-4" /></button>
            <button className="w-10 h-10 bg-elegant-surface border border-elegant-border rounded-full flex items-center justify-center text-[10px] uppercase font-bold text-elegant-accent hover:border-white transition-colors">3D</button>
          </div>
        </main>

        <RightPanel settings={settings} />
      </div>

      {/* Footer / Toolbar */}
      <footer className="h-[80px] bg-elegant-surface border-t border-elegant-border flex items-center px-10 gap-10 shrink-0 z-20">
        <div className="text-[11px] uppercase tracking-[1px] text-elegant-text-secondary whitespace-nowrap">
          日照模擬時間
        </div>
        <div className="flex-grow flex items-center gap-5">
           <div className="font-mono text-[14px] text-elegant-text-primary">06:00</div>
           <div className="flex-grow relative h-1 bg-[#333] rounded-full">
             <input 
               type="range" 
               min="6" 
               max="18" 
               value={settings.currentTime.getHours()} 
               onChange={handleTimeChange}
               className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
             />
             <div 
               className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-elegant-accent rounded-full shadow-[0_0_10px_#3498DB] transition-all"
               style={{ left: `${((settings.currentTime.getHours() - 6) / 12) * 100}%` }}
             />
           </div>
           <div className="font-mono text-[14px] text-elegant-accent">
             {format(settings.currentTime, 'HH:mm')}
           </div>
           <div className="font-mono text-[14px] text-elegant-text-primary px-4 border-l border-elegant-border">18:00</div>
        </div>
        <div className="flex items-center gap-8 font-mono text-[14px]">
           <span className="text-elegant-text-primary uppercase">{format(settings.currentTime, 'MM月dd日')}</span>
           <span className="text-elegant-accent uppercase">6月21日 (夏至)</span>
        </div>
      </footer>
    </div>
  );
}

