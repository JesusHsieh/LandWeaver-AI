import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { MapControl } from './components/MapControl';
import { INITIAL_SETTINGS, MapSettings, MicroClimateData, LandscapeDesignData } from './types';
import { GISService } from './services/gisService';
import { format } from 'date-fns';

export default function App() {
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);
  const [microData, setMicroData] = useState<MicroClimateData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeDesignData | null>(null);

  // Effect 1：點選新基地 → 完整 API 呼叫（weather / EPA / PVGIS / elevation）
  // 不依賴 currentTime，避免時間軸拖動重打所有 API
  useEffect(() => {
    if (!settings.analysisPoint) return;
    let cancelled = false;
    (async () => {
      const micro = await GISService.getMicroClimateData(
        settings.analysisPoint!.lat,
        settings.analysisPoint!.lng,
        settings.currentTime,
      );
      if (cancelled) return;
      setMicroData(micro);
      const land = await GISService.getLandscapeDecisionData(
        settings.analysisPoint!.lat,
        settings.analysisPoint!.lng,
        micro,
      );
      if (cancelled) return;
      setLandscapeData(land);
    })();
    return () => { cancelled = true; };
  }, [settings.analysisPoint]); // ← 不含 currentTime，避免時間軸拖動重打 API

  // Effect 2：時間軸改變 → 僅本地重算太陽方位（無 API 呼叫）
  useEffect(() => {
    if (!settings.analysisPoint || !microData) return;
    const sunPos = GISService.calculateSolarPosition(
      settings.analysisPoint.lat,
      settings.analysisPoint.lng,
      settings.currentTime,
    );
    const shadowCoverage = Math.max(0, Math.min(100, 90 - sunPos.altitude * 1.8));
    setMicroData(prev => prev ? {
      ...prev,
      solarAzimuth:  sunPos.azimuth,
      solarAltitude: sunPos.altitude,
      shadowCoverage,
    } : null);
  }, [settings.currentTime, settings.analysisPoint]);

  const updateSetting = (key: keyof MapSettings, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLocationClick = (lat: number, lng: number) => {
    setSettings(prev => ({
      ...prev,
      selectedBase: { lat, lng, name: `基地座標 (${lat.toFixed(4)}, ${lng.toFixed(4)})` },
      analysisPoint: { lat, lng },
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseInt(e.target.value);
    const d = new Date(settings.currentTime);
    d.setHours(hours);
    updateSetting('currentTime', d);
  };

  const sliderPct = ((settings.currentTime.getHours() - 6) / 12) * 100;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: '#0C0C0C' }}>

      {/* ══════════════════════════════════════
          Full-screen map — z-0
      ══════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        <MapControl settings={settings} onLocationClick={handleLocationClick} landscapeData={landscapeData} />
      </div>

      {/* ══════════════════════════════════════
          Top bar — floating
      ══════════════════════════════════════ */}
      <header
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 h-11"
        style={{
          background: 'rgba(14,14,14,0.80)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: '#E05A2B' }}>
            LandWeaver
          </span>
          <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: '#555' }}>
            / GEO ANALYSIS AI
          </span>
        </div>

        {/* Coords */}
        <div
          className="hidden md:flex items-center gap-1.5 font-mono text-[10px] px-3 py-1 rounded"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#00FF90', border: '1px solid rgba(0,255,144,0.15)' }}
        >
          {settings.selectedBase
            ? `${settings.selectedBase.lat.toFixed(4)}°N · ${settings.selectedBase.lng.toFixed(4)}°E`
            : 'DRAG · ROTATE · ZOOM'}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#555' }}>系統連線中</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00FF90', boxShadow: '0 0 6px #00FF90' }} />
        </div>
      </header>

      {/* ══════════════════════════════════════
          Left panel — 選項欄 (floating)
      ══════════════════════════════════════ */}
      <div
        className="absolute z-20 overflow-hidden"
        style={{
          top: '52px',
          left: '12px',
          bottom: '64px',
          width: '220px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <Sidebar settings={settings} setSettings={setSettings} microData={microData} />
      </div>

      {/* ══════════════════════════════════════
          Right panel — 資訊欄 (floating)
      ══════════════════════════════════════ */}
      <div
        className="absolute z-20 overflow-hidden"
        style={{
          top: '52px',
          right: '12px',
          bottom: '64px',
          width: '260px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <RightPanel settings={settings} microData={microData} landscapeData={landscapeData} />
      </div>

      {/* ══════════════════════════════════════
          Bottom bar — 日照時間 (floating)
      ══════════════════════════════════════ */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-5 px-6 h-14"
        style={{
          background: 'rgba(14,14,14,0.85)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase shrink-0" style={{ color: '#555' }}>
          Solar Time
        </span>
        <span className="font-mono text-[11px] shrink-0" style={{ color: '#888' }}>06:00</span>

        {/* Slider track */}
        <div className="flex-1 relative h-px" style={{ background: '#2A2A2A' }}>
          {/* Fill */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{ width: `${sliderPct}%`, background: '#E05A2B', transition: 'width 0.1s' }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
            style={{
              left: `${sliderPct}%`,
              transform: 'translate(-50%, -50%)',
              background: '#E05A2B',
              borderColor: '#E05A2B',
              boxShadow: '0 0 8px rgba(224,90,43,0.6)',
            }}
          />
          <input
            type="range"
            min="6" max="18"
            value={settings.currentTime.getHours()}
            onChange={handleTimeChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ height: '20px', top: '-10px' }}
          />
        </div>

        <span className="font-mono text-[11px] shrink-0" style={{ color: '#888' }}>18:00</span>
        <span
          className="font-mono text-[13px] font-bold shrink-0 px-3 py-0.5 rounded"
          style={{ color: '#E05A2B', background: 'rgba(224,90,43,0.1)', border: '1px solid rgba(224,90,43,0.25)' }}
        >
          {format(settings.currentTime, 'HH:mm')}
        </span>
        <span className="text-[10px] font-mono shrink-0 hidden md:block" style={{ color: '#555' }}>
          {format(settings.currentTime, 'MM/dd')} · {
            ['冬至','冬至','春分','春分','春分','夏至','夏至','夏至','秋分','秋分','秋分','冬至']
            [settings.currentTime.getMonth()]
          }
        </span>
      </footer>

    </div>
  );
}
