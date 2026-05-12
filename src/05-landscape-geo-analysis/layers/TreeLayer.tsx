import React from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings } from '../types';

type TreeFeature = { lat: number; lng: number; species: string; src: 'tpe' | 'osm' };

interface TreeLayerProps {
  settings: MapSettings;
  treeFeatures: TreeFeature[];
}

export const TreeLayer: React.FC<TreeLayerProps> = ({ settings, treeFeatures }) => {
  if (!settings.analysisPoint) return null;

  return (
    <>
      {/* ── 行道樹 (台北市官方 blob / OSM fallback) ── */}
      {settings.showStreetTreeLayer && treeFeatures.map((t, i) => (
        <Entity key={`tree-${i}`} position={Cartesian3.fromDegrees(t.lng, t.lat, 4)}>
          <PointGraphics
            pixelSize={t.src === 'tpe' ? 6 : 5}
            color={Color.fromCssColorString(t.src === 'tpe' ? '#B5D867' : '#69F0AE').withAlpha(0.82)}
            outlineColor={Color.fromCssColorString('#1B5E20').withAlpha(0.6)}
            outlineWidth={1}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {settings.showStreetTreeLayer && treeFeatures.length > 0 && (() => {
        const tpeCount = treeFeatures.filter(t => t.src === 'tpe').length;
        const srcLabel = tpeCount > 0 ? '台北市官方' : 'OSM';
        return (
          <Entity position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat - 0.005, 10)}>
            <LabelGraphics
              text={`🌳 ${treeFeatures.length} 棵 (${srcLabel})`}
              font="bold 12px sans-serif"
              fillColor={Color.fromCssColorString('#B5D867')}
              outlineColor={Color.fromBytes(0, 0, 0, 220)}
              outlineWidth={3}
              style={LabelStyle.FILL_AND_OUTLINE}
              showBackground={true}
              backgroundColor={Color.fromBytes(10, 30, 5, 185)}
              backgroundPadding={new Cartesian2(8, 4)}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        );
      })()}
    </>
  );
};
