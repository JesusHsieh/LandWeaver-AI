import React, { useEffect, useState } from 'react';
import { MapSettings, MicroClimateData, LandscapeDesignData } from '../types';
import { exportMd, exportTxt, exportPdf } from '../services/exportService';
import { RuleCheck, RuleLevel, formatRulesForAI, sortRuleChecks } from '../services/siteRules';

interface RightPanelProps {
  settings: MapSettings;
  microData: MicroClimateData | null;
  landscapeData: LandscapeDesignData | null;
  ruleChecks: RuleCheck[] | null;
}

/* ── Rule checklist row ── */
const LEVEL_COLOR: Record<RuleLevel, string> = { 高: '#F44336', 中: '#FF9800', 低: '#C8A84B' };

const RuleRow = ({ check: c }: { check: RuleCheck }) => {
  const color =
    c.status === 'hit'  ? LEVEL_COLOR[c.level ?? '低'] :
    c.status === 'info' ? '#6FA8DC' :
    c.status === 'pass' ? '#4CAF50' : '#555';
  const badge =
    c.status === 'hit'  ? c.level :
    c.status === 'info' ? '參考' :
    c.status === 'pass' ? '✓' : '—';
  const strong = c.status === 'hit' || c.status === 'info';
  return (
    <div
      className="px-2 py-1 rounded text-[10px]"
      title={`${c.id} · 判準：${c.threshold}${c.note ? `\n${c.note}` : ''}`}
      style={{
        background: c.status === 'hit' ? `${color}0F` : '#1A1A1A',
        border: `1px solid ${c.status === 'hit' ? `${color}33` : '#222'}`,
      }}
    >
      <div className="flex items-start gap-1.5">
        <span
          className="shrink-0 w-6 text-center text-[8px] font-bold rounded py-[1px]"
          style={{ color, background: `${color}1F` }}
        >
          {badge}
        </span>
        <span className="shrink-0" style={{ color: strong ? '#E0E0E0' : '#777' }}>{c.name}</span>
        <span className="ml-auto text-right text-[9px]" style={{ color: strong ? '#C8C8C8' : '#666' }}>
          {c.value}
        </span>
      </div>
      {strong && c.note && (
        <div className="mt-0.5 pl-[30px] text-[9px] leading-snug" style={{ color: '#888' }}>
          {c.note}
          {c.status === 'hit' && <span style={{ color: '#555' }}>（判準 {c.threshold}）</span>}
        </div>
      )}
    </div>
  );
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* fall back below (non-secure context / permission denied) */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
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

const NO_DATA = '無資料';
/** 數值 + 單位；查詢失敗（null）顯示「無資料」 */
const fmt = (v: number | null, digits: number, unit = '') => (v === null ? NO_DATA : `${v.toFixed(digits)}${unit}`);
const yesNo = (v: boolean | null) => (v === null ? NO_DATA : v ? '是' : '否');

const windDir = (deg: number) => {
  const d = ['N','NE','E','SE','S','SW','W','NW'];
  return d[Math.round(deg / 45) % 8];
};
const compassZh = (deg: number) => ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round(deg / 45) % 8];

const CURVATURE_EPS = 1e-5;
const curvatureLabel = (c: number | null) =>
  c === null ? NO_DATA : c > CURVATURE_EPS ? '凹地（聚水）' : c < -CURVATURE_EPS ? '凸地（散水）' : '平直';

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[8px] mt-1 leading-snug" style={{ color: '#555' }}>{children}</div>
);

