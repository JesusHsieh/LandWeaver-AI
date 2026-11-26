import React, { useMemo, useRef, useState } from 'react';
import { Section, BtnGroup } from '../ui/SectionGroup';
import { parseCoordinates, inTaiwan, type Tm2Zone } from '../../../utils/coordParse';
import { searchPlaces, type PlaceKind, type PlaceResult } from '../../../services/clients/searchClient';

export interface LocateTarget {
  lat: number;
  lng: number;
  name: string;
  /** 相機飛到地面以上的高度（公尺） */
  viewHeight: number;
}

const KIND_LABEL: Record<PlaceKind, { text: string; color: string }> = {
  house: { text: '門牌', color: '#4CAF50' },
  poi:   { text: '地標', color: '#2196F3' },
  road:  { text: '道路', color: '#FF9800' },
  area:  { text: '地區', color: '#AB47BC' },
};

const NLSC_MAP_URL = 'https://maps.nlsc.gov.tw/T09/mapshow.action';
const ZONE_OPTIONS = ['121° 本島', '119° 澎金馬'];
const COORD_VIEW_HEIGHT = 600;

type Status =
  | { type: 'idle' }
  | { type: 'searching' }
  | { type: 'results'; items: PlaceResult[]; houseNotFound: boolean }
  | { type: 'empty' }
  | { type: 'error'; message: string }
  | { type: 'located'; message: string; warn?: string };

const Note = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div className="text-[9px] mt-2 px-2 py-1.5 rounded leading-relaxed" style={{ color, background: '#141414', border: '1px solid #222' }}>
    {children}
  </div>
);

