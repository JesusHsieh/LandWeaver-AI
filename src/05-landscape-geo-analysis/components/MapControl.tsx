import React, { useEffect, useRef } from 'react';
import { Viewer, CameraFlyTo, Entity, PointGraphics, Cesium3DTileset, ImageryLayer, PolylineGraphics, LabelGraphics, ScreenSpaceEventHandler, ScreenSpaceEvent, BillboardGraphics } from 'resium';
import { Cartesian3, Color, JulianDate, ShadowMode, createWorldTerrainAsync, IonResource, OpenStreetMapImageryProvider, Matrix4, Cartesian3 as CesiumCartesian3, EllipsoidTerrainProvider, ScreenSpaceEventType, VerticalOrigin, LabelStyle, HorizontalOrigin } from 'cesium';
import { MapSettings } from '../types';
import { GISService } from '../services/gisService';

interface MapControlProps {
  settings: MapSettings;
  onLocationClick: (lat: number, lng: number) => void;
}

export const MapControl: React.FC<MapControlProps> = ({ settings, onLocationClick }) => {
  const viewerRef = useRef<any>(null);

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

  useEffect(() => {
    const updateTerrain = async () => {
      if (viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        if (settings.showTerrain) {
          try {
            viewer.terrainProvider = await createWorldTerrainAsync();
          } catch (e) {
            console.error("無法載入地形", e);
          }
        } else {
          // 當關閉地形時，使用橢球體（平整地面），建築物會完美貼合 2D 地圖
          viewer.terrainProvider = new EllipsoidTerrainProvider();
        }
      }
    };
    updateTerrain();
  }, [settings.showTerrain]);

  // Run once after Viewer mounts — replaces the removed onLayerDidLoad prop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        viewer.imageryLayers.removeAll();
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.clock.shouldAnimate = false;
      }
    }, 200); // wait for Cesium to finish mounting
    return () => clearTimeout(timer);
  }, []);

  const osmImageryProvider = new OpenStreetMapImageryProvider({
    url: 'https://a.tile.openstreetmap.org/'
  });

  const handleTilesetReady = (tileset: any) => {
    // 如果關閉地形，Offset 應設為 0 以貼合平面
    // 如果開啟地形，則需要微調位移
    const heightOffset = settings.showTerrain ? -5.0 : 0.0;
    const cartographic = CesiumCartesian3.fromDegrees(settings.selectedBase?.lng || 121.5644, settings.selectedBase?.lat || 25.0339);
    const surface = CesiumCartesian3.fromDegrees(settings.selectedBase?.lng || 121.5644, settings.selectedBase?.lat || 25.0339, heightOffset);
    const translation = CesiumCartesian3.subtract(surface, cartographic, new CesiumCartesian3());
    tileset.modelMatrix = Matrix4.fromTranslation(translation);
  };

  const handleLeftClick = (movement: any) => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      
      // 1. 優先嘗試拾取 3D 物體表面 (如建築物)
      let cartesian = viewer.scene.pickPosition(movement.position);
      
      // 2. 如果沒點到建築物，則拾取地表橢球體
      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      }

      if (cartesian) {
        const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const lat = cartographic.latitude * (180 / Math.PI);
        const lng = cartographic.longitude * (180 / Math.PI);
        onLocationClick(lat, lng);
      }
    }
  };

  // Calculate Solar Azimuth Line positions
  const getSolarLinePositions = (distance = 400) => {
    if (!settings.analysisPoint) return [];
    const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
    
    // Convert to ground projection (Azimuth only)
    const azimuthRad = (90 - sunPos.azimuth) * (Math.PI / 180);
    const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2);
    const latOffset = (distance / 111320) * Math.sin(azimuthRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 2);
    
    return [start, end];
  };

  /**
   * Helper to get 3D Cartesian from Topocentric (Azimuth/Altitude)
   */
  const getSunCartesian = (lat: number, lng: number, azimuth: number, altitude: number, distance: number) => {
    const azimuthRad = (90 - azimuth) * (Math.PI / 180);
    const altRad = altitude * (Math.PI / 180);
    
    const hDist = distance * Math.cos(altRad);
    const vDist = distance * Math.sin(altRad);
    
    const latOffset = (hDist / 111320) * Math.sin(azimuthRad);
    const lngOffset = (hDist / (111320 * Math.cos(lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    
    return Cartesian3.fromDegrees(lng + lngOffset, lat + latOffset, vDist + 10);
  };

  const getSunActualPos = () => {
    if (!settings.analysisPoint) return undefined;
    const sunPos = GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime);
    return getSunCartesian(settings.analysisPoint.lat, settings.analysisPoint.lng, sunPos.azimuth, sunPos.altitude, 400);
  };

  const solarPathPoints = settings.analysisPoint ? GISService.getSolarPath(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime) : [];
  
  const solarPathPositions = solarPathPoints.map(p => 
    getSunCartesian(settings.analysisPoint!.lat, settings.analysisPoint!.lng, p.azimuth, p.altitude, 400)
  );

  const getCompassPosition = (azimuth: number, distance = 400) => {
    if (!settings.analysisPoint) return Cartesian3.ZERO;
    const azimuthRad = (90 - azimuth) * (Math.PI / 180);
    const latOffset = (distance / 111320) * Math.sin(azimuthRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(azimuthRad);
    return Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
  };

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

  const getZoningColor = (cat: string) => {
    switch(cat) {
      case '高熱曝曬區': return Color.ORANGERED;
      case '陰影區': return Color.NAVY;
      case '乾陰區': return Color.BROWN;
      case '潮濕積水區': return Color.AQUA;
      case '強風區': return Color.GHOSTWHITE;
      case '都市熱島區': return Color.CRIMSON;
      default: return Color.LIME;
    }
  };

  const zoningGrid = settings.analysisPoint ? Array.from({ length: 9 }).map((_, i) => {
    const r = Math.floor(i / 3) - 1;
    const c = (i % 3) - 1;
    const lat = settings.analysisPoint!.lat + r * 0.0008;
    const lng = settings.analysisPoint!.lng + c * 0.0008;
    const seed = lat + lng;
    const pseudoRand = (offset: number) => Math.abs(Math.sin(seed + offset));
    
    // Pseudo-zoning for grid visualization
    const cats = ['高熱曝曬區', '半日照區', '陰影區', '強風區', '都市熱島區', '潮濕積水區', '乾陰區'];
    const cat = cats[Math.floor(pseudoRand(10) * cats.length)];
    
    return { lat, lng, cat };
  }) : [];

  const getFlowArrowPositions = (distance = 150) => {
    if (!settings.analysisPoint) return [];
    // Pseudo flow based on point
    const angle = (settings.analysisPoint.lat + settings.analysisPoint.lng) * 1000 % 360;
    const angleRad = (90 - angle) * (Math.PI / 180);
    const start = Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5);
    const latOffset = (distance / 111320) * Math.sin(angleRad);
    const lngOffset = (distance / (111320 * Math.cos(settings.analysisPoint.lat * (Math.PI / 180)))) * Math.cos(angleRad);
    const end = Cartesian3.fromDegrees(settings.analysisPoint.lng + lngOffset, settings.analysisPoint.lat + latOffset, 5);
    return [start, end];
  };

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
      >
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent action={handleLeftClick} type={ScreenSpaceEventType.LEFT_CLICK} />
        </ScreenSpaceEventHandler>

        {/* OSM 2D Imagery */}
        {settings.showOsmImagery && (
          <ImageryLayer imageryProvider={osmImageryProvider} />
        )}

        {/* OSM 3D Buildings - Requested 2D/3D */}
        {settings.showOsmBuildings && (
          <Cesium3DTileset 
            url={IonResource.fromAssetId(96188)} 
            onReady={handleTilesetReady}
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

        {/* Analysis Visualizations */}
        {settings.analysisPoint && (
          <>
            {/* Compass Ring and Labels — each label needs its own Entity */}
            {(['N', 'S', 'E', 'W'] as const).map((dir, i) => (
              <Entity key={dir} position={getCompassPosition([0, 180, 90, 270][i], 420)}>
                <LabelGraphics text={dir} fillColor={Color.WHITE} font="16px Arial" verticalOrigin={VerticalOrigin.CENTER} />
              </Entity>
            ))}
            {/* Main Compass Circle */}
            <Entity>
              <PolylineGraphics
                positions={Array.from({ length: 37 }).map((_, i) => getCompassPosition(i * 10, 400))}
                width={1.5}
                material={Color.WHITE.withAlpha(0.3)}
              />
            </Entity>

            {/* Point of interest */}
            <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
              <PointGraphics pixelSize={12} color={Color.YELLOW} outlineColor={Color.BLACK} outlineWidth={2} />
              <LabelGraphics text="基地位置" font="12px Arial" pixelOffset={{ x: 0, y: -25 } as any} outlineWidth={2} outlineColor={Color.BLACK} style={LabelStyle.FILL_AND_OUTLINE} />
            </Entity>
            
            {/* Solar Path Arc */}
            {settings.showShadows && (
              <>
                {/* Arc path */}
                <Entity>
                  <PolylineGraphics
                    positions={solarPathPositions}
                    width={2}
                    material={Color.ORANGE.withAlpha(0.7)}
                  />
                  <PolylineGraphics
                    positions={getSolarLinePositions(400)}
                    width={3}
                    material={Color.ORANGE.withAlpha(0.5)}
                  />
                </Entity>

                {/* Hour Markers along path */}
                {solarPathPoints.map((p, i) => (
                  <Entity key={`marker-${i}`} position={solarPathPositions[i]}>
                    <PointGraphics pixelSize={6} color={Color.ORANGE} outlineColor={Color.BLACK} outlineWidth={1} />
                    <LabelGraphics 
                      text={p.hourLabel} 
                      font="10px Arial" 
                      pixelOffset={{ x: 0, y: -15 } as any} 
                      fillColor={Color.ORANGE} 
                      outlineColor={Color.BLACK} 
                      outlineWidth={1} 
                      style={LabelStyle.FILL_AND_OUTLINE} 
                    />
                  </Entity>
                ))}

                {/* Actual Sun position in 3D */}
                <Entity position={getSunActualPos()}>
                   <PointGraphics pixelSize={24} color={Color.YELLOW} outlineColor={Color.ORANGE} outlineWidth={3} />
                   <PolylineGraphics
                    positions={[Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2), getSunActualPos() as Cartesian3]}
                    width={2}
                    material={Color.YELLOW.withAlpha(0.4)}
                  />
                   <LabelGraphics 
                    text={`太陽方位角: ${GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime).azimuth.toFixed(1)}°`}
                    font="12px Arial"
                    fillColor={Color.YELLOW}
                    outlineColor={Color.BLACK}
                    outlineWidth={2}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    verticalOrigin={VerticalOrigin.BOTTOM}
                    pixelOffset={{ x: 0, y: -25 } as any}
                  />
                </Entity>
              </>
            )}

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
                  font="8px Arial" 
                  pixelOffset={{ x: 0, y: 20 } as any} 
                  fillColor={getZoningColor(z.cat)} 
                  showBackground
                  backgroundColor={Color.BLACK.withAlpha(0.5)}
                />
              </Entity>
            ))}

            {settings.showUrbanStress && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 20)}>
                 <LabelGraphics 
                    text="⚠️ 都市熱島強度: 高\n🏙️ 街谷效應: 顯著\n🌡️ 表面高溫區域" 
                    font="12px font-mono" 
                    fillColor={Color.CORAL}
                    outlineColor={Color.BLACK}
                    outlineWidth={2}
                    style={LabelStyle.FILL_AND_OUTLINE}
                    pixelOffset={{ x: 50, y: 0 } as any}
                    horizontalOrigin={HorizontalOrigin.LEFT}
                 />
                 <PointGraphics pixelSize={100} color={Color.RED.withAlpha(0.2)} />
              </Entity>
            )}

            {settings.showHydrology && (
              <>
                <Entity>
                  <PolylineGraphics
                    positions={getFlowArrowPositions(200)}
                    width={5}
                    material={Color.AQUA.withAlpha(0.6)}
                  />
                </Entity>
                <Entity position={getFlowArrowPositions(220)[1]}>
                  <LabelGraphics
                    text="➞ 地表逕流向"
                    font="10px Arial"
                    fillColor={Color.AQUA}
                  />
                </Entity>
              </>
            )}

            {settings.showSoilAnalysis && (
              <Entity position={Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 5)}>
                 <LabelGraphics 
                    text="💧 滲透率: 低 (積水潛勢)" 
                    font="10px Arial" 
                    fillColor={Color.CYAN}
                    pixelOffset={{ x: -100, y: 50 } as any}
                    showBackground
                    backgroundColor={Color.BLACK.withAlpha(0.6)}
                 />
              </Entity>
            )}
          </>
        )}
      </Viewer>
      
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
