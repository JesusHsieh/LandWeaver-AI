import React from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Cartesian2, Color, LabelStyle, VerticalOrigin } from 'cesium';
import { MapSettings } from '../types';
import { GISService } from '../services/gisService';

interface SolarLayerProps {
  settings: MapSettings;
}

function getSunCartesian(lat: number, lng: number, azimuth: number, altitude: number, distance: number): Cartesian3 {
  const azimuthRad = (90 - azimuth) * (Math.PI / 180);
  const altRad = altitude * (Math.PI / 180);
  const hDist = distance * Math.cos(altRad);
  const vDist = distance * Math.sin(altRad);
  const latOffset = (hDist / 111320) * Math.sin(azimuthRad);
  const lngOffset = (hDist / (111320 * Math.cos(lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
  return Cartesian3.fromDegrees(lng + lngOffset, lat + latOffset, vDist + 10);
}

function getSolarLinePositions(settings: MapSettings, distance = 400): Cartesian3[] {
  if (!settings.analysisPoint) return [];
  const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
  const azimuthRad = (90 - sunPos.azimuth) * (Math.PI / 180);
  const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2);
  const latOffset = (distance / 111320) * Math.sin(azimuthRad);
  const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
  const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 2);
  return [start, end];
}

function getCompassPosition(settings: MapSettings, azimuth: number, distance = 400): Cartesian3 {
  if (!settings.analysisPoint) return Cartesian3.ZERO;
  const azimuthRad = (90 - azimuth) * (Math.PI / 180);
  const latOffset = (distance / 111320) * Math.sin(azimuthRad);
  const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
  return Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
}

export const SolarLayer: React.FC<SolarLayerProps> = ({ settings }) => {
  if (!settings.analysisPoint) return null;

  const solarPathPoints = GISService.getSolarPath(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
  const solarPathPositions = solarPathPoints.map(p =>
    getSunCartesian(settings.analysisPoint!.lat, settings.analysisPoint!.lng, p.azimuth, p.altitude, 400)
  );
  const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
  const sunActualPos = getSunCartesian(settings.analysisPoint.lat, settings.analysisPoint.lng, sunPos.azimuth, sunPos.altitude, 400);

  return (
    <>
      {/* Compass Ring and Labels */}
      {(['N', 'S', 'E', 'W'] as const).map((dir, i) => (
        <Entity key={dir} position={getCompassPosition(settings, [0, 180, 90, 270][i], 420)}>
          <LabelGraphics
            text={dir}
            font="bold 20px sans-serif"
            fillColor={Color.WHITE}
            outlineColor={Color.fromBytes(0, 0, 0, 230)}
            outlineWidth={4}
            style={LabelStyle.FILL_AND_OUTLINE}
            verticalOrigin={VerticalOrigin.CENTER}
            showBackground={true}
            backgroundColor={Color.BLACK.withAlpha(0.55)}
            backgroundPadding={new Cartesian2(7, 4)}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
          />
        </Entity>
      ))}
      {/* Main Compass Circle */}
      <Entity>
        <PolylineGraphics
          positions={Array.from({ length: 37 }).map((_, i) => getCompassPosition(settings, i * 10, 400))}
          width={1.5}
          material={Color.WHITE.withAlpha(0.3)}
        />
      </Entity>

      {/* Solar Path Arc */}
      {settings.showShadows && (
        <>
          <Entity>
            <PolylineGraphics
              positions={solarPathPositions}
              width={2}
              material={Color.ORANGE.withAlpha(0.7)}
            />
          </Entity>
          {/* Azimuth ground-projection line */}
          <Entity>
            <PolylineGraphics
              positions={getSolarLinePositions(settings, 400)}
              width={3}
              material={Color.ORANGE.withAlpha(0.5)}
            />
          </Entity>

          {/* Hour Markers along path */}
          {solarPathPoints.map((p, i) => (
            <Entity key={`marker-${i}`} position={solarPathPositions[i]}>
              <PointGraphics pixelSize={7} color={Color.ORANGE} outlineColor={Color.BLACK} outlineWidth={1.5} />
              <LabelGraphics
                text={p.hourLabel}
                font="bold 14px sans-serif"
                fillColor={Color.fromCssColorString('#FFB300')}
                outlineColor={Color.fromBytes(0, 0, 0, 220)}
                outlineWidth={3}
                style={LabelStyle.FILL_AND_OUTLINE}
                pixelOffset={new Cartesian2(0, -18)}
                showBackground={true}
                backgroundColor={Color.BLACK.withAlpha(0.6)}
                backgroundPadding={new Cartesian2(6, 3)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
              />
            </Entity>
          ))}

          {/* Actual Sun position in 3D */}
          <Entity position={sunActualPos}>
            <PointGraphics pixelSize={24} color={Color.YELLOW} outlineColor={Color.ORANGE} outlineWidth={3} />
            <PolylineGraphics
              positions={[Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2), sunActualPos]}
              width={2}
              material={Color.YELLOW.withAlpha(0.4)}
            />
            <LabelGraphics
              text={`☀ 方位角 ${sunPos.azimuth.toFixed(1)}°`}
              font="bold 15px sans-serif"
              fillColor={Color.fromCssColorString('#FFE57F')}
              outlineColor={Color.fromBytes(0, 0, 0, 240)}
              outlineWidth={4}
              style={LabelStyle.FILL_AND_OUTLINE}
              verticalOrigin={VerticalOrigin.BOTTOM}
              pixelOffset={new Cartesian2(0, -30)}
              showBackground={true}
              backgroundColor={Color.fromBytes(40, 30, 0, 185)}
              backgroundPadding={new Cartesian2(10, 5)}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        </>
      )}
    </>
  );
};
