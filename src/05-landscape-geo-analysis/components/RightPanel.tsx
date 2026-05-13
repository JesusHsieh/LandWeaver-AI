import React from 'react';
import { MapSettings, MicroClimateData, LandscapeDesignData } from '../types';
import { exportMd, exportTxt, exportPdf } from '../services/exportService';
import { StrategyResult } from '../services/strategyService';

interface RightPanelProps {
  settings: MapSettings;
  microData: MicroClimateData | null;
  landscapeData: LandscapeDesignData | null;
  strategyData: StrategyResult | null;
  strategyLoading: boolean;
  strategyError: string | null;
  onRetryStrategy: () => void;
}

/* ── Compact data row ── */
const DataRow = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div className="gis-data-row">
    <span className="gis-data-label">{label}</span>
    <span
      className="gis-data-value"
      style={valueColor ? { color: valueColor } : undefined}
    >
      {value}
    </span>
  </div>
);

/* ── Mini bar chart for monthly irradiance ── */
const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const IrradianceChart = ({ data }: { data: number[] }) => (
  <div className="flex items-end gap-[2px] w-full" style={{ height: '48px' }}>
    {data.map((h, i) => {
      const color = h > 70 ? '#E05A2B' : h > 40 ? '#C0592A' : h > 20 ? '#8A4020' : '#5A2A14';
      return (
        <div
          key={i}
          title={`${MONTH_LABELS[i]}: ${h}%`}
          className="flex-1 rounded-t-[1px] transition-all cursor-default"
          style={{
            height: `${Math.max(h, 8)}%`,   // 最低 8% 確保可見
            background: color,
          }}
        />
      );
    })}
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({
  ok,
  labelOk,
  labelFail,
}: {
  ok: boolean;
  labelOk: string;
  labelFail: string;
}) => (
  <span
    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
    style={{
      background: ok ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
      color: ok ? '#4CAF50' : '#FF9800',
    }}
  >
    {ok ? labelOk : labelFail}
  </span>
);

const windDir = (deg: number) => {
  const d = ['N','NE','E','SE','S','SW','W','NW'];
  return d[Math.round(deg / 45) % 8];
};

export const RightPanel: React.FC<RightPanelProps> = ({
  settings, microData: data, landscapeData,
  strategyData, strategyLoading, strategyError, onRetryStrategy,
}) => {

  return (
    <aside
      className="h-full flex flex-col z-10"
      style={{
        width: '260px',
        background: '#141414',
        borderLeft: '1px solid #2A2A2A',
      }}
    >
      {/* ── INFO Header ── */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #2A2A2A' }}
      >
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white">Info</span>
        {data && (
          <StatusBadge
            ok={data._sources.weather !== 'fallback'}
            labelOk={data._sources.weather === 'openMeteo' ? 'Open-Meteo ✓' : 'CWA ✓'}
            labelFail="估算值"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* ── 基地資訊 ── */}
        {settings.analysisPoint && (
          <section>
            <div className="gis-section-label mb-2">Site · 基地資訊</div>
            <div className="space-y-1">
              <DataRow
                label="座標"
                value={`${settings.analysisPoint.lat.toFixed(4)}°N · ${settings.analysisPoint.lng.toFixed(4)}°E`}
              />
              {data && (
                <>
                  <DataRow label="高程 Elevation" value={`${data.elevation.toFixed(1)} m`} />
                  <DataRow label="坡度 / 坡向" value={`${data.slopePct.toFixed(1)}% · ${data.aspectDir}`} />
                </>
              )}
              {landscapeData && (
                <>
                  <DataRow label="都市計畫分區" value={landscapeData.landUseZone ?? '查詢中...'} />
                  <div className="pt-0.5">
                    <StatusBadge
                      ok={landscapeData._sources.zoning !== 'fallback'}
                      labelOk="NLSC WMS ✓"
                      labelFail="分區查詢失敗"
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── 即時氣象 ── */}
        {settings.showMicroClimate && (
          <section>
            <div className="gis-section-label mb-2">Weather · 即時氣象</div>
            <div>
              <DataRow label="溫度" value={data ? `${data.temp.toFixed(1)} °C` : '--'} />
              <DataRow label="濕度" value={data ? `${data.humidity.toFixed(0)} %` : '--'} />
              <DataRow label="風速 / 向" value={data ? `${data.windSpeed.toFixed(1)} m/s · ${windDir(data.windDirection)}` : '--'} />
              <DataRow label="雨量" value={data ? `${data.rainfall.toFixed(1)} mm` : '--'} />
            </div>
          </section>
        )}

        {/* ── 空氣品質 ── */}
        {settings.showMicroClimate && (
          <section>
            <div className="gis-section-label mb-2">Air Quality · 空氣品質</div>
            <div>
              <DataRow
                label="PM2.5"
                value={data ? `${data.pm25.toFixed(0)} µg/m³` : '--'}
                valueColor={data && data.pm25 > 35 ? '#F44336' : undefined}
              />
              <DataRow
                label="AQI"
                value={data ? `${data.aqi.toFixed(0)}` : '--'}
                valueColor={data && data.aqi > 100 ? '#FF9800' : undefined}
              />
              {data && (
                <div className="pt-1">
                  <StatusBadge
                    ok={data._sources.airQuality === 'epa'}
                    labelOk="EPA API ✓"
                    labelFail="估算值"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 日照分析 ── */}
        {settings.showShadows && (
          <section>
            <div className="gis-section-label mb-2">Solar · 日照分析</div>
            {data ? (
              <IrradianceChart data={data.monthlyIrradiance} />
            ) : (
              <div className="flex items-end gap-[2px]" style={{ height: '48px' }}>
                {MONTH_LABELS.map((_, i) => (
                  <div key={i} className="flex-1 rounded-t-[1px]" style={{ height: '20%', background: '#2A2A2A' }} />
                ))}
              </div>
            )}
            <div className="flex justify-between mt-1 mb-2">
              {MONTH_LABELS.map((label, i) => ([0, 5, 11].includes(i) ? label.replace('月', '') : '')).map((m, i) => (
                <span key={i} className="text-[8px]" style={{ color: '#555', width: '8.3%', textAlign: 'center' }}>{m}</span>
              ))}
            </div>
            <div>
              <DataRow label="日照覆蓋率" value={data ? `${(100 - data.shadowCoverage).toFixed(1)} %` : '--'} />
              <DataRow label="峰值日照時數" value={data ? `${data.peakSunHours.toFixed(1)} h/d` : '--'} />
              <DataRow label="年輻射量" value={data ? `${data.annualIrradiance.toFixed(0)} kWh/m²` : '--'} />
            </div>
            {landscapeData && (
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[
                  { label: '夏至遮蔭', value: landscapeData.seasonalSun.summerSolstice },
                  { label: '冬至遮蔭', value: landscapeData.seasonalSun.winterSolstice },
                  { label: '春秋分', value: landscapeData.seasonalSun.equinox },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="text-center py-1.5 rounded"
                    style={{ background: '#1C1C1C' }}
                  >
                    <div className="text-[8px]" style={{ color: '#555' }}>{label}</div>
                    <div className="text-[11px] font-mono" style={{ color: '#F0F0F0' }}>
                      {value.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 地貌坡度 ── */}
        {settings.showSlopeAnalysis && (
          <section>
            <div className="gis-section-label mb-2">Terrain · 地貌坡度</div>
            <div>
              <DataRow label="高程 DEM" value={data ? `${data.elevation.toFixed(1)} m` : '--'} />
              <DataRow label="坡度" value={data ? `${data.slopePct.toFixed(1)} %` : '--'} />
              <DataRow label="坡向 Aspect" value={data ? `${data.aspectDir} · ${data.aspectDeg.toFixed(0)}°` : '--'} />
              <DataRow label="排水係數 C" value={data ? data.drainageCoeff.toFixed(2) : '--'} />
            </div>
          </section>
        )}

        {/* ── 土壤滲透 ── */}
        {settings.showSoilAnalysis && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Soil · 土壤滲透</div>
            <div>
              <DataRow label="滲透率" value={`${landscapeData.soil.infiltrationRate.toFixed(1)} mm/hr`} />
              <DataRow label="排水速度" value={landscapeData.soil.drainageSpeed} />
              <DataRow label="積水風險" value={landscapeData.soil.waterloggingRisk}
                valueColor={landscapeData.soil.waterloggingRisk === '高' ? '#F44336' : undefined} />
            </div>
          </section>
        )}

        {/* ── 水文 ── */}
        {settings.showHydrology && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Hydrology · 水文</div>
            <div>
              <DataRow label="集水範圍" value={`${landscapeData.hydrology.catchmentArea.toFixed(1)} m²`} />
              <DataRow label="暴雨積水深" value={`${landscapeData.hydrology.pondingDepth.toFixed(0)} mm`} />
              <DataRow label="地表排除方位" value={`${landscapeData.hydrology.flowDirection.toFixed(0)}°`} />
            </div>
          </section>
        )}

        {/* ── 都市干擾 ── */}
        {settings.showUrbanStress && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Urban Stress · 都市干擾</div>
            <div>
              <DataRow label="熱指數 Heat Index" value={`${(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)} %`} />
              <DataRow label="反照率 Albedo" value={landscapeData.urbanStress.albedo.toFixed(2)} />
              <DataRow label="推估表面溫度" value={`${landscapeData.urbanStress.surfaceTemp.toFixed(1)} °C`}
                valueColor={landscapeData.urbanStress.surfaceTemp > 38 ? '#F44336' : undefined} />
            </div>
            <div className="mt-2 space-y-1">
              <div
                className="text-[9px] px-2 py-1 rounded"
                style={{
                  background: landscapeData.urbanStress.canyonEffect ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
                  color: landscapeData.urbanStress.canyonEffect ? '#F44336' : '#4CAF50',
                }}
              >
                {landscapeData.urbanStress.canyonEffect ? '⚠ 街谷風效應明顯' : '✓ 街道風場流動順暢'}
              </div>
              <div
                className="text-[9px] px-2 py-1 rounded"
                style={{
                  background: landscapeData.urbanStress.downdraftRisk ? 'rgba(244,67,54,0.1)' : 'rgba(33,150,243,0.1)',
                  color: landscapeData.urbanStress.downdraftRisk ? '#F44336' : '#2196F3',
                }}
              >
                {landscapeData.urbanStress.downdraftRisk ? '⚠ 高壓風切 Downdraft 風險' : '✓ 垂直風量穩定'}
              </div>
            </div>
          </section>
        )}

        {/* ── 08I 容積率 / 建蔽率 ── */}
        {settings.showZoningRegulation && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">08I · 容積率 / 建蔽率</div>
            <div
              className="px-3 py-2 rounded mb-2"
              style={{ background: '#1C1C1C', border: '1px solid #2A2A2A' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px]" style={{ color: '#888' }}>分區</span>
                <span className="text-[10px] font-bold truncate max-w-[120px]" style={{ color: '#C8A84B' }}>
                  {landscapeData.landUseZone.split('（')[0]}
                </span>
              </div>
              {landscapeData.zoningRegulation.far !== null ? (
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="text-center py-2 rounded"
                    style={{ background: '#141414', border: '1px solid #2A2A2A' }}
                  >
                    <div className="text-[8px] mb-1" style={{ color: '#666' }}>容積率 FAR</div>
                    <div className="text-[18px] font-mono font-bold" style={{ color: '#C8A84B' }}>
                      {landscapeData.zoningRegulation.far}%
                    </div>
                  </div>
                  <div
                    className="text-center py-2 rounded"
                    style={{ background: '#141414', border: '1px solid #2A2A2A' }}
                  >
                    <div className="text-[8px] mb-1" style={{ color: '#666' }}>建蔽率 BCR</div>
                    <div className="text-[18px] font-mono font-bold" style={{ color: '#E05A2B' }}>
                      {landscapeData.zoningRegulation.bcr}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] py-1" style={{ color: '#666' }}>
                  無法查詢（非都市計畫區）
                </div>
              )}
            </div>
            <div
              className="text-[9px] px-2 py-1.5 rounded leading-relaxed"
              style={{ background: 'rgba(200,168,75,0.06)', color: '#666', border: '1px solid rgba(200,168,75,0.12)' }}
            >
              {landscapeData.zoningRegulation.note}<br />
              <span style={{ color: '#444' }}>實際以各縣市都市計畫自治條例為準</span>
            </div>
          </section>
        )}

        {/* ── 微氣候分區 ── */}
        {settings.showZoning && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Zoning · 微氣候分區</div>
            <div
              className="px-3 py-2 rounded mb-2"
              style={{ background: '#1C1C1C', border: '1px solid #2A2A2A' }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px]" style={{ color: '#888' }}>環境類型</span>
                <span className="text-[11px] font-bold" style={{ color: '#E05A2B' }}>
                  {landscapeData.zoning.category}
                </span>
              </div>
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: '#2A2A2A' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${landscapeData.zoning.intensity * 100}%`,
                    background: '#E05A2B',
                  }}
                />
              </div>
              <div className="text-[9px] mt-1 text-right" style={{ color: '#555' }}>
                強度 {(landscapeData.zoning.intensity * 10).toFixed(1)} / 10
              </div>
            </div>
            <div
              className="text-[10px] px-2 py-2 rounded italic leading-relaxed"
              style={{ background: '#1C1C1C', color: '#888' }}
            >
              「{landscapeData.recommendations.designSuggestions[0] ?? '選用適應當地氣候的原生植栽'}」
            </div>
          </section>
        )}

        {/* ── AI 植栽建議 ── */}
        {settings.showPlantMatching && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">AI Plants · 植栽建議</div>

            {/* Traits */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {[
                { k: '日照', v: landscapeData.aiSummary.traits.sun, hi: '高' },
                { k: '溫度', v: landscapeData.aiSummary.traits.temp, hi: '高' },
                { k: '風場', v: landscapeData.aiSummary.traits.wind, hi: '高' },
                { k: '濕度', v: landscapeData.aiSummary.traits.water, hi: '高' },
              ].map(({ k, v, hi }) => (
                <div
                  key={k}
                  className="text-center py-1 rounded"
                  style={{ background: '#1C1C1C' }}
                >
                  <div className="text-[8px] mb-0.5" style={{ color: '#555' }}>{k}</div>
                  <div
                    className="text-[11px] font-bold"
                    style={{ color: v === hi ? '#E05A2B' : '#4CAF50' }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Plant lists */}
            {(['喬木', '灌木', '地被'] as const).map((type) => {
              const plants = landscapeData.recommendations.topPlants
                .filter((p) => p.type === type)
                .slice(0, 3);
              if (!plants.length) return null;
              const color = { 喬木: '#4CAF50', 灌木: '#8BC34A', 地被: '#CDDC39' }[type];
              return (
                <div key={type} className="mb-2">
                  <div
                    className="text-[9px] font-bold mb-1 tracking-wide"
                    style={{ color }}
                  >
                    {type} ·
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {plants.map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: '#1C1C1C',
                          border: '1px solid #2A2A2A',
                          color: '#F0F0F0',
                        }}
                      >
                        {p.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Avoid */}
            {landscapeData.recommendations.avoidPlants.length > 0 && (
              <div
                className="mt-2 px-2 py-2 rounded"
                style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)' }}
              >
                <div className="text-[9px] font-bold mb-1 tracking-widest uppercase" style={{ color: '#F44336' }}>
                  ✕ Reject — 避免種植
                </div>
                {landscapeData.recommendations.avoidPlants.map((a, i) => (
                  <div key={i} className="flex justify-between text-[10px] py-0.5">
                    <span style={{ color: '#F0F0F0' }}>{a.name}</span>
                    <span className="italic text-[9px]" style={{ color: '#F44336', opacity: 0.7 }}>{a.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── AI 診斷與建議 ── */}
        {settings.showLandscapeStrategy && (
          <section>
            <div className="gis-section-label mb-2 flex items-center gap-1.5">
              <span>AI · 診斷與建議</span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: 'rgba(188,253,73,0.12)', color: '#BCFD49', border: '1px solid rgba(188,253,73,0.25)' }}
              >
                AI
              </span>
            </div>

            {/* 未點選基地 */}
            {!data && (
              <div className="text-[10px] px-2 py-2 rounded" style={{ background: '#1C1C1C', color: '#555' }}>
                點選地圖基地後，AI 將自動診斷場址並給出結論與建議
              </div>
            )}

            {/* 載入中 */}
            {data && strategyLoading && (
              <div className="flex flex-col gap-2 px-2 py-4 items-center">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#BCFD49', opacity: 0.8,
                        animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: '#666' }}>AI 正在診斷場址數據...</span>
              </div>
            )}

            {/* 錯誤 */}
            {data && !strategyLoading && strategyError && (
              <div className="px-2 py-2 rounded mb-2"
                style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)' }}>
                <div className="text-[9px] mb-1.5" style={{ color: '#F44336' }}>{strategyError}</div>
                <button onClick={onRetryStrategy}
                  className="text-[9px] px-2 py-1 rounded hover:opacity-80"
                  style={{ background: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }}>
                  重新生成
                </button>
              </div>
            )}

            {/* AI 診斷結果 */}
            {data && !strategyLoading && strategyData && (
              <>
                {/* 診斷 */}
                <div className="mb-3">
                  <div className="text-[9px] font-bold mb-1.5 tracking-widest uppercase" style={{ color: '#F44336' }}>
                    ◆ 診斷
                  </div>
                  <div className="space-y-1">
                    {strategyData.diagnosis.map((item, i) => (
                      <div key={i} className="flex gap-2 px-2 py-1.5 rounded text-[10px] leading-relaxed"
                        style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.12)', color: '#C8C8C8' }}>
                        <span className="shrink-0" style={{ color: '#F44336', opacity: 0.6 }}>▸</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 結論 */}
                <div className="mb-3">
                  <div className="text-[9px] font-bold mb-1.5 tracking-widest uppercase" style={{ color: '#C8A84B' }}>
                    ◆ 結論
                  </div>
                  <div className="px-3 py-2.5 rounded text-[10px] leading-relaxed"
                    style={{ background: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.18)', color: '#D4C080' }}>
                    {strategyData.conclusion}
                  </div>
                </div>

                {/* 建議 */}
                <div className="mb-2">
                  <div className="text-[9px] font-bold mb-1.5 tracking-widest uppercase" style={{ color: '#BCFD49' }}>
                    ◆ 建議
                  </div>
                  <div className="space-y-1">
                    {strategyData.recommendations.map((item, i) => (
                      <div key={i} className="flex gap-2 px-2 py-1.5 rounded text-[10px] leading-relaxed"
                        style={{ background: 'rgba(188,253,73,0.04)', border: '1px solid rgba(188,253,73,0.12)', color: '#C8C8C8' }}>
                        <span className="shrink-0 font-mono text-[9px] mt-0.5" style={{ color: '#BCFD49', opacity: 0.6 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={onRetryStrategy}
                  className="w-full text-[9px] py-1.5 rounded mt-1 hover:opacity-70 transition-opacity"
                  style={{ background: '#181818', color: '#444', border: '1px solid #222' }}>
                  重新生成
                </button>
              </>
            )}
          </section>
        )}

      </div>

      {/* ── Export footer ── */}
      {data && landscapeData && (
        <div
          className="px-4 py-3 space-y-2"
          style={{ borderTop: '1px solid #2A2A2A' }}
        >
          <div className="gis-section-label mb-2">Export · 匯出報告</div>
          <div className="flex gap-2">
            <button
              onClick={() => exportPdf(data, landscapeData, settings)}
              className="gis-action-btn gis-action-primary flex-1"
            >
              PDF
            </button>
            <button
              onClick={() => exportMd(data, landscapeData, settings)}
              className="gis-action-btn gis-action-ghost flex-1"
            >
              .md
            </button>
            <button
              onClick={() => exportTxt(data, landscapeData, settings)}
              className="gis-action-btn gis-action-ghost flex-1"
            >
              .txt
            </button>
          </div>
        </div>
      )}

      {/* ── 系統診斷（永久固定在匯出報告下方）── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid #1E1E1E' }}
      >
        <div className="gis-section-label mb-1.5">Diagnostics · 系統狀態</div>
        <div className="space-y-0.5 text-[9px]" style={{ color: '#666' }}>
          {!settings.analysisPoint && (
            <p>→ 點選地圖地點以啟動景觀決策引擎</p>
          )}
          {data && data._sources.weather === 'fallback' && (
            <p style={{ color: '#FF9800' }}>⚠ 氣象 API 失敗，顯示估算值</p>
          )}
          {data && data._sources.airQuality === 'fallback' && (
            <p style={{ color: '#FF9800' }}>⚠ 空品 API 失敗，顯示估算值</p>
          )}
          {landscapeData && landscapeData._sources.zoning === 'fallback' && (
            <p style={{ color: '#FF9800' }}>⚠ 都市計畫分區查詢失敗</p>
          )}
          {data && data.pm25 > 35 && (
            <p style={{ color: '#FF9800' }}>⚠ PM2.5 超標 ({data.pm25.toFixed(0)} µg/m³)</p>
          )}
          {landscapeData && landscapeData.soil.waterloggingRisk === '高' && (
            <p style={{ color: '#F44336' }}>⚠ 積水高風險</p>
          )}
          {landscapeData && landscapeData.urbanStress.surfaceTemp > 38 && (
            <p style={{ color: '#F44336' }}>⚠ 地表蓄熱嚴重（{landscapeData.urbanStress.surfaceTemp.toFixed(1)}°C）</p>
          )}
          {landscapeData && landscapeData.urbanStress.canyonEffect && (
            <p style={{ color: '#FF9800' }}>⚠ 街谷風效應明顯</p>
          )}
          {data && landscapeData && !([
            data._sources.weather === 'fallback',
            data._sources.airQuality === 'fallback',
            landscapeData._sources.zoning === 'fallback',
            data.pm25 > 35,
            landscapeData.soil.waterloggingRisk === '高',
            landscapeData.urbanStress.surfaceTemp > 38,
            landscapeData.urbanStress.canyonEffect,
          ].some(Boolean)) && (
            <p style={{ color: '#4CAF50' }}>✓ 所有資料源正常，無環境異常</p>
          )}
        </div>
      </div>
    </aside>
  );
};
