import React, { useEffect, useRef } from 'react';
import { Viewer, Entity, PointGraphics, Cesium3DTileset, ScreenSpaceEventHandler, ScreenSpaceEvent, LabelGraphics } from 'resium';
import {
  Cartesian3, Cartesian2, Color, JulianDate, ShadowMode,
  IonResource,
  ScreenSpaceEventType, LabelStyle, Cesium3DTileStyle,
} from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';
import { GISService } from '../services/gisService';
import { TransportCesiumLayer } from './TransportCesiumLayer';

// Hooks
import { useNdviLayer } from '../hooks/useNdviLayer';
import { useBuildingDensity } from '../hooks/useBuildingDensity';
import { useTreeLayer } from '../hooks/useTreeLayer';
import { useRoadLayer } from '../hooks/useRoadLayer';
import { usePoiLayer } from '../hooks/usePoiLayer';
import { useWaterLayer } from '../hooks/useWaterLayer';
import { useHeritageLayer } from '../hooks/useHeritageLayer';
import { useMeasureTool } from '../hooks/useMeasureTool';
import { useElevProfile } from '../hooks/useElevProfile';
import { useImageryProviders } from '../hooks/useImageryProviders';
import { useCesiumTerrain } from '../hooks/useCesiumTerrain';
import { useMapInteractions } from '../hooks/useMapInteractions';

// Layers
import { BaseImageryLayers } from '../layers/BaseImageryLayers';
import { RegulatoryLayers } from '../layers/RegulatoryLayers';
import { AnalysisLayers } from '../layers/AnalysisLayers';
import { TreeLayer } from '../layers/TreeLayer';
import { RoadPoiLayer } from '../layers/RoadPoiLayer';
import { MeasureLayer } from '../layers/MeasureLayer';
import { ElevProfileLayer } from '../layers/ElevProfileLayer';
import { SolarLayer } from '../layers/SolarLayer';
import { ZoningLayer } from '../layers/ZoningLayer';
import { BufferLayer } from '../layers/BufferLayer';

// Components
import { ElevProfilePanel } from './ElevProfilePanel';
import { haversineM, fmtDist } from '../utils/geo';

interface MapControlProps {
  settings: MapSettings;
  onLocationClick: (lat: number, lng: number) => void;
  landscapeData: LandscapeDesignData | null;
}

