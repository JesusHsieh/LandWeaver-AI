import React from 'react';
import { MapSettings } from '../../../types';
import { Section, LayerRow } from '../ui/SectionGroup';

interface TransportBlockProps {
  settings: MapSettings;
  set: (key: keyof MapSettings, value: unknown) => void;
  onOpenSettings: () => void;
}

export const TransportBlock: React.FC<TransportBlockProps> = ({ settings, set, onOpenSettings }) => (
  <Section label="▸ Transport · 交通區位" labelColor="#FF6F00" defaultCollapsed>

    {/* ── 道路分級 + 生活機能 ── */}
    <div className="text-[8px] font-bold mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>道路 · 生活機能</div>

    <LayerRow
      label="道路分級"
      sub="主幹道 / 次幹道 / 地方道 · 壓力標籤"
      active={settings.showRoadLayer}
      onClick={() => set('showRoadLayer', !settings.showRoadLayer)}
      accent="#FF7043"
    />
    {settings.showRoadLayer && (
      <div className="mt-1 mb-2 px-1 flex flex-wrap gap-x-3 gap-y-1">
        {[
          { color: '#E53935', label: '快速道路' },
          { color: '#FF7043', label: '主幹道' },
          { color: '#FFA726', label: '次幹道' },
          { color: '#FFD54F', label: '地方道' },
          { color: '#78909C', label: '住宅路' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[9px]" style={{ color: '#888' }}>
            <span style={{ display: 'inline-block', width: 16, height: 3, background: color, borderRadius: 2 }} />
            {label}
          </span>
        ))}
      </div>
    )}

    <LayerRow
      label="生活機能 POI"
      sub="學校 · 公園 · 市場 · 醫療 · 公車 · 公共設施"
      active={settings.showPoiLayer}
      onClick={() => set('showPoiLayer', !settings.showPoiLayer)}
      accent="#4FC3F7"
    />
    {settings.showPoiLayer && (
      <div className="mt-1 mb-1 px-1 flex flex-wrap gap-x-3 gap-y-1">
        {[
          { color: '#4FC3F7', label: '🎓 學校' },
          { color: '#81C784', label: '🌿 公園' },
          { color: '#FFB74D', label: '🛒 市場' },
          { color: '#F48FB1', label: '🏥 醫療' },
          { color: '#CE93D8', label: '🚌 公車' },
          { color: '#80CBC4', label: '🏛 公共' },
        ].map(({ color, label }) => (
          <span key={label} className="text-[9px]" style={{ color }}>{label}</span>
        ))}
      </div>
    )}
    {settings.showPoiLayer && (
      <div className="mb-2 text-[9px] px-1" style={{ color: '#444' }}>
        實心大點 = 500m 內 · 淡小點 = 500–600m · 統計標籤顯示於地圖
      </div>
    )}

    <div className="mt-2 mb-1" style={{ height: '1px', background: '#222' }} />

    {/* ── 大眾運輸動態 ── */}
    <div className="text-[8px] font-bold mt-1 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>大眾運輸動態</div>
    <div className="text-[9px] mb-2 px-1" style={{ color: '#555' }}>
      Cesium GroundPolylinePrimitive · 路線貼合地球表面
    </div>

    {/* ── 台北捷運 ── */}
    <div className="text-[8px] font-bold mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台北捷運 TRTC</div>
    <LayerRow label="路線 + 站點"
      sub="OSM subway way · 5 條線"
      active={settings.showMrtLayer}
      onClick={() => set('showMrtLayer', !settings.showMrtLayer)}
      accent="#E3002C" />

    {/* ── 台灣高鐵 ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台灣高鐵 THSR</div>
    <LayerRow label="路線 + 站點"
      sub="OSM highspeed way · 12 站"
      active={settings.showThsrLayer}
      onClick={() => set('showThsrLayer', !settings.showThsrLayer)}
      accent="#DC3232" />

    {/* ── 台鐵 TRA ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台鐵 TRA</div>
    <LayerRow label="路線 + 站點"
      sub="OSM rail way · 全島幹線"
      active={settings.showTRALayer}
      onClick={() => set('showTRALayer', !settings.showTRALayer)}
      accent="#3A7BD5" />

    {/* ── 桃園捷運 ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>桃園捷運 TYMC</div>
    <LayerRow label="路線 + 站點"
      sub="OSM · 機場線"
      active={settings.showTaoyuanMrtLayer}
      onClick={() => set('showTaoyuanMrtLayer', !settings.showTaoyuanMrtLayer)}
      accent="#8B5CF6" />

    {/* ── 台中捷運 ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>台中捷運 TMRT</div>
    <LayerRow label="路線 + 站點"
      sub="OSM · 綠線"
      active={settings.showTaichungMrtLayer}
      onClick={() => set('showTaichungMrtLayer', !settings.showTaichungMrtLayer)}
      accent="#22C55E" />

    {/* ── 高雄捷運 ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>高雄捷運 KRTC</div>
    <LayerRow label="路線 + 站點"
      sub="OSM · 紅線 + 橘線 + 輕軌"
      active={settings.showKaohsiungMrtLayer}
      onClick={() => set('showKaohsiungMrtLayer', !settings.showKaohsiungMrtLayer)}
      accent="#EF4444" />

    {/* ── 列車動態提示 ── */}
    <div
      className="mt-2 text-[9px] px-2 py-1.5 rounded flex items-center justify-between"
      style={{ background: 'rgba(255,111,0,0.06)', border: '1px solid rgba(255,111,0,0.15)' }}
    >
      <span style={{ color: '#666' }}>列車動態需 TDX API Key</span>
      <button
        onClick={onOpenSettings}
        className="text-[8px] px-1.5 py-0.5 rounded hover:opacity-80"
        style={{ background: 'rgba(255,111,0,0.2)', color: '#FF9800' }}
      >⚙ 設定 &amp; 開啟</button>
    </div>

    {/* ── YouBike ── */}
    <div className="text-[8px] font-bold mt-2 mb-1 px-0.5 tracking-widest" style={{ color: '#666' }}>YouBike 2.0</div>
    <LayerRow label="站點可借率"
      sub="data.taipei 即時 · 無需 Key"
      active={settings.showYouBikeLayer}
      onClick={() => set('showYouBikeLayer', !settings.showYouBikeLayer)}
      accent="#4CAF50" />

  </Section>
);
