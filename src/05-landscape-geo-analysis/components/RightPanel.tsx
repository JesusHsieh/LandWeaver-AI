import React, { useState, useEffect } from 'react';
import { MapSettings, MicroClimateData, LandscapeDesignData } from '../types';
import { GISService } from '../services/gisService';
import { Wind, Droplets, Thermometer, Wind as AirIcon, Sliders, Sun, Globe, TreePine, AlertTriangle, Lightbulb, Waves, Shovel, Flame } from 'lucide-react';

interface RightPanelProps {
  settings: MapSettings;
}

const MetricTile = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-[#121416] p-3 border border-elegant-border rounded-lg flex flex-col gap-2">
    <div className="flex items-center gap-2 text-elegant-text-secondary text-[9px] uppercase tracking-wider">
      {icon} {label}
    </div>
    <div className="text-[12px] font-mono text-white">{value}</div>
  </div>
);

const DataPoint = ({ label, value, last = false }: { label: string, value: string, last?: boolean }) => (
  <div className={`flex justify-between items-center py-1 ${!last ? 'border-b border-white/5' : ''}`}>
    <span className="text-[11px] text-elegant-text-secondary">{label}</span>
    <span className="text-[12px] font-mono text-elegant-accent text-right">{value}</span>
  </div>
);

