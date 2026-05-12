import React from 'react';
import { Entity, EllipseGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle } from 'cesium';
import { MapSettings } from '../types';

interface BufferLayerProps {
  settings: MapSettings;
}

export const BufferLayer: React.FC<BufferLayerProps> = ({ settings }) => {
  if (!settings.analysisPoint || settings.bufferRadius === 0) return null;

  return (
    <>
      {/* ── Buffer 半徑圈 ── */}
      {([100, 300, 500, 800] as const)
        .filter(r => r <= settings.bufferRadius)
        .map(r => (
          <Entity key={`buf-${r}`} position={Cartesian3.fromDegrees(settings.analysisPoint!.lng, settings.analysisPoint!.lat, 1)}>
            <EllipseGraphics
              semiMajorAxis={r}
              semiMinorAxis={r}
              material={Color.fromCssColorString('#00BCD4').withAlpha(0.06)}
              outline={true}
              outlineColor={Color.fromCssColorString('#00BCD4').withAlpha(0.55)}
              outlineWidth={1.5}
              heightReference={1 /* CLAMP_TO_GROUND */}
            />
          </Entity>
        ))
      }
      {/* Buffer ring labels */}
      {([100, 300, 500, 800] as const)
        .filter(r => r <= settings.bufferRadius)
        .map(r => {
          const offsetLng = settings.analysisPoint!.lng + r / (111320 * Math.cos(settings.analysisPoint!.lat * Math.PI / 180));
          return (
            <Entity key={`buf-lbl-${r}`} position={Cartesian3.fromDegrees(offsetLng, settings.analysisPoint!.lat, 8)}>
              <LabelGraphics
                text={`${r}m`}
                font="bold 11px monospace"
                fillColor={Color.fromCssColorString('#00BCD4')}
                outlineColor={Color.fromBytes(0, 0, 0, 200)}
                outlineWidth={3}
                style={LabelStyle.FILL_AND_OUTLINE}
                showBackground={true}
                backgroundColor={Color.fromBytes(0, 20, 25, 170)}
                backgroundPadding={new Cartesian2(5, 3)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
              />
            </Entity>
          );
        })
      }
    </>
  );
};
