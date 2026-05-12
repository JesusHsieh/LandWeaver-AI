import React from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings } from '../types';
import { haversineM, fmtDist } from '../utils/geo';

interface MeasureLayerProps {
  settings: MapSettings;
  measurePts: { lat: number; lng: number }[];
}

export const MeasureLayer: React.FC<MeasureLayerProps> = ({ settings, measurePts }) => {
  if (!settings.showMeasureTool || measurePts.length < 1) return null;

  const segDists = measurePts.slice(1).map((p, i) =>
    haversineM(measurePts[i].lat, measurePts[i].lng, p.lat, p.lng));
  const totalDist = segDists.reduce((s, d) => s + d, 0);

  return (
    <>
      {measurePts.map((p, i) => (
        <Entity key={`mp-${i}`} position={Cartesian3.fromDegrees(p.lng, p.lat, 6)}>
          <PointGraphics
            pixelSize={i === 0 ? 12 : 10}
            color={Color.fromCssColorString(i === 0 ? '#FF6B35' : '#00BCD4')}
            outlineColor={Color.WHITE} outlineWidth={2}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {measurePts.length >= 2 && (
        <Entity>
          <PolylineGraphics
            positions={measurePts.map(p => Cartesian3.fromDegrees(p.lng, p.lat, 4))}
            width={2.5}
            material={Color.fromCssColorString('#00BCD4').withAlpha(0.85)}
          />
        </Entity>
      )}
      {measurePts.slice(1).map((p, i) => (
        <Entity key={`msl-${i}`} position={Cartesian3.fromDegrees(
          (measurePts[i].lng + p.lng) / 2,
          (measurePts[i].lat + p.lat) / 2, 10
        )}>
          <LabelGraphics
            text={fmtDist(segDists[i])}
            font="11px monospace"
            fillColor={Color.fromCssColorString('#B2EBF2')}
            outlineColor={Color.fromBytes(0, 0, 0, 220)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            showBackground={true}
            backgroundColor={Color.fromBytes(0, 30, 40, 190)}
            backgroundPadding={new Cartesian2(5, 3)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {measurePts.length >= 2 && (
        <Entity position={Cartesian3.fromDegrees(
          measurePts[measurePts.length - 1].lng,
          measurePts[measurePts.length - 1].lat, 14
        )}>
          <LabelGraphics
            text={`📏 ${fmtDist(totalDist)}`}
            font="bold 14px monospace"
            fillColor={Color.fromCssColorString('#00E5FF')}
            outlineColor={Color.fromBytes(0, 0, 0, 240)}
            outlineWidth={4}
            style={LabelStyle.FILL_AND_OUTLINE}
            showBackground={true}
            backgroundColor={Color.fromBytes(0, 20, 30, 210)}
            backgroundPadding={new Cartesian2(10, 5)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
            pixelOffset={new Cartesian2(0, -22) as any}
          />
        </Entity>
      )}
    </>
  );
};