export const RightPanel: React.FC<RightPanelProps> = ({
  settings, microData: data, landscapeData,
  ruleChecks,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');
  useEffect(() => setCopyState('idle'), [ruleChecks]);
  useEffect(() => {
    if (copyState === 'idle') return;
    const t = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(t);
  }, [copyState]);

  const hitCount = ruleChecks?.filter(c => c.status === 'hit').length ?? 0;

  const handleCopyRules = async () => {
    if (!ruleChecks || !data || !landscapeData) return;
    const text = formatRulesForAI(ruleChecks, data, landscapeData, settings.analysisPoint);
    setCopyState((await copyText(text)) ? 'ok' : 'fail');
  };

  const failures = [
    data?._sources.weather === 'none'    && '氣象（Open-Meteo / 中央氣象署）',
    data?._sources.airQuality === 'none' && '空氣品質',
    data?._sources.solar === 'none'      && '日照（PVGIS）',
    data?._sources.elevation === 'none'  && '高程（Open-Elevation）',
    landscapeData?._sources.zoning === 'none' && '都市計畫分區',
  ].filter(Boolean) as string[];
  const alerts = [
    data?.pm25 != null && data.pm25 > 35 && `PM2.5 偏高（${data.pm25.toFixed(0)} µg/m³）`,
    landscapeData?.drainage.waterloggingRisk === '高' && '積水高風險',
    data?.surfaceTemp != null && data.surfaceTemp > 38 && `地表高溫（${data.surfaceTemp.toFixed(1)}°C，模式值）`,
    landscapeData?.urbanStress.stagnantLowland && '低風速平坦低地，通風可能不良',
  ].filter(Boolean) as string[];

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
            ok={data._sources.weather !== 'none'}
            labelOk={data._sources.weather === 'openMeteo' ? 'Open-Meteo ✓' : 'CWA ✓'}
            labelFail="氣象查詢失敗"
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
                  <DataRow label="高程 Elevation" value={fmt(data.elevation, 1, ' m')} />
                  <DataRow
                    label="坡度 / 坡向"
                    value={data.slopePct === null ? NO_DATA : `${data.slopePct.toFixed(1)}% · ${data.aspectDir}`}
                  />
                </>
              )}
              {landscapeData && (
                <>
                  <DataRow label="都市計畫分區" value={landscapeData.landUseZone} />
                  <div className="pt-0.5">
                    <StatusBadge
                      ok={landscapeData._sources.zoning !== 'none'}
                      labelOk="NLSC LUIMAP ✓"
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
              <DataRow label="溫度" value={data ? fmt(data.temp, 1, ' °C') : '--'} />
              <DataRow label="濕度" value={data ? fmt(data.humidity, 0, ' %') : '--'} />
              <DataRow
                label="風速 / 向"
                value={data
                  ? data.windSpeed === null
                    ? NO_DATA
                    : `${data.windSpeed.toFixed(1)} m/s${data.windDirection === null ? '' : ` · ${windDir(data.windDirection)}`}`
                  : '--'}
              />
              <DataRow label="雨量" value={data ? fmt(data.rainfall, 1, ' mm') : '--'} />
              <DataRow label="地表溫度（模式）" value={data ? fmt(data.surfaceTemp, 1, ' °C') : '--'} />
            </div>
            {data?._sources.weather === 'cwa' && <Note>中央氣象署測站無地表溫度</Note>}
          </section>
        )}

        {/* ── 空氣品質 ── */}
        {settings.showMicroClimate && (
          <section>
            <div className="gis-section-label mb-2">Air Quality · 空氣品質</div>
            <div>
              <DataRow
                label="PM2.5"
                value={data ? fmt(data.pm25, 0, ' µg/m³') : '--'}
                valueColor={data?.pm25 != null && data.pm25 > 35 ? '#F44336' : undefined}
              />
              <DataRow
                label="AQI"
                value={data ? (data.aqi === null ? '僅環境部測站提供' : data.aqi.toFixed(0)) : '--'}
                valueColor={data?.aqi != null && data.aqi > 100 ? '#FF9800' : undefined}
              />
              {data && (
                <div className="pt-1">
                  <StatusBadge
                    ok={data._sources.airQuality !== 'none'}
                    labelOk={data._sources.airQuality === 'epa' ? '環境部測站 ✓' : 'CAMS 模式值 ✓'}
                    labelFail="空品查詢失敗"
                  />
                </div>
              )}
            </div>
            {data?._sources.airQuality === 'openMeteo' && (
              <Note>未設定環境部 Key，改用 Open-Meteo CAMS 模式值（非測站觀測）</Note>
            )}
          </section>
        )}

        {/* ── 日照分析 ── */}
        {settings.showShadows && (
          <section>
            <div className="gis-section-label mb-2">Solar · 日照分析</div>
            {data?.monthlyIrradiance ? (
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
              <DataRow label="目前太陽高度角" value={data ? `${data.solarAltitude.toFixed(1)}°` : '--'} />
              <DataRow label="目前太陽方位角" value={data ? `${data.solarAzimuth.toFixed(1)}°` : '--'} />
              <DataRow label="峰值日照時數" value={data ? fmt(data.peakSunHours, 1, ' h/d') : '--'} />
              <DataRow label="斜面年日射量" value={data ? fmt(data.annualIrradiance, 0, ' kWh/m²') : '--'} />
            </div>
            {landscapeData && (
              <div className="mt-2 grid grid-cols-3 gap-1">
                {landscapeData.seasonalSun.map(({ label, noonAltitude, dayLength }) => (
                  <div
                    key={label}
                    className="text-center py-1.5 rounded"
                    style={{ background: '#1C1C1C' }}
                    title={`${label}正午太陽高度角 ${noonAltitude.toFixed(1)}°，晝長 ${dayLength.toFixed(1)} 小時`}
                  >
                    <div className="text-[8px]" style={{ color: '#555' }}>{label}正午</div>
                    <div className="text-[11px] font-mono" style={{ color: '#F0F0F0' }}>
                      {noonAltitude.toFixed(0)}°
                    </div>
                    <div className="text-[8px] font-mono" style={{ color: '#666' }}>晝長 {dayLength.toFixed(1)} h</div>
                  </div>
                ))}
              </div>
            )}
            <Note>月分布、峰值日照、年日射量：PVGIS-ERA5 最佳傾角斜面；太陽角度：天文公式</Note>
          </section>
        )}

        {/* ── 地貌坡度 ── */}
        {settings.showSlopeAnalysis && (
          <section>
            <div className="gis-section-label mb-2">Terrain · 地貌坡度</div>
            <div>
              <DataRow label="高程 DEM" value={data ? fmt(data.elevation, 1, ' m') : '--'} />
              <DataRow label="坡度" value={data ? fmt(data.slopePct, 1, ' %') : '--'} />
              <DataRow
                label="坡向 Aspect"
                value={data
                  ? data.aspectDeg === null ? (data.aspectDir ?? NO_DATA) : `${data.aspectDir} · ${data.aspectDeg.toFixed(0)}°`
                  : '--'}
              />
              <DataRow label="地表曲率" value={data ? curvatureLabel(data.planCurvature) : '--'} />
            </div>
            <Note>Open-Elevation DEM，基地與東西南北約 111 m 共 5 點差分</Note>
          </section>
        )}

        {/* ── 地表排水 ── */}
        {settings.showSoilAnalysis && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Drainage · 地表排水</div>
            <div>
              <DataRow label="地表排水（依坡度）" value={landscapeData.drainage.speed ?? NO_DATA} />
              <DataRow
                label="積水風險"
                value={landscapeData.drainage.waterloggingRisk ?? NO_DATA}
                valueColor={landscapeData.drainage.waterloggingRisk === '高' ? '#F44336' : undefined}
              />
            </div>
            <Note>坡度 &gt;20% 快、&gt;5% 中、其餘慢；沒有土壤資料，不推估入滲率</Note>
          </section>
        )}

        {/* ── 逕流方向 ── */}
        {settings.showHydrology && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Hydrology · 逕流方向</div>
            <div>
              <DataRow
                label="地表逕流方向"
                value={landscapeData.drainage.flowDirection !== null
                  ? `往${compassZh(landscapeData.drainage.flowDirection)} · ${landscapeData.drainage.flowDirection.toFixed(0)}°`
                  : data?.slopePct === null ? NO_DATA : '平坦，無明顯方向'}
              />
              <DataRow label="地表曲率" value={data ? curvatureLabel(data.planCurvature) : '--'} />
            </div>
            <Note>逕流方向 = DEM 下坡方向</Note>
          </section>
        )}

        {/* ── 熱與風環境 ── */}
        {settings.showUrbanStress && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Heat &amp; Wind · 熱與風環境</div>
            <div>
              <DataRow
                label="地表溫度（模式）"
                value={fmt(landscapeData.urbanStress.surfaceTemp, 1, ' °C')}
                valueColor={(landscapeData.urbanStress.surfaceTemp ?? 0) > 38 ? '#F44336' : undefined}
              />
              <DataRow label="強風坡地" value={yesNo(landscapeData.urbanStress.windySlope)} />
              <DataRow label="低風速平坦低地" value={yesNo(landscapeData.urbanStress.stagnantLowland)} />
            </div>
            <Note>
              地表溫度：Open-Meteo 地表 0 cm 模式值。強風坡地：風速 &gt;5 m/s 且坡度 &gt;10%；
              低風速平坦低地：風速 &lt;3 m/s、海拔 &lt;80 m、坡度 &lt;5%
            </Note>
          </section>
        )}

        {/* ── 08I 都市計畫分區 ── */}
        {settings.showZoningRegulation && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">08I · 都市計畫分區</div>
            <div
              className="px-3 py-2 rounded mb-2"
              style={{ background: '#1C1C1C', border: '1px solid #2A2A2A' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px]" style={{ color: '#888' }}>分區</span>
                <span className="text-[10px] font-bold truncate max-w-[150px]" style={{ color: '#C8A84B' }}>
                  {landscapeData.landUseZone.split('（')[0]}
                </span>
              </div>
            </div>
            <div
              className="text-[9px] px-2 py-1.5 rounded leading-relaxed"
              style={{ background: 'rgba(200,168,75,0.06)', color: '#777', border: '1px solid rgba(200,168,75,0.12)' }}
            >
              分區由國土測繪中心 LUIMAP 圖層色碼判讀。<br />
              容積率、建蔽率依各都市計畫書與縣市土地使用管制規定，各計畫區不同，本工具不提供推估值。
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
                  {landscapeData.zoning?.category ?? NO_DATA}
                </span>
              </div>
              <div className="text-[9px] leading-snug" style={{ color: '#777' }}>
                {landscapeData.zoning ? `依據：${landscapeData.zoning.basis}` : '需要日照、氣象與高程資料才能分類'}
              </div>
            </div>
            {landscapeData.recommendations.designSuggestions[0] && (
              <div
                className="text-[10px] px-2 py-2 rounded italic leading-relaxed"
                style={{ background: '#1C1C1C', color: '#888' }}
              >
                「{landscapeData.recommendations.designSuggestions[0]}」
              </div>
            )}
          </section>
        )}

        {/* ── 植栽建議（規則篩選）── */}
        {settings.showPlantMatching && landscapeData && (
          <section>
            <div className="gis-section-label mb-2">Plants · 植栽建議（規則篩選）</div>

            {/* Traits */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {[
                { k: '日照', v: landscapeData.traits.sun },
                { k: '溫度', v: landscapeData.traits.temp },
                { k: '風場', v: landscapeData.traits.wind },
                { k: '濕度', v: landscapeData.traits.water },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="text-center py-1 rounded"
                  style={{ background: '#1C1C1C' }}
                >
                  <div className="text-[8px] mb-0.5" style={{ color: '#555' }}>{k}</div>
                  <div
                    className="text-[11px] font-bold"
                    style={{ color: v === null ? '#555' : v === '高' ? '#E05A2B' : '#4CAF50' }}
                  >
                    {v ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            {landscapeData.recommendations.plants.length === 0 && (
              <div className="text-[10px] px-2 py-2 rounded" style={{ background: '#1C1C1C', color: '#555' }}>
                沒有符合條件的植栽（或資料不足）
              </div>
            )}

            {/* Plant lists */}
            {(['喬木', '灌木', '地被'] as const).map((type) => {
              const plants = landscapeData.recommendations.plants
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
                        title={`符合：${p.reasons.join('、')}`}
                        style={{
                          background: '#1C1C1C',
                          border: '1px solid #2A2A2A',
                          color: '#F0F0F0',
                        }}
                      >
                        {p.name.split(' ')[0]}
                        <span style={{ color: '#666' }}> · {p.reasons.join('、')}</span>
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
            <Note>依日照、溫度、風、濕度等級比對 12 種常見植栽的光照、需水特性（固定規則，非 AI）</Note>
          </section>
        )}

        {/* ── 場址規則檢核（本機判讀，不呼叫 AI；複製後自行交給 AI 分析）── */}
        {settings.showLandscapeStrategy && (
          <section>
            <div className="gis-section-label mb-2 flex items-center justify-between">
              <span>Rules · 規則檢核</span>
              {ruleChecks && (
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(188,253,73,0.12)', color: '#BCFD49', border: '1px solid rgba(188,253,73,0.25)' }}
                >
                  觸發 {hitCount}/{ruleChecks.length}
                </span>
              )}
            </div>

            {/* 未點選基地 */}
            {!data && (
              <div className="text-[10px] px-2 py-2 rounded" style={{ background: '#1C1C1C', color: '#555' }}>
                點選地圖基地後，逐項列出場址規則檢核結果
              </div>
            )}

            {/* 場址數據仍在載入 */}
            {data && !ruleChecks && (
              <div className="text-[10px] px-2 py-2 rounded" style={{ background: '#1C1C1C', color: '#555' }}>
                場址數據載入中…
              </div>
            )}

            {/* 檢核列表：觸發 → 參考 → 未觸發 → 未判讀 */}
            {data && ruleChecks && (
              <>
                <div className="space-y-1">
                  {sortRuleChecks(ruleChecks).map(c => <RuleRow key={c.id} check={c} />)}
                </div>

                <button
                  onClick={handleCopyRules}
                  className="gis-action-btn gis-action-ghost w-full mt-2"
                  style={copyState === 'ok' ? { color: '#4CAF50' } : copyState === 'fail' ? { color: '#F44336' } : undefined}
                >
                  {copyState === 'ok' ? '已複製 ✓' : copyState === 'fail' ? '複製失敗' : '複製檢核表（貼給 AI 分析）'}
                </button>
                <div className="text-[8px] mt-1" style={{ color: '#444' }}>
                  本機規則判讀 · 不呼叫 AI、不耗 API 額度
                </div>
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
          {failures.length > 0 && (
            <p style={{ color: '#FF9800' }}>⚠ 查詢失敗（顯示「無資料」）：{failures.join('、')}</p>
          )}
          {alerts.map(a => (
            <p key={a} style={{ color: '#FF9800' }}>⚠ {a}</p>
          ))}
          {data && landscapeData && failures.length === 0 && alerts.length === 0 && (
            <p style={{ color: '#4CAF50' }}>✓ 所有資料源正常，無環境異常</p>
          )}
        </div>
      </div>
    </aside>
  );
};