export const MapControl: React.FC<MapControlProps> = ({ settings, onLocationClick, landscapeData }) => {
  const viewerRef        = useRef<any>(null);
  const osmTilesetRef    = useRef<any>(null);

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const { ndviFeatures }    = useNdviLayer(settings);
  const { buildingGrid }    = useBuildingDensity(settings);
  const { treeFeatures }    = useTreeLayer(settings);
  const { roadFeatures }    = useRoadLayer(settings);
  const { poiFeatures, poiStats } = usePoiLayer(settings);
  const { waterFeatures }   = useWaterLayer(settings);
  const { heritageFeatures } = useHeritageLayer(settings);
  const { measurePts, setMeasurePts } = useMeasureTool(settings);
  const { elevPts, setElevPts, elevData, setElevData, elevLoading, setElevLoading } = useElevProfile(settings);

  const providers = useImageryProviders();
  const { handleTilesetReady } = useCesiumTerrain(viewerRef, osmTilesetRef, settings);
  const { handleLeftClick } = useMapInteractions(
    viewerRef,
    settings,
    onLocationClick,
    measurePts,
    setMeasurePts,
    { setElevPts, setElevData, setElevLoading }
  );

  // Convert Date to JulianDate for Cesium
  const julianDate = JulianDate.fromDate(settings.currentTime);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.clock.currentTime = julianDate;
      viewer.shadows = settings.showShadows;
      viewer.terrainShadows = settings.showShadows ? ShadowMode.ENABLED : ShadowMode.DISABLED;
    }
  }, [settings.currentTime, settings.showShadows]);

  // Run once after Viewer mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.clock.shouldAnimate = false;
        viewer.scene.verticalExaggeration = 1.0;

        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(121.5644, 25.0339, 1200),
          orientation: {
            heading: 0.0,
            pitch: -0.4,
            roll: 0.0,
          },
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement && settings.selectedBase) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          settings.selectedBase.lng,
          settings.selectedBase.lat,
          viewer.camera.positionCartographic.height || 1000
        ),
        duration: 2
      });
    }
  }, [settings.selectedBase?.lat, settings.selectedBase?.lng]);

  return (
    <div className="w-full h-full relative">
      <Viewer
        ref={viewerRef}
        full
        className="h-full"
        infoBox={false}
        selectionIndicator={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        shadows={settings.showShadows}
        baseLayer={false as any}
      >
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent action={handleLeftClick} type={ScreenSpaceEventType.LEFT_CLICK} />
          <ScreenSpaceEvent action={() => { if (settings.showMeasureTool) setMeasurePts([]); }} type={ScreenSpaceEventType.RIGHT_CLICK} />
        </ScreenSpaceEventHandler>

        {/* Base imagery layers (OSM, NLSC) */}
        <BaseImageryLayers
          settings={settings}
          osmOrigProvider={providers.osmOrigProvider}
          osmDarkProvider={providers.osmDarkProvider}
          osmLightProvider={providers.osmLightProvider}
          nlscEmapProvider={providers.nlscEmapProvider}
          nlscPhotoProvider={providers.nlscPhotoProvider}
          nlscLandSectProvider={providers.nlscLandSectProvider}
          nlscContourProvider={providers.nlscContourProvider}
          nlscHillShadeProvider={providers.nlscHillShadeProvider}
          nlscAdminBoundProvider={providers.nlscAdminBoundProvider}
        />

        {/* Regulatory WMS layers */}
        <RegulatoryLayers
          settings={settings}
          nlscUrbanPlanProvider={providers.nlscUrbanPlanProvider}
          cgsLiquefactionProvider={providers.cgsLiquefactionProvider}
          cgsDebrisProvider={providers.cgsDebrisProvider}
          cgsFaultProvider={providers.cgsFaultProvider}
          wraFloodProvider={providers.wraFloodProvider}
          cgsSlopeProvider={providers.cgsSlopeProvider}
        />

        {/* 08G · 飲用水保護區 — OSM 水庫/水源地 */}
        {settings.showDrinkingWater && waterFeatures.map((f, i) => (
          <Entity key={`dw-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 300)} name={`💧 ${f.name}`}>
            <PointGraphics
              pixelSize={16}
              color={Color.fromCssColorString('#00BCD4').withAlpha(0.9)}
              outlineColor={Color.WHITE}
              outlineWidth={2}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        ))}

        {/* 08H · 文化資產 — OSM historic 節點 */}
        {settings.showCulturalHeritage && heritageFeatures.map((f, i) => (
          <Entity key={`ch-${i}`} position={Cartesian3.fromDegrees(f.lng, f.lat, 300)} name={`🏛 ${f.name}`}>
            <PointGraphics
              pixelSize={13}
              color={Color.fromCssColorString('#9C27B0').withAlpha(0.95)}
              outlineColor={Color.fromCssColorString('#E1BEE7')}
              outlineWidth={2}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
            />
          </Entity>
        ))}

        {/* OSM 3D Buildings */}
        {settings.showOsmBuildings && (
          <Cesium3DTileset
            url={IonResource.fromAssetId(96188)}
            onReady={handleTilesetReady}
            style={new Cesium3DTileStyle({
              color: `color('hsl(${settings.osmBuildingHue},45%,62%)', ${settings.osmBuildingOpacity})`,
            })}
          />
        )}

        {/* Selected Base Indicator */}
        {settings.selectedBase && (
          <Entity
            position={Cartesian3.fromDegrees(settings.selectedBase.lng, settings.selectedBase.lat)}
            name={settings.selectedBase.name}
          >
            <PointGraphics pixelSize={10} color={Color.fromCssColorString('#3498DB')} outlineColor={Color.WHITE} outlineWidth={2} />
          </Entity>
        )}

        {/* Google Photorealistic 3D Tiles */}
        {settings.showGoogle3DTiles && (
          <Cesium3DTileset url={IonResource.fromAssetId(2275207)} shadows={settings.showShadows ? ShadowMode.ENABLED : ShadowMode.DISABLED} />
        )}

        {/* Analysis and decision layers — only rendered when analysisPoint is set */}
        {settings.analysisPoint && (
          <>
            {/* Solar path, compass, sun disc */}
            <SolarLayer settings={settings} />

            {/* Zoning grid, flow arrows, hydrology, soil analysis, urban stress */}
            <ZoningLayer settings={settings} landscapeData={landscapeData} />

            {/* Buffer circles */}
            <BufferLayer settings={settings} />

            {/* Measure tool */}
            <MeasureLayer settings={settings} measurePts={measurePts} />

            {/* Elevation profile endpoints */}
            <ElevProfileLayer settings={settings} elevPts={elevPts} />

            {/* NDVI dots, building density, impervious layer */}
            <AnalysisLayers settings={settings} landscapeData={landscapeData} ndviFeatures={ndviFeatures} buildingGrid={buildingGrid} />

            {/* Street trees */}
            <TreeLayer settings={settings} treeFeatures={treeFeatures} />

            {/* Roads and POI */}
            <RoadPoiLayer settings={settings} roadFeatures={roadFeatures} poiFeatures={poiFeatures} poiStats={poiStats} />

            {/* Analysis point marker */}
            <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
              <PointGraphics pixelSize={14} color={Color.YELLOW} outlineColor={Color.BLACK} outlineWidth={2.5} />
              <LabelGraphics
                text="📍 基地位置"
                font="bold 16px sans-serif"
                fillColor={Color.fromCssColorString('#FFEE58')}
                outlineColor={Color.fromBytes(0, 0, 0, 240)}
                outlineWidth={4}
                style={LabelStyle.FILL_AND_OUTLINE}
                pixelOffset={new Cartesian2(0, -30)}
                showBackground={true}
                backgroundColor={Color.BLACK.withAlpha(0.7)}
                backgroundPadding={new Cartesian2(9, 5)}
                disableDepthTestDistance={Number.POSITIVE_INFINITY}
              />
            </Entity>
          </>
        )}
      </Viewer>

      {/* Cesium 原生交通圖層 — GroundPolylinePrimitive 貼地 */}
      <TransportCesiumLayer viewerRef={viewerRef} settings={settings} />

      {/* 量測模式提示 */}
      {settings.showMeasureTool && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,188,212,0.15)', border: '1px solid rgba(0,188,212,0.45)',
          borderRadius: 4, padding: '4px 12px', zIndex: 40, pointerEvents: 'none',
          fontSize: 10, color: '#00BCD4', letterSpacing: '0.12em',
        }}>
          {measurePts.length === 0
            ? '📏 點選起點'
            : (() => {
                const segs = measurePts.slice(1).map((p, i) => haversineM(measurePts[i].lat, measurePts[i].lng, p.lat, p.lng));
                const total = segs.reduce((s, d) => s + d, 0);
                return measurePts.length === 1
                  ? `📏 ${measurePts.length} 點 · 繼續點選新增 · 右鍵清除`
                  : `📏 ${fmtDist(total)} · ${measurePts.length} 點 · 繼續點選 · 右鍵清除`;
              })()
          }
        </div>
      )}

      {/* 高程剖面模式提示 */}
      {settings.showElevProfile && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(139,195,74,0.15)', border: '1px solid rgba(139,195,74,0.45)',
          borderRadius: 4, padding: '4px 12px', zIndex: 40, pointerEvents: 'none',
          fontSize: 10, color: '#8BC34A', letterSpacing: '0.12em',
        }}>
          {elevPts.length === 0 ? '⛰ 點選起點 A' : elevPts.length === 1 ? '⛰ 點選終點 B' : elevLoading ? '⛰ 高程取樣中...' : '⛰ 點選起點重設'}
        </div>
      )}

      {/* 高程剖面圖 */}
      {settings.showElevProfile && elevData.length > 0 && (
        <ElevProfilePanel data={elevData} onClose={() => { setElevPts([]); setElevData([]); }} />
      )}

      {/* HUD Info */}
      <div className="absolute bottom-4 left-4 bg-elegant-surface/80 border border-elegant-border p-3 font-mono text-[10px] pointer-events-none rounded shadow-lg">
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary">緯度:</span>
          <span>{settings.selectedBase?.lat.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary">經度:</span>
          <span>{settings.selectedBase?.lng.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-elegant-text-secondary uppercase">光影模擬:</span>
          <span className={settings.showShadows ? 'text-[#00FF90]' : 'text-red-500 font-bold'}>
            {settings.showShadows ? '已啟動' : '關閉'}
          </span>
        </div>
      </div>
    </div>
  );
};
