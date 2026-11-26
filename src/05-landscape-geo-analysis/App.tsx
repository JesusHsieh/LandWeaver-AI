import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { MapControl } from './components/MapControl';
import { INITIAL_SETTINGS, MapSettings, MicroClimateData, LandscapeDesignData } from './types';
import { GISService } from './services/gisService';
import type { LocateTarget } from './components/Sidebar/blocks/LocateBlock';
import { evaluateSiteRules } from './services/siteRules';
import { format } from 'date-fns';

function applySolarForTime(
  micro: MicroClimateData,
  lat: number,
  lng: number,
  time: Date,
): MicroClimateData {
  const sunPos = GISService.calculateSolarPosition(lat, lng, time);
  return {
    ...micro,
    solarAzimuth:  sunPos.azimuth,
    solarAltitude: sunPos.altitude,
  };
}

// 二十四節氣，由太陽黃經 0°（春分）起每 15° 一個
const SOLAR_TERMS = [
  '春分', '清明', '穀雨', '立夏', '小滿', '芒種', '夏至', '小暑', '大暑', '立秋', '處暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄',
];

/** 目前所在的節氣：以太陽視黃經判定（Meeus 低精度公式，誤差約 0.01°） */
function solarTerm(date: Date): string {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000.0
  const g = (357.528 + 0.9856003 * n) * Math.PI / 180;
  const lambda = 280.460 + 0.9856474 * n + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  return SOLAR_TERMS[Math.floor((((lambda % 360) + 360) % 360) / 15)];
}

export default function App() {
  const [settings, setSettings] = useState<MapSettings>(INITIAL_SETTINGS);
  const [microData, setMicroData] = useState<MicroClimateData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeDesignData | null>(null);
  const dataAbortRef = useRef<AbortController | null>(null);
  const dataGenerationRef = useRef(0);
  const currentTimeRef = useRef(settings.currentTime);

  useEffect(() => {
    currentTimeRef.current = settings.currentTime;
  }, [settings.currentTime]);

  // Effect 1：點選新基地 → 完整 API 呼叫（weather / EPA / PVGIS / elevation）
  // 不依賴 currentTime，避免時間軸拖動重打所有 API
  useEffect(() => {
    dataAbortRef.current?.abort();
    if (!settings.analysisPoint) {
      setMicroData(null);
      setLandscapeData(null);
      return;
    }

    const controller = new AbortController();
    dataAbortRef.current = controller;
    const myGeneration = ++dataGenerationRef.current;
    const { lat, lng } = settings.analysisPoint!;

    setMicroData(null);
    setLandscapeData(null);

    // 立即啟動分區、行政區與災害潛勢查詢（與氣象/日照並行，消除串接等待）
    GISService.prefetchSite(lat, lng);
    (async () => {
      try {
        const micro = await GISService.getMicroClimateData(
          lat, lng,
          settings.currentTime,
          controller.signal,
        );
        if (controller.signal.aborted || dataGenerationRef.current !== myGeneration) return;
        const currentMicro = applySolarForTime(micro, lat, lng, currentTimeRef.current);
        setMicroData(currentMicro);

        const land = await GISService.getLandscapeDecisionData(lat, lng, currentMicro);
        if (controller.signal.aborted || dataGenerationRef.current !== myGeneration) return;
        setLandscapeData(land);
      } catch (err) {
        if (controller.signal.aborted || dataGenerationRef.current !== myGeneration) return;
        console.warn('[GIS] 分析資料載入失敗:', err);
      }
    })();
    return () => { controller.abort(); };
  }, [settings.analysisPoint]); // ← 不含 currentTime，避免時間軸拖動重打 API

  // 場址規則檢核：本機逐項判讀（不呼叫 AI / API），可複製後自行交給 AI 分析
  const ruleChecks = useMemo(
    () => (settings.showLandscapeStrategy && microData && landscapeData
      ? evaluateSiteRules(microData, landscapeData)
      : null),
    [settings.showLandscapeStrategy, microData, landscapeData],
  );

  // Effect 2：時間軸改變 → 僅本地重算太陽方位（無 API 呼叫）
  useEffect(() => {
    if (!settings.analysisPoint) return;
    const { lat, lng } = settings.analysisPoint;
    setMicroData(prev => prev ? applySolarForTime(prev, lat, lng, settings.currentTime) : null);
  }, [settings.currentTime]);

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

  // 由地址 / 地標 / 座標搜尋定位：與點地圖相同，另外讓相機飛到適合的高度
  const handleLocate = ({ lat, lng, name, viewHeight }: LocateTarget) => {
    setSettings(prev => ({
      ...prev,
      selectedBase: { lat, lng, name, viewHeight },
      analysisPoint: { lat, lng },
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseInt(e.target.value);
    const d = new Date(settings.currentTime);
    d.setHours(hours);
    updateSetting('currentTime', d);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    if (!year || !month || !day) return;
    const d = new Date(settings.currentTime);
    d.setFullYear(year, month - 1, day);
    updateSetting('currentTime', d);
  };

  const dateValue = format(settings.currentTime, 'yyyy-MM-dd');
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

        {/* Right side — Status + Home */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#555' }}>系統連線中</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00FF90', boxShadow: '0 0 6px #00FF90' }} />
          </div>
          {/* Home button */}
          <a
            href="/"
            title="回主頁"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#888',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,90,43,0.12)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(224,90,43,0.35)';
              (e.currentTarget as HTMLAnchorElement).style.color = '#E05A2B';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.09)';
              (e.currentTarget as HTMLAnchorElement).style.color = '#888';
            }}
          >
            {/* Home SVG icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[9px] tracking-[0.15em] uppercase hidden md:block">主頁</span>
          </a>
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
        <Sidebar settings={settings} setSettings={setSettings} microData={microData} onLocate={handleLocate} />
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
        <RightPanel
          settings={settings}
          microData={microData}
          landscapeData={landscapeData}
          ruleChecks={ruleChecks}
        />
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
        <input
          type="date"
          aria-label="調整日照日期"
          value={dateValue}
          onChange={handleDateChange}
          className="font-mono text-[11px] shrink-0 px-2 py-1 rounded"
          style={{
            width: '132px',
            color: '#C8C8C8',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            colorScheme: 'dark',
          }}
        />
        <span className="text-[10px] font-mono shrink-0 hidden md:block" style={{ color: '#555' }}>
          {format(settings.currentTime, 'MM/dd')} · {solarTerm(settings.currentTime)}
        </span>
      </footer>

    </div>
  );
}
