import React from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics, BillboardGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle, HorizontalOrigin } from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';

interface ZoningLayerProps {
  settings: MapSettings;
  landscapeData: LandscapeDesignData | null;
}

function getZoningColor(cat: string): Color {
  switch(cat) {
    case '高熱曝曬區': return Color.ORANGERED;
    case '陰影區': return Color.NAVY;
    case '乾陰區': return Color.BROWN;
    case '潮濕積水區': return Color.AQUA;
    case '強風區': return Color.GHOSTWHITE;
    case '都市熱島區': return Color.CRIMSON;
    default: return Color.LIME;
  }
}

function getFlowArrowPositions(settings: MapSettings, distance = 150): Cartesian3[] {
  if (!settings.analysisPoint) return [];
  const angle = (settings.analysisPoint.lat + settings.analysisPoint.lng) * 1000 % 360;
  const angleRad = (90 - angle) * (Math.PI / 180);
  const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5);
  const latOffset = (distance / 111320) * Math.sin(angleRad);
  const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(angleRad);
  const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
  return [start, end];
}

export const ZoningLayer: React.FC<ZoningLayerProps> = ({ settings, landscapeData }) => {
  if (!settings.analysisPoint) return null;

  const zoningGrid = Array.from({ length: 9 }).map((_, i) => {
    const r = Math.floor(i / 3) - 1;
    const c = (i % 3) - 1;
    const lat = settings.analysisPoint!.lat + r * 0.0008;
    const lng = settings.analysisPoint!.lng + c * 0.0008;
    const seed = lat + lng;
    const pseudoRand = (offset: number) => Math.abs(Math.sin(seed + offset));
    const cats = ['高熱曝曬區', '半日照區', '陰影區', '強風區', '都市熱島區', '潮濕積水區', '乾陰區'];
    const cat = cats[Math.floor(pseudoRand(10) * cats.length)];
    return { lat, lng, cat };
  });

  return (
    <>
      {/* Landscape Decision Layers */}
      {settings.showZoning && zoningGrid.map((z, i) => (
        <Entity key={`zone-${i}`} position={Cartesian3.fromDegrees(z.lng, z.lat, 10)}>
          <BillboardGraphics
            image={`https://api.iconify.design/material-symbols:square-rounded.svg?color=${getZoningColor(z.cat).toCssColorString().replace('#', '%23')}`}
            width={64}
            height={64}
            scale={0.5}
            color={getZoningColor(z.cat).withAlpha(0.4)}
          />
          <LabelGraphics
            text={z.cat}
            font="bold 14px sans-serif"
            fillColor={getZoningColor(z.cat)}
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
      ))}

      {settings.showUrbanStress && landscapeData && (
        <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 20)}>
          <LabelGraphics
            text={[
              `🌡 表面溫度: ${landscapeData.urbanStress.surfaceTemp.toFixed(1)} °C`,
              `☀ 熱指數: ${(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)}%  Albedo: ${landscapeData.urbanStress.albedo.toFixed(2)}`,
              landscapeData.urbanStress.canyonEffect  ? '⚠ 街谷風效應明顯' : '✓ 街道風場正常',
              landscapeData.urbanStress.downdraftRisk ? '⚠ 高壓風切 Downdraft 風險' : '✓ 垂直風量穩定',
            ].join('\n')}
            font="bold 13px sans-serif"
            fillColor={landscapeData.urbanStress.surfaceTemp > 38
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
          <PointGraphics
            pixelSize={100}
            color={(landscapeData.urbanStress.surfaceTemp > 38 ? Color.RED : Color.ORANGE).withAlpha(0.18)}
          />
        </Entity>
      )}

      {settings.showHydrology && (
        <>
          <Entity>
            <PolylineGraphics
              positions={getFlowArrowPositions(settings, 200)}
              width={5}
              material={Color.AQUA.withAlpha(0.6)}
            />
          </Entity>
          <Entity position={getFlowArrowPositions(settings, 220)[1]}>
            <LabelGraphics
              text="→ 地表逕流向"
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

      {settings.showSoilAnalysis && landscapeData && (
        <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
          <LabelGraphics
            text={`💧 滲透率: ${landscapeData.soil.infiltrationRate.toFixed(1)} mm/hr  排水: ${landscapeData.soil.drainageSpeed}  積水風險: ${landscapeData.soil.waterloggingRisk}`}
            font="bold 13px sans-serif"
            fillColor={landscapeData.soil.waterloggingRisk === '高'
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
