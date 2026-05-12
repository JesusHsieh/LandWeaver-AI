import React from 'react';
import { ImageryLayer } from 'resium';
import { WebMapServiceImageryProvider } from 'cesium';
import { MapSettings } from '../types';

interface RegulatoryLayersProps {
  settings: MapSettings;
  nlscUrbanPlanProvider: WebMapServiceImageryProvider;
  cgsLiquefactionProvider: WebMapServiceImageryProvider;
  cgsDebrisProvider: WebMapServiceImageryProvider;
  cgsFaultProvider: WebMapServiceImageryProvider;
  wraFloodProvider: WebMapServiceImageryProvider;
  cgsSlopeProvider: WebMapServiceImageryProvider;
}

export const RegulatoryLayers: React.FC<RegulatoryLayersProps> = ({
  settings,
  nlscUrbanPlanProvider,
  cgsLiquefactionProvider,
  cgsDebrisProvider,
  cgsFaultProvider,
  wraFloodProvider,
  cgsSlopeProvider,
}) => {
  return (
    <>
      {/* 08A · 都市計畫色塊 (NLSC LUIMAP) */}
      {settings.showUrbanPlan && (
        <ImageryLayer imageryProvider={nlscUrbanPlanProvider} alpha={0.65} />
      )}
      {/* 08B · 地盤液化潛勢 (CGS 2021) */}
      {settings.showLiquefaction && (
        <ImageryLayer imageryProvider={cgsLiquefactionProvider} alpha={0.70} />
      )}
      {/* 08C · 崩塌地/土石流相關 (CGS DebrisSlide 2013) */}
      {settings.showDebrisFlow && (
        <ImageryLayer imageryProvider={cgsDebrisProvider} alpha={0.72} />
      )}
      {/* 08D · 活動斷層地質敏感區 (CGS) */}
      {settings.showActiveFault && (
        <ImageryLayer imageryProvider={cgsFaultProvider} alpha={0.75} />
      )}
      {/* 08E · 淹水潛勢 (WRA 114年) */}
      {settings.showFloodPotential && (
        <ImageryLayer imageryProvider={wraFloodProvider} alpha={0.65} />
      )}
      {/* 08F · 山崩/地滑地質敏感區 (CGS) */}
      {settings.showSlopeSensitive && (
        <ImageryLayer imageryProvider={cgsSlopeProvider} alpha={0.70} />
      )}
    </>
  );
};
