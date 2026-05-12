import React from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings } from '../types';

interface ElevProfileLayerProps {
  settings: MapSettings;
  elevPts: { lat: number; lng: number }[];
}

export const ElevProfileLayer: React.FC<ElevProfileLayerProps> = ({ settings, elevPts }) => {
  if (!settings.showElevProfile || elevPts.length === 0) return null;

  return (
    <>
      {/* ── 高程剖面端點 ── */}
      {elevPts.map((p, i) => (
        <Entity key={`ep-${i}`} position={Cartesian3.fromDegrees(p.lng, p.lat, 6)}>
          <PointGraphics pixelSize={10} color={Color.fromCssColorString('#8BC34A')} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics
            text={i === 0 ? 'A' : 'B'}
            font="bold 13px sans-serif"
            fillColor={Color.fromCssColorString('#CDDC39')}
            outlineColor={Color.fromBytes(0, 0, 0, 220)}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            pixelOffset={new Cartesian2(0, -20)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {elevPts.length === 2 && (
        <Entity>
          <PolylineGraphics
            positions={[
              Cartesian3.fromDegrees(elevPts[0].lng, elevPts[0].lat, 4),
              Cartesian3.fromDegrees(elevPts[1].lng, elevPts[1].lat, 4),
            ]}
            width={2}
            material={Color.fromCssColorString('#8BC34A').withAlpha(0.7)}
          />
        </Entity>
      )}
    </>
  );
};
