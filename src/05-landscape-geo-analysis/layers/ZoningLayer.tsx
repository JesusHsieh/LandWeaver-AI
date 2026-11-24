import React from 'react';
import { Entity, PolylineGraphics, LabelGraphics, BillboardGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle, HorizontalOrigin } from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';

interface ZoningLayerProps {
  settings: MapSettings;
  landscapeData: LandscapeDesignData | null;
}

// Inline icon: the Iconify icon this used (material-symbols:square-rounded) now 404s.
// White square, tinted per zone by the billboard `color`.
const ZONE_ICON = 'data:image/svg+xml,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect x='4' y='4' width='56' height='56' rx='12' fill='white'/></svg>",
);

function getZoningColor(cat: string): Color {
  switch(cat) {
    case '高熱曝曬區': return Color.ORANGERED;
    case '陰影區': return Color.NAVY;
    case '乾陰區': return Color.BROWN;
    case '潮濕積水區': return Color.AQUA;
    case '強風區': return Color.GHOSTWHITE;
    case '高溫低地區': return Color.CRIMSON;
    default: return Color.LIME;
  }
}

/** 由基地往 bearing（0=N 順時針）方向 distance 公尺的地面點 */
function offsetPoint(lat: number, lng: number, bearing: number, distance: number, height = 5): Cartesian3 {
  const rad = bearing * Math.PI / 180;
  const latOffset = (distance / 111320) * Math.cos(rad);
  const lngOffset = (distance / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(rad);
  return Cartesian3.fromDegrees(lng + lngOffset, lat + latOffset, height);
}

const COMPASS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];

export const ZoningLayer: React.FC<ZoningLayerProps> = ({ settings, landscapeData }) => {
  if (!settings.analysisPoint) return null;
  const { lat, lng } = settings.analysisPoint;
  const zoning = landscapeData?.zoning ?? null;
  const flow = landscapeData?.drainage.flowDirection ?? null;
  const stress = landscapeData?.urbanStress;
  const drainage = landscapeData?.drainage;

  return (
    <>
      {/* 微氣候分區：資料只有基地一點，因此只標示基地本身的分類 */}
      {settings.showZoning && zoning && (
        <Entity position={Cartesian3.fromDegrees(lng, lat, 10)}>
          <BillboardGraphics
            image={ZONE_ICON}
            width={64}
            height={64}
            scale={0.5}
            color={getZoningColor(zoning.category).withAlpha(0.4)}
          />
          <LabelGraphics
            text={zoning.category}
            font="bold 14px sans-serif"
            fillColor={getZoningColor(zoning.category)}
            outlineColor={Color.fromBytes(0, 0, 0, 230)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            pixelOffset={new Cartesian2(0, 24)}
            showBackground={true}
            backgroundColor={Color.BLACK.withAlpha(0.65)}
            backgroundPadding={new Cartesian2(8, 4)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      )}

      {settings.showUrbanStress && stress && (
        <Entity position={Cartesian3.fromDegrees(lng, lat, 20)}>
          <LabelGraphics
            text={[
              stress.surfaceTemp === null ? '🌡 地表溫度：無資料' : `🌡 地表溫度 ${stress.surfaceTemp.toFixed(1)} °C（模式值）`,
              stress.windySlope === null ? '風環境：無資料'
                : stress.windySlope ? '⚠ 強風坡地（風速 >5 m/s、坡度 >10%）'
                : stress.stagnantLowland ? '⚠ 低風速平坦低地（通風可能不良）'
                : '✓ 無強風坡地、低風速低地條件',
            ].join('\n')}
            font="bold 13px sans-serif"
            fillColor={(stress.surfaceTemp ?? 0) > 38
              ? Color.fromCssColorString('#FF7043')
              : Color.fromCssColorString('#FFD54F')}
            outlineColor={Color.fromBytes(0, 0, 0, 240)}
            outlineWidth={4}
            style={LabelStyle.FILL_AND_OUTLINE}
            pixelOffset={new Cartesian2(60, 0)}
            horizontalOrigin={HorizontalOrigin.LEFT}
            showBackground={true}
            backgroundColor={Color.fromBytes(20, 10, 0, 200)}
            backgroundPadding={new Cartesian2(10, 6)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      )}

      {/* 地表逕流方向 = DEM 下坡方向；平坦時不畫箭頭 */}
      {settings.showHydrology && flow !== null && (
        <>
          <Entity>
            <PolylineGraphics
              positions={[Cartesian3.fromDegrees(lng, lat, 5), offsetPoint(lat, lng, flow, 200)]}
              width={5}
              material={Color.AQUA.withAlpha(0.6)}
            />
          </Entity>
          <Entity position={offsetPoint(lat, lng, flow, 220)}>
            <LabelGraphics
              text={`→ 地表逕流向${COMPASS[Math.round(flow / 45) % 8]}（下坡方向）`}
              font="bold 15px sans-serif"
              fillColor={Color.fromCssColorString('#00E5FF')}
              outlineColor={Color.fromBytes(0, 20, 30, 230)}
              outlineWidth={3}
              style={LabelStyle.FILL_AND_OUTLINE}
              showBackground={true}
              backgroundColor={Color.fromBytes(0, 20, 30, 180)}
              backgroundPadding={new Cartesian2(9, 5)}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        </>
      )}

      {settings.showSoilAnalysis && drainage && (
        <Entity position={Cartesian3.fromDegrees(lng, lat, 5)}>
          <LabelGraphics
            text={`💧 地表排水（依坡度）：${drainage.speed ?? '無資料'}  積水風險：${drainage.waterloggingRisk ?? '無資料'}`}
            font="bold 13px sans-serif"
            fillColor={drainage.waterloggingRisk === '高'
              ? Color.fromCssColorString('#EF9A9A')
              : Color.fromCssColorString('#80DEEA')}
            outlineColor={Color.fromBytes(0, 0, 0, 230)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            pixelOffset={new Cartesian2(-110, 55)}
            showBackground={true}
            backgroundColor={Color.BLACK.withAlpha(0.7)}
            backgroundPadding={new Cartesian2(9, 5)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      )}
    </>
  );
};