export const LocateBlock: React.FC<{ onLocate: (t: LocateTarget) => void }> = ({ onLocate }) => {
  const [text, setText] = useState('');
  const [zone, setZone] = useState<Tm2Zone>(121);
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const parsed = useMemo(() => parseCoordinates(text, zone), [text, zone]);
  const searching = status.type === 'searching';

  const locate = (t: LocateTarget, message: string, warn?: string) => {
    onLocate(t);
    setStatus({
      type: 'located',
      message,
      warn: warn ?? (inTaiwan(t.lat, t.lng) ? undefined : '此位置在臺灣以外，多數官方圖資查無資料'),
    });
  };

  const submit = async () => {
    const q = text.trim();
    if (!q || searching || parsed?.kind === 'invalid') return;

    if (parsed) {
      const { lat, lng } = parsed;
      const label = parsed.kind === 'twd97'
        ? `TWD97 ${parsed.x}, ${parsed.y}`
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      locate(
        { lat, lng, name: `座標 ${label}`, viewHeight: COORD_VIEW_HEIGHT },
        `已定位到 ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
      );
      return;
    }
    if (q.length < 2) {
      setStatus({ type: 'error', message: '請至少輸入兩個字' });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ type: 'searching' });
    try {
      const { items, houseNotFound } = await searchPlaces(q, controller.signal);
      if (controller.signal.aborted) return;
      setStatus(items.length ? { type: 'results', items, houseNotFound } : { type: 'empty' });
    } catch {
      if (controller.signal.aborted) return;
      setStatus({ type: 'error', message: 'OSM 搜尋失敗，請稍後再試' });
    }
  };

  const pick = (p: PlaceResult) => {
    const warn = p.kind === 'road' ? '定位在路段中心，請再點地圖修正基地位置'
      : p.kind === 'area' ? '定位在區域中心，請再點地圖選定基地位置'
      : undefined;
    locate({ lat: p.lat, lng: p.lng, name: p.title, viewHeight: p.viewHeight }, `已定位：${p.title}`, warn);
  };

  const hint = !text.trim()
    ? { color: '#555', text: '例：市府路1號、臺北101、25.0339, 121.5644' }
    : !parsed
      ? { color: '#555', text: 'Enter：用 OSM 搜尋地址或地標' }
      : parsed.kind === 'invalid'
        ? { color: '#FF9800', text: parsed.reason }
        : {
            color: '#4CAF50',
            text: `${parsed.kind === 'twd97' ? 'TWD97' : 'WGS84'} → ${parsed.lat.toFixed(5)}°N, ${parsed.lng.toFixed(5)}°E · Enter 定位`,
          };

  return (
    <Section label="▸ Locate · 基地定位" labelColor="#E05A2B">
      <form
        className="flex gap-1"
        onSubmit={e => { e.preventDefault(); void submit(); }}
      >
        <input
          type="search"
          value={text}
          onChange={e => {
            setText(e.target.value);
            // 改字後清掉上一次的提示；候選清單留著，方便比對
            if (status.type !== 'results' && status.type !== 'searching') setStatus({ type: 'idle' });
          }}
          placeholder="地址、地標或座標"
          aria-label="搜尋地址、地標，或輸入座標"
          className="flex-1 min-w-0 text-[10px] px-2 py-1.5 rounded"
          style={{ background: '#111', color: '#DDD', border: '1px solid #2A2A2A', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={searching || !text.trim() || parsed?.kind === 'invalid'}
          className="text-[10px] px-2 rounded shrink-0 disabled:opacity-40"
          style={{ background: 'rgba(224,90,43,0.15)', color: '#E05A2B', border: '1px solid rgba(224,90,43,0.35)' }}
        >
          {searching ? '搜尋中' : parsed && parsed.kind !== 'invalid' ? '定位' : '搜尋'}
        </button>
      </form>
      <div className="text-[9px] mt-1 px-0.5 leading-snug" style={{ color: hint.color }}>{hint.text}</div>

      {parsed?.kind === 'twd97' && (
        <div className="mt-1.5">
          <div className="text-[9px] mb-1 px-0.5" style={{ color: '#666' }}>TWD97 二度分帶中央經線</div>
          <BtnGroup
            options={ZONE_OPTIONS}
            active={ZONE_OPTIONS[zone === 121 ? 0 : 1]}
            onSelect={v => setZone(v === ZONE_OPTIONS[0] ? 121 : 119)}
          />
        </div>
      )}

      {status.type === 'empty' && (
        <Note color="#FF9800">
          查無符合結果。OSM 的門牌資料不完整，可改搜路名或地標，或用下方官方地號查詢取得座標。
        </Note>
      )}
      {status.type === 'error' && <Note color="#F44336">{status.message}</Note>}
      {status.type === 'located' && (
        <Note color="#4CAF50">
          {status.message}
          {status.warn && <span className="block" style={{ color: '#FF9800' }}>{status.warn}</span>}
        </Note>
      )}
      {status.type === 'results' && status.houseNotFound && (
        <Note color="#FF9800">OSM 查無此門牌，以下是同名道路（定位在路段中心）。</Note>
      )}
      {status.type === 'results' && (
        <ul className="mt-2 space-y-1">
          {status.items.map(p => {
            const k = KIND_LABEL[p.kind];
            return (
              <li key={p.id}>
                <button
                  onClick={() => pick(p)}
                  title={`${p.title}${p.detail ? `\n${p.detail}` : ''}`}
                  className="w-full text-left px-2 py-1.5 rounded transition-colors hover:border-[#444]"
                  style={{ background: '#161616', border: '1px solid #262626' }}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[8px] px-1 rounded shrink-0"
                      style={{ color: k.color, border: `1px solid ${k.color}66` }}
                    >
                      {k.text}
                    </span>
                    <span className="text-[10px] truncate" style={{ color: '#DDD' }}>{p.title}</span>
                  </span>
                  {p.detail && (
                    <span className="text-[9px] block truncate mt-0.5" style={{ color: '#666' }}>{p.detail}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 官方地號查詢：國土測繪中心的地號定位 API 需申請，這裡改連到官方地圖 */}
      <a
        href={NLSC_MAP_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2.5 flex items-center justify-between px-2 py-1.5 rounded text-[10px] hover:opacity-80"
        style={{ background: 'rgba(200,168,75,0.08)', color: '#C8A84B', border: '1px solid rgba(200,168,75,0.2)' }}
      >
        <span>地號查詢 · 國土測繪圖資服務雲</span>
        <span aria-hidden>↗</span>
      </a>
      <div className="text-[9px] mt-1 px-0.5 leading-snug" style={{ color: '#555' }}>
        查到地號後，把該處座標貼到上方欄位（經緯度或 TWD97 皆可）
      </div>
      <div className="text-[8px] mt-1.5 px-0.5 leading-snug" style={{ color: '#444' }}>
        地址搜尋 ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:opacity-80">
          OpenStreetMap
        </a>{' '}
        貢獻者 · 搜尋文字會送到 OSM Nominatim
      </div>
    </Section>
  );
};
