import React from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings } from '../types';
import { RoadFeature, RoadKind } from '../hooks/useRoadLayer';
import { PoiFeature, PoiCat, PoiStats } from '../hooks/usePoiLayer';
import { haversineM } from '../utils/geo';

interface RoadPoiLayerProps {
  settings: MapSettings;
  roadFeatures: RoadFeature[];
  poiFeatures: PoiFeature[];
  poiStats: PoiStats | null;
}

export const RoadPoiLayer: React.FC<RoadPoiLayerProps> = ({
  settings,
  roadFeatures,
  poiFeatures,
  poiStats,
}) => {
  if (!settings.analysisPoint) return null;

  return (
    <>
      {/* ── 道路分級 ── */}
      {settings.showRoadLayer && roadFeatures.map((road, i) => {
        const roadColor: Record<RoadKind, string> = {
          trunk: '#E53935', primary: '#FF7043', secondary: '#FFA726',
          tertiary: '#FFD54F', residential: '#78909C',
        };
        const roadWidth: Record<RoadKind, number> = {
          trunk: 5, primary: 4, secondary: 3, tertiary: 2, residential: 1.5,
        };
        const positions = road.pts.map(p => Cartesian3.fromDegrees(p.lng, p.lat, 2));
        return (
          <Entity key={`road-${i}`}>
            <PolylineGraphics
              positions={positions}
              width={roadWidth[road.kind]}
              material={Color.fromCssColorString(roadColor[road.kind]).withAlpha(0.75)}
              clampToGround
              arcType={0}
            />
          </Entity>
        );
      })}
      {/* 道路名稱 + 壓力標籤（primary 以上才顯示） */}
      {settings.showRoadLayer && roadFeatures
        .filter(r => (r.kind === 'primary' || r.kind === 'trunk' || r.kind === 'secondary') && r.name)
        .filter((_, i) => i < 20)
        .map((road, i) => {
          const mid = road.pts[Math.floor(road.pts.length / 2)];
          const stressLabel: Record<RoadKind, string> = {
            trunk: '快速道路 ⬛高流量', primary: '主幹道 🔴高流量',
            secondary: '次幹道 🟡中流量', tertiary: '地方道 🟢低流量', residential: '住宅路',
          };
          return (
            <Entity key={`rlabel-${i}`} position={Cartesian3.fromDegrees(mid.lng, mid.lat, 8)}>
              <LabelGraphics
                text={`${road.name}  ${stressLabel[road.kind]}`}
                font="10px sans-serif"
                fillColor={Color.fromCssColorString('#FFFDE7')}
                outlineColor={Color.fromBytes(0, 0, 0, 200)}
                outlineWidth={2}
                style={LabelStyle.FILL_AND_OUTLINE}
                showBackground
                backgroundColor={Color.fromBytes(20, 20, 20, 160)}
                backgroundPadding={new Cartesian2(5, 3)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
                distanceDisplayCondition={{ near: 0, far: 800 } as any}
              />
            </Entity>
          );
        })}

      {/* ── 生活機能 POI ── */}
      {settings.showPoiLayer && poiFeatures.map((poi, i) => {
        const catColor: Record<PoiCat, string> = {
          school: '#4FC3F7', park: '#81C784', market: '#FFB74D',
          medical: '#F48FB1', bus: '#CE93D8', public: '#80CBC4',
        };
        const catEmoji: Record<PoiCat, string> = {
          school: '🎓', park: '🌿', market: '🛒',
          medical: '🏥', bus: '🚌', public: '🏛',
        };
        const within500 = haversineM(settings.analysisPoint!.lat, settings.analysisPoint!.lng, poi.lat, poi.lng) <= 500;
        return (
          <Entity key={`poi-${i}`} position={Cartesian3.fromDegrees(poi.lng, poi.lat, 5)}>
            <PointGraphics
              pixelSize={within500 ? 8 : 5}
              color={Color.fromCssColorString(catColor[poi.cat]).withAlpha(within500 ? 0.9 : 0.5)}
              outlineColor={Color.fromBytes(0, 0, 0, 160)}
              outlineWidth={1}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
            {poi.name && within500 && (
              <LabelGraphics
                text={`${catEmoji[poi.cat]} ${poi.name}`}
                font="10px sans-serif"
                fillColor={Color.fromCssColorString(catColor[poi.cat])}
                outlineColor={Color.fromBytes(0, 0, 0, 220)}
                outlineWidth={2}
                style={LabelStyle.FILL_AND_OUTLINE}
                showBackground
                backgroundColor={Color.fromBytes(10, 10, 20, 180)}
                backgroundPadding={new Cartesian2(5, 3)}
                pixelOffset={new Cartesian2(0, -14)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
                distanceDisplayCondition={{ near: 0, far: 600 } as any}
              />
            )}
          </Entity>
        );
      })}
      {/* 500m 生活圈統計標籤 */}
      {settings.showPoiLayer && poiStats && (() => {
        const catEmoji: Record<PoiCat, string> = {
          school: '🎓', park: '🌿', market: '🛒',
          medical: '🏥', bus: '🚌', public: '🏛',
        };
        const lines = (Object.keys(poiStats) as PoiCat[])
          .filter(k => poiStats[k] > 0)
          .map(k => `${catEmoji[k]}${poiStats[k]}`)
          .join('  ');
        return (
          <Entity position={Cartesian3.fromDegrees(
            settings.analysisPoint!.lng,
            settings.analysisPoint!.lat + 0.006, 10
          )}>
            <LabelGraphics
              text={`500m 生活圈  ${lines || '設施稀少'}`}
              font="bold 11px sans-serif"
              fillColor={Color.fromCssColorString('#E0F7FA')}
              outlineColor={Color.fromBytes(0, 0, 0, 220)}
              outlineWidth={3}
              style={LabelStyle.FILL_AND_OUTLINE}
              showBackground
              backgroundColor={Color.fromBytes(0, 40, 55, 200)}
              backgroundPadding={new Cartesian2(10, 5)}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        );
      })()}
    </>
  );
};