export const RightPanel: React.FC<RightPanelProps> = ({ settings }) => {
  const [data, setData] = useState<MicroClimateData | null>(null);
  const [landscapeData, setLandscapeData] = useState<LandscapeDesignData | null>(null);

  useEffect(() => {
    if (settings.analysisPoint) {
      const fetchData = async () => {
        const microResult = await GISService.getMicroClimateData(
          settings.analysisPoint!.lat, 
          settings.analysisPoint!.lng, 
          settings.currentTime
        );
        setData(microResult);
        
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

  const getWindDirectionText = (deg: number) => {
    const directions = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div className="w-[320px] h-full bg-elegant-surface border-l border-elegant-border flex flex-col z-10 p-5 overflow-y-auto custom-scrollbar shadow-2xl">
      
      {/* 太陽能與方位角分析 */}
      <div className="mb-8 p-4 bg-[#121416]/50 rounded-xl border border-white/5">
        <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
          <Sun className="w-3 h-3 text-elegant-accent" /> 日照分析系統
        </h2>
        
        {/* Chart */}
        <div className="w-full h-[80px] bg-[#121416] rounded-lg mb-4 p-3 flex items-end gap-1.5 border border-elegant-border">
          {data ? data.monthlyIrradiance.map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-elegant-accent opacity-60 rounded-t-[1px] transition-all hover:opacity-100" 
              style={{ height: `${h}%` }} 
            />
          )) : Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-t-[1px]" style={{ height: '20%' }} />
          ))}
        </div>

        <div className="space-y-2 mb-4">
          <DataPoint label="當前日照覆蓋" value={data ? `${(100 - data.shadowCoverage).toFixed(1)}%` : '--'} />
          <DataPoint label="日照峰值時數" value={data ? `${data.peakSunHours.toFixed(1)} h/d` : '--'} />
          <DataPoint label="年度預估輻射" value={data ? `${data.annualIrradiance.toFixed(0)} kWh/m²` : '--'} />
        </div>

        {/* Seasonal Sun Overlay */}
        {landscapeData && (
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <div className="text-[8px] text-elegant-text-secondary">夏至遮蔭</div>
              <div className="text-[11px] font-mono text-white">{landscapeData.seasonalSun.summerSolstice.toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-elegant-text-secondary">冬至遮蔭</div>
              <div className="text-[11px] font-mono text-white">{landscapeData.seasonalSun.winterSolstice.toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-elegant-text-secondary">春秋分</div>
              <div className="text-[11px] font-mono text-white">{landscapeData.seasonalSun.equinox.toFixed(0)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* 景觀設計分區 (Zoning) */}
      {settings.showZoning && landscapeData && (
        <div className="mb-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-yellow-500" /> 微氣候空間分區 (Zoning)
          </h2>
          <div className="bg-elegant-accent/5 border border-elegant-accent/30 rounded-lg p-4 mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-elegant-text-secondary uppercase">分區環境類型</span>
              <span className="text-[13px] text-elegant-accent font-bold">{landscapeData.zoning.category}</span>
            </div>
            <div className="text-[10px] text-elegant-text-secondary mb-3">特徵強度: {(landscapeData.zoning.intensity * 10).toFixed(1)} / 10</div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-elegant-accent transition-all duration-1000" style={{ width: `${landscapeData.zoning.intensity * 100}%` }} />
            </div>
          </div>
          <div className="p-3 bg-elegant-surface border border-elegant-border rounded-lg text-[11px] text-elegant-text-secondary leading-relaxed italic">
            「{landscapeData.recommendations.designSuggestions[0]}」
          </div>
        </div>
      )}

      {/* 土壤滲透分析 (Soil Analysis) */}
      {settings.showSoilAnalysis && landscapeData && (
        <div className="mb-8">
           <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <Shovel className="w-3 h-3 text-cyan-400" /> 土壤滲透與排水分析
          </h2>
          <div className="bg-[#121416] p-4 border border-elegant-border rounded-lg">
            <div className="space-y-2">
              <DataPoint label="土壤滲透率" value={`${landscapeData.soil.infiltrationRate.toFixed(1)} mm/hr`} />
              <DataPoint label="排水速度" value={landscapeData.soil.drainageSpeed} />
              <DataPoint label="積水風險評估" value={landscapeData.soil.waterloggingRisk} last />
            </div>
          </div>
        </div>
      )}

      {/* 集水區與水文 (Hydrology) */}
      {settings.showHydrology && landscapeData && (
        <div className="mb-8">
           <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <Waves className="w-3 h-3 text-blue-400" /> 集水區與雨水流向
          </h2>
          <div className="bg-[#121416] p-4 border border-elegant-border rounded-lg">
            <div className="space-y-2">
              <DataPoint label="主集水範圍" value={`${landscapeData.hydrology.catchmentArea.toFixed(1)} m²`} />
              <DataPoint label="暴雨積水深度" value={`${landscapeData.hydrology.pondingDepth.toFixed(0)} mm`} />
              <DataPoint label="地表排除方位" value={`${landscapeData.hydrology.flowDirection.toFixed(0)}°`} last />
            </div>
          </div>
        </div>
      )}

      {/* 都市環境干擾 (Urban Stress) */}
      {settings.showUrbanStress && landscapeData && (
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <Flame className="w-3 h-3 text-red-500" /> 都市環境干擾 (Urban Stress)
          </h2>
          <div className="bg-[#121416] p-4 border border-elegant-border rounded-lg space-y-3">
             <div className="flex justify-between items-center text-[11px]">
               <span className="text-elegant-text-secondary">地表材質熱指數 (Heat Index)</span>
               <span className="text-white font-mono">{(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)}%</span>
             </div>
             <div className="flex justify-between items-center text-[11px]">
               <span className="text-elegant-text-secondary">地表反照率 (Albedo)</span>
               <span className="text-white font-mono">{landscapeData.urbanStress.albedo.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center text-[11px]">
               <span className="text-elegant-text-secondary">推估表面溫度</span>
               <span className="text-red-400 font-mono">{landscapeData.urbanStress.surfaceTemp.toFixed(1)}°C</span>
             </div>
             <div className="pt-2 border-t border-white/5 space-y-1">
                <div className={`text-[10px] flex items-center gap-1 ${landscapeData.urbanStress.canyonEffect ? 'text-red-400' : 'text-green-400'}`}>
                   {landscapeData.urbanStress.canyonEffect ? '⚠️ 偵測到明顯街谷風效應' : '✅ 街道風場流動順暢'}
                </div>
                <div className={`text-[10px] flex items-center gap-1 ${landscapeData.urbanStress.downdraftRisk ? 'text-red-400' : 'text-blue-400'}`}>
                   {landscapeData.urbanStress.downdraftRisk ? '⚠️ 存在高壓風切 (Downdraft) 風險' : '✅ 垂直風量穩定'}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* AI 景觀設計師 (AI Designer Decision Layer) */}
      {settings.showPlantMatching && landscapeData && (
        <div className="mb-8 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-inner animate-in fade-in zoom-in duration-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[13px] font-bold tracking-[1px] text-white flex items-center gap-2">
              <span className="p-1 bg-emerald-500 rounded-md shadow-lg shadow-emerald-500/20">
                <Globe className="w-3.5 h-3.5 text-white" />
              </span>
              AI 景觀設計師
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono border border-emerald-500/30">
              DECISION ENGINE v2.0
            </span>
          </div>
          
          {/* Environmental Traits */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="text-[8px] text-elegant-text-secondary mb-1">日照</div>
              <div className={`text-[12px] font-bold ${landscapeData.aiSummary.traits.sun === '高' ? 'text-orange-400' : 'text-blue-400'}`}>
                {landscapeData.aiSummary.traits.sun}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="text-[8px] text-elegant-text-secondary mb-1">溫度</div>
              <div className={`text-[12px] font-bold ${landscapeData.aiSummary.traits.temp === '高' ? 'text-red-400' : 'text-blue-400'}`}>
                {landscapeData.aiSummary.traits.temp}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="text-[8px] text-elegant-text-secondary mb-1">風場</div>
              <div className={`text-[12px] font-bold ${landscapeData.aiSummary.traits.wind === '高' ? 'text-cyan-400' : 'text-green-400'}`}>
                {landscapeData.aiSummary.traits.wind}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
              <div className="text-[8px] text-elegant-text-secondary mb-1">濕度</div>
              <div className={`text-[12px] font-bold ${landscapeData.aiSummary.traits.water === '高' ? 'text-blue-400' : 'text-yellow-400'}`}>
                {landscapeData.aiSummary.traits.water}
              </div>
            </div>
          </div>

          {/* Categorized Recommendations */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="text-[10px] text-elegant-text-secondary font-bold mb-2 flex items-center gap-1">
                <TreePine className="w-3 h-3 text-emerald-400" /> 建議喬木 (Trees)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {landscapeData.recommendations.topPlants.filter(p => p.type === '喬木').slice(0, 3).map(p => (
                  <span key={p.id} className="px-2 py-1 bg-white/5 rounded text-[11px] text-white border border-white/10 hover:border-emerald-500/50 transition-colors">
                    {p.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-elegant-text-secondary font-bold mb-2 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-emerald-400" /> 建議灌木 (Shrubs)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {landscapeData.recommendations.topPlants.filter(p => p.type === '灌木').slice(0, 3).map(p => (
                  <span key={p.id} className="px-2 py-1 bg-white/5 rounded text-[11px] text-white border border-white/10">
                    {p.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-elegant-text-secondary font-bold mb-2 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-emerald-400" /> 地被植物 (Groundcover)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {landscapeData.recommendations.topPlants.filter(p => p.type === '地被').slice(0, 3).map(p => (
                  <span key={p.id} className="px-2 py-1 bg-white/5 rounded text-[11px] text-white border border-white/10">
                    {p.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Avoid Section */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
            <div className="text-[10px] text-red-400 font-black tracking-widest uppercase flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ 絕對避免種植 (REJECT)
            </div>
            {landscapeData.recommendations.avoidPlants.map((a, i) => (
              <div key={i} className="flex justify-between items-start text-[11px] leading-tight">
                <span className="text-white font-medium">{a.name}</span>
                <span className="text-red-400/80 text-[10px] italic">({a.reason})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 微氣候數據 */}
      {settings.showMicroClimate && (
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <AirIcon className="w-3 h-3 text-elegant-accent" /> 即時微氣候 (GIS API)
          </h2>
          <div className="grid grid-cols-2 gap-3">
             <MetricTile icon={<Wind className="w-4 h-4" />} label="風速/方向" value={data ? `${data.windSpeed.toFixed(1)}m/s ${getWindDirectionText(data.windDirection)}` : '--'} />
             <MetricTile icon={<Droplets className="w-4 h-4" />} label="雨量 (即時)" value={data ? `${data.rainfall.toFixed(1)}mm` : '--'} />
             <MetricTile icon={<Thermometer className="w-4 h-4" />} label="環境當前溫" value={data ? `${data.temp.toFixed(1)}°C` : '--'} />
             <MetricTile icon={<AirIcon className="w-4 h-4" />} label="PM2.5 / AQI" value={data ? `${data.pm25.toFixed(0)} / ${data.aqi.toFixed(0)}` : '--'} />
          </div>
        </div>
      )}

      {/* 地貌與淨流量 */}
      {settings.showSlopeAnalysis && (
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-elegant-text-secondary mb-4 flex items-center gap-2">
            <Sliders className="w-3 h-3 text-elegant-accent" /> 地貌坡度分析 (Slope)
          </h2>
          <div className="space-y-3 bg-[#121416] p-4 border border-elegant-border rounded-lg">
             <DataPoint label="區域最大坡度" value={data ? `${data.slopePct.toFixed(1)}%` : '--'} />
             <DataPoint label="地表排水係數 (C)" value={data ? data.drainageCoeff.toFixed(2) : '--'} />
             <DataPoint label="地面高程 (DEM)" value={data ? `${data.elevation.toFixed(1)} m` : '--'} />
             <DataPoint label="坡向 (Aspect)" value={data ? `${data.aspectDir} (${data.aspectDeg.toFixed(0)}°)` : '--'} last />
          </div>
          {data && (
            <div className="mt-2 text-[10px] text-elegant-text-secondary/60 text-right">
              來源: {data._sources.elevation === 'openElevation' ? '✓ Open-Elevation API' : '⚠ 估算值'}
            </div>
          )}
        </div>
      )}

      {/* GIS 洞察 */}
      <div className="mt-auto p-4 bg-elegant-accent-glow border border-elegant-accent/30 rounded-lg text-[12px] leading-relaxed transition-all">
        <span className="text-elegant-accent font-bold uppercase text-[10px] flex items-center gap-1">
          <Globe className="w-3 h-3" /> 系統診斷報告:
        </span>
        <div className="mt-2 text-elegant-text-secondary text-[11px] space-y-1">
          {data && data.pm25 > 35 && <p>• 目前 PM2.5 超標 ({data.pm25.toFixed(0)} µg/m³)，建議選用含油質較少之耐汙染植栽。</p>}
          {data && data.aqi > 100 && <p>• AQI 指數偏高 ({data.aqi.toFixed(0)})，建議搭配抗汙染植栽降低空氣危害。</p>}
          {data && data._sources.weather === 'fallback' && <p>⚠ 氣象 API 未連線，顯示估算值。請確認 VITE_CWA_API_KEY。</p>}
          {landscapeData && landscapeData.soil.waterloggingRisk === '高' && <p>• 基地排水不良，若未改良土層，植栽死亡率預估將上升 40%。</p>}
          {landscapeData && landscapeData.urbanStress.surfaceTemp > 38 && <p>• 街道材質蓄熱嚴重，建議引入噴霧系統或牆面綠化以降溫。</p>}
          {!settings.analysisPoint && <p>• 請點選地圖地點以啟動景觀決策增加引擎。</p>}
        </div>
      </div>
    </div>
  );
};
