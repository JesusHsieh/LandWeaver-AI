import React from 'react';
import { Entity, PointGraphics, EllipseGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';

interface AnalysisLayersProps {
  settings: MapSettings;
  landscapeData: LandscapeDesignData | null;
  ndviFeatures: { lat: number; lng: number }[];
  buildingGrid: { lat: number; lng: number; count: number }[];
}

export const AnalysisLayers: React.FC<AnalysisLayersProps> = ({
  settings,
  landscapeData,
  ndviFeatures,
  buildingGrid,
}) => {
  if (!settings.analysisPoint) return null;

  return (
    <>
      {/* ── 不透水面概略 (熱指數計算圈) ── */}
      {settings.showImperviousLayer && landscapeData && (
        <>
          {[0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const hi = landscapeData.urbanStress.surfaceHeatIndex;
            const radius = 60 + hi * 350 * frac;
            const alpha = hi * 0.22 * (1.2 - frac);
            const r = Math.round(255 * Math.min(hi * 1.4, 1));
            const g = Math.round(80 * (1 - hi));
            return (
              <Entity key={`imp-${i}`} position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat, 2)}>
                <EllipseGraphics
                  semiMajorAxis={radius}
                  semiMinorAxis={radius}
                  material={Color.fromBytes(r, g, 30, Math.round(alpha * 255))}
                  heightReference={1}
                />
              </Entity>
            );
          })}
          <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat + 0.004, 10)}>
            <LabelGraphics
              text={`不透水面 ≈ ${(landscapeData.urbanStress.surfaceHeatIndex * 100).toFixed(0)}%`}
              font="bold 12px sans-serif"
              fillColor={Color.fromCssColorString('#FF7043')}
              outlineColor={Color.fromBytes(0, 0, 0, 220)}
              outlineWidth={3}
              style={LabelStyle.FILL_AND_OUTLINE}
              showBackground={true}
              backgroundColor={Color.fromBytes(25, 10, 5, 185)}
              backgroundPadding={new Cartesian2(8, 4)}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        </>
      )}

      {/* ── 綠覆 NDVI 概略 (OSM 綠地節點) ── */}
      {settings.showNdviLayer && ndviFeatures.map((f, i) => (
        <Entity key={`ndvi-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 4)}>
          <PointGraphics
            pixelSize={6}
            color={Color.fromCssColorString('#4CAF50').withAlpha(0.7)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {settings.showNdviLayer && ndviFeatures.length > 0 && (
        <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat - 0.004, 10)}>
          <LabelGraphics
            text={`🌿 綠覆節點 ${ndviFeatures.length} 處 (半徑 ~900m)`}
            font="bold 12px sans-serif"
            fillColor={Color.fromCssColorString('#66BB6A')}
            outlineColor={Color.fromBytes(0, 0, 0, 220)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            showBackground={true}
            backgroundColor={Color.fromBytes(5, 20, 5, 185)}
            backgroundPadding={new Cartesian2(8, 4)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      )}

      {/* ── 建物密度熱區 (5×5 格網) ── */}
      {settings.showBuildingDensity && buildingGrid.map((cell, i) => {
        const maxCount = Math.max(...buildingGrid.map(c => c.count), 1);
        const ratio = cell.count / maxCount;
        const radius = 40 + ratio * 120;
        const alpha = 0.12 + ratio * 0.28;
        return (
          <Entity key={`bd-${i}`} position={Cartesian3.fromDegrees(cell.lng, cell.lat, 2)}>
            <EllipseGraphics
              semiMajorAxis={radius}
              semiMinorAxis={radius}
              material={Color.fromBytes(255, Math.round(152 * (1 - ratio)), 0, Math.round(alpha * 255))}
              heightReference={1}
            />
          </Entity>
        );
      })}
      {settings.showBuildingDensity && buildingGrid.length > 0 && (
        <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat + 0.005, 10)}>
          <LabelGraphics
            text={`🏙 建物密度 · ${buildingGrid.reduce((s, c) => s + c.count, 0)} 棟 (格網)`}
            font="bold 12px sans-serif"
            fillColor={Color.fromCssColorString('#FF9800')}
            outlineColor={Color.fromBytes(0, 0, 0, 220)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            showBackground={true}
            backgroundColor={Color.fromBytes(25, 15, 0, 185)}
            backgroundPadding={new Cartesian2(8, 4)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      )}
    </>
  );
};
