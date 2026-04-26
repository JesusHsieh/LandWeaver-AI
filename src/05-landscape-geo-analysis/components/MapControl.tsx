import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Viewer, CameraFlyTo, Entity, PointGraphics, Cesium3DTileset, ImageryLayer, PolylineGraphics, LabelGraphics, ScreenSpaceEventHandler, ScreenSpaceEvent, BillboardGraphics } from 'resium';
import { Cartesian2, Cartesian3, Color, JulianDate, ShadowMode, createWorldTerrainAsync, IonResource, OpenStreetMapImageryProvider, UrlTemplateImageryProvider, WebMapTileServiceImageryProvider, WebMapServiceImageryProvider, Matrix4, Cartographic, sampleTerrainMostDetailed, EllipsoidTerrainProvider, ScreenSpaceEventType, VerticalOrigin, LabelStyle, HorizontalOrigin, Cesium3DTileStyle } from 'cesium';
import { MapSettings, LandscapeDesignData } from '../types';
import { GISService } from '../services/gisService';
import { TransportCesiumLayer } from './TransportCesiumLayer';

interface MapControlProps {
  settings: MapSettings;
  onLocationClick: (lat: number, lng: number) => void;
  landscapeData: LandscapeDesignData | null;
}

export const MapControl: React.FC<MapControlProps> = ({ settings, onLocationClick, landscapeData }) => {
  const viewerRef        = useRef<any>(null);
  const osmTilesetRef    = useRef<any>(null);
  // A hidden WorldTerrain provider kept only for height-sampling — never assigned to viewer
  const terrainSamplerRef = useRef<any>(null);

  // Convert Date to JulianDate for Cesium
  const julianDate = JulianDate.fromDate(settings.currentTime);

  // 08G 飲用水保護區 — OSM 水源地 / 水庫 (Cesium Entity，疊在 Google 3D 上)
  const [waterFeatures, setWaterFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);
  useEffect(() => {
    if (!settings.showDrinkingWater) { setWaterFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.6;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["landuse"="reservoir"](${bbox});node["natural"="water"]["name"](${bbox});way["landuse"="reservoir"](${bbox});relation["landuse"="reservoir"](${bbox}););out center 120;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        const features = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '水源地',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08G] OSM water loaded:', features.length);
        setWaterFeatures(features);
      })
      .catch((e) => console.warn('[08G] OSM fetch failed:', e));
  }, [settings.showDrinkingWater, settings.analysisPoint]);

  // 08H 文化資產 — OSM historic 節點 (Cesium Entity，疊在 Google 3D 上)
  const [heritageFeatures, setHeritageFeatures] = useState<{ lat: number; lng: number; name: string }[]>([]);
  useEffect(() => {
    if (!settings.showCulturalHeritage) { setHeritageFeatures([]); return; }
    const pt = settings.analysisPoint ?? settings.selectedBase ?? { lat: 25.0339, lng: 121.5644 };
    const r = 0.12;
    const bbox = `${pt.lat - r},${pt.lng - r},${pt.lat + r},${pt.lng + r}`;
    const q = `[out:json][timeout:15];(node["historic"](${bbox});node["tourism"="museum"](${bbox});node["heritage"](${bbox});way["historic"](${bbox}););out center 200;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then(res => res.json())
      .then(data => {
        const features = (data.elements ?? []).map((el: any) => ({
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          name: el.tags?.['name:zh'] ?? el.tags?.name ?? '文化資產',
        })).filter((f: any) => f.lat && f.lng);
        console.log('[08H] OSM heritage loaded:', features.length);
        setHeritageFeatures(features);
      })
      .catch((e) => console.warn('[08H] OSM fetch failed:', e));
  }, [settings.showCulturalHeritage, settings.analysisPoint]);

  // Load the sampler terrain once on mount so we can always know the real ground height
  useEffect(() => {
    createWorldTerrainAsync()
      .then(tp => { terrainSamplerRef.current = tp; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.clock.currentTime = julianDate;
      viewer.shadows = settings.showShadows;
      viewer.terrainShadows = settings.showShadows ? ShadowMode.ENABLED : ShadowMode.DISABLED;
    }
  }, [settings.currentTime, settings.showShadows]);


  // Compute and apply the vertical offset that makes OSM buildings land on the visible ground.
  // OSM Buildings (Ion 96188) use WGS84 ellipsoidal heights — the real terrain height is baked in.
  // • Terrain OFF  → ground is at 0 (EllipsoidTerrainProvider) → shift buildings DOWN by h
  // • Terrain ON   → ground matches the real terrain            → no shift needed
  const applyBuildingOffset = async (showTerrain: boolean, lat: number, lng: number) => {
    const tileset = osmTilesetRef.current;
    if (!tileset) return;

    if (showTerrain) {
      // Terrain surface already matches building base heights — reset any previous offset
      tileset.modelMatrix = Matrix4.IDENTITY.clone();
      return;
    }

    // Terrain is OFF: sample real height via the hidden sampler and shift down
    const sampler = terrainSamplerRef.current;
    if (!sampler) return;
    try {
      const carto = Cartographic.fromDegrees(lng, lat);
      const [sampled] = await sampleTerrainMostDetailed(sampler, [carto]);
      const h = sampled.height ?? 0;
      if (Math.abs(h) < 0.1) return; // already at ellipsoid level
      const surface  = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0.0);
      const shifted  = Cartesian3.fromRadians(carto.longitude, carto.latitude, -h);
      const translation = Cartesian3.subtract(shifted, surface, new Cartesian3());
      tileset.modelMatrix = Matrix4.fromTranslation(translation);
    } catch (e) {
      console.warn('Building offset sampling failed', e);
    }
  };

  useEffect(() => {
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;

    const updateTerrain = async () => {
      if (!viewerRef.current?.cesiumElement) return;
      const viewer = viewerRef.current.cesiumElement;

      if (settings.showTerrain) {
        try {
          viewer.terrainProvider = await createWorldTerrainAsync();
        } catch (e) {
          console.error('無法載入地形', e);
        }
      } else {
        viewer.terrainProvider = new EllipsoidTerrainProvider();
      }
      // Re-apply offset after terrain provider changes
      await applyBuildingOffset(settings.showTerrain, lat, lng);
    };
    updateTerrain();
  }, [settings.showTerrain]);

  // Run once after Viewer mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewerRef.current?.cesiumElement) {
        const viewer = viewerRef.current.cesiumElement;
        // Remove only the auto-added default layer (Bing/ion), keep Resium-managed layers
        // We rely on baseLayer={false} on <Viewer> to prevent default, so this is a safety net
        // only: remove any layer that isn't one we explicitly added via <ImageryLayer>
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.clock.shouldAnimate = false;
        viewer.scene.verticalExaggeration = 1.0;

        // Jump directly to the default base point — skip the default North America view
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(121.5644, 25.0339, 1200),
          orientation: {
            heading: 0.0,
            pitch: -0.4, // ~23° looking down
            roll: 0.0,
          },
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Providers are memoised — never recreated on re-render, so Cesium tile cache stays valid
  // Base theme providers
  const osmOrigProvider = useMemo(() => new OpenStreetMapImageryProvider({
    url: 'https://a.tile.openstreetmap.org/',
  }), []);
  const osmDarkProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    maximumLevel: 19,
    credit: '© CartoDB © OpenStreetMap contributors',
  }), []);
  const osmLightProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    maximumLevel: 19,
    credit: '© CartoDB © OpenStreetMap contributors',
  }), []);
  const osmImageryProvider =
    settings.baseTheme === 'LIGHT' ? osmLightProvider :
    settings.baseTheme === 'DARK'  ? osmDarkProvider  :
    osmOrigProvider;

  const nlscEmapProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: '/nlsc-wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maximumLevel: 19,
    minimumLevel: 1,
    credit: '國土測繪中心 NLSC · 電子地圖',
  }), []);

  const nlscPhotoProvider = useMemo(() => new UrlTemplateImageryProvider({
    url: '/nlsc-wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maximumLevel: 20,
    minimumLevel: 1,
    credit: '國土測繪中心 NLSC · 正射影像',
  }), []);

  // 以下四層改用 WebMapTileServiceImageryProvider（正確的 WMTS KVP 請求格式）
  // Proxy: /nlsc-wmts → https://wmts.nlsc.gov.tw/wmts
  const nlscLandSectProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'LANDSECT',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 19,
    credit: '國土測繪中心 NLSC · 地籍圖 LANDSECT',
  }), []);

  const nlscContourProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'MOI_CONTOUR',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 17,
    credit: '國土測繪中心 NLSC · 等高線 MOI_CONTOUR',
  }), []);

  const nlscHillShadeProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'MOI_HILLSHADE',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 16,
    credit: '國土測繪中心 NLSC · 山體陰影 MOI_HILLSHADE',
  }), []);

  const nlscAdminBoundProvider = useMemo(() => new WebMapTileServiceImageryProvider({
    url: '/nlsc-wmts',
    layer: 'TOWN',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 15,
    credit: '國土測繪中心 NLSC · 鄉鎮市區界 TOWN',
  }), []);

  // 08A 都市計畫色塊 — NLSC WMS LUIMAP (wms.nlsc.gov.tw)
  // maximumLevel: 縮放超過此層級時 Cesium 改用放大現有 tile，而非請求空白 WMS 回應
  const nlscUrbanPlanProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/nlsc-wms',
    layers: 'LUIMAP',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 9,
    maximumLevel: 16,
    credit: '內政部 NLSC · 都市計畫分區 LUIMAP',
  }), []);

  // 08B 地盤液化潛勢 — 地質調查及礦業管理中心 CGS WMS (geomap.gsmma.gov.tw)
  const cgsLiquefactionProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_Soil_liquefatcion_2021',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 土壤液化潛勢 2021',
  }), []);

  // 08D 活動斷層地質敏感區 — CGS WMS
  const cgsFaultProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_fault',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（活動斷層）',
  }), []);

  // 08E 淹水潛勢 — 水利署 WRA ArcGIS WMS (maps.wra.gov.tw) layer 0 = 114年裸地淹水潛勢
  const wraFloodProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/wra-wms/arcgis/services/WMS/GIC_WMS/MapServer/WMSServer',
    layers: '0,1',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '水利署 WRA · 淹水潛勢圖 114年',
  }), []);

  // 08C 土石流/崩塌地 — CGS WMS DebrisSlide 2013（公開 WMS 最接近資料）
  const cgsDebrisProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_DebrisSlide_2013',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 崩塌地 DebrisSlide 2013',
  }), []);

  // 08F 山崩/地滑地質敏感區 — CGS WMS
  const cgsSlopeProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_landslide',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（山崩與地滑）',
  }), []);

  const handleTilesetReady = async (tileset: any) => {
    osmTilesetRef.current = tileset;
    const lat = settings.analysisPoint?.lat ?? settings.selectedBase?.lat ?? 25.0339;
    const lng = settings.analysisPoint?.lng ?? settings.selectedBase?.lng ?? 121.5644;
    await applyBuildingOffset(settings.showTerrain, lat, lng);
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
        baseLayer={false as any}
      >
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent action={handleLeftClick} type={ScreenSpaceEventType.LEFT_CLICK} />
        </ScreenSpaceEventHandler>

        {/* OSM 2D Imagery */}
        {settings.showOsmImagery && (
          <ImageryLayer imageryProvider={osmImageryProvider} />
        )}

        {/* NLSC 國土測繪電子地圖 (wmts.nlsc.gov.tw · EMAP) */}
        {settings.showNlscEmap && (
          <ImageryLayer imageryProvider={nlscEmapProvider} />
        )}

        {/* NLSC 國土測繪正射影像 (wmts.nlsc.gov.tw · PHOTO2) */}
        {settings.showNlscPhoto && (
          <ImageryLayer imageryProvider={nlscPhotoProvider} />
        )}

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

        {/* 08G · 飲用水保護區 — OSM 水庫/水源地 (disableDepthTest → 永遠可見) */}
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

        {/* 08H · 文化資產 — OSM historic 節點 (disableDepthTest → 永遠可見) */}
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

        {/* 地籍圖 LANDSECT */}
        {settings.showNlscLandSect && (
          <ImageryLayer imageryProvider={nlscLandSectProvider} alpha={0.85} />
        )}
        {/* 等高線 MOI_CONTOUR */}
        {settings.showNlscContour && (
          <ImageryLayer imageryProvider={nlscContourProvider} alpha={0.75} />
        )}
        {/* 山體陰影 MOI_HILLSHADE */}
        {settings.showNlscHillShade && (
          <ImageryLayer imageryProvider={nlscHillShadeProvider} alpha={0.55} />
        )}
        {/* 行政區界 TOWN */}
        {settings.showNlscAdminBound && (
          <ImageryLayer imageryProvider={nlscAdminBoundProvider} alpha={0.80} />
        )}

        {/* OSM 3D Buildings — offset applied via sampleTerrainMostDetailed when terrain is on */}
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

        {/* Analysis Visualizations */}
        {settings.analysisPoint && (
          <>
            {/* Compass Ring and Labels — each label needs its own Entity */}
            {(['N', 'S', 'E', 'W'] as const).map((dir, i) => (
              <Entity key={dir} position={getCompassPosition([0, 180, 90, 270][i], 420)}>
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
                positions={Array.from({ length: 37 }).map((_, i) => getCompassPosition(i * 10, 400))}
                width={1.5}
                material={Color.WHITE.withAlpha(0.3)}
              />
            </Entity>

            {/* Point of interest */}
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
                <Entity position={getSunActualPos()}>
                   <PointGraphics pixelSize={24} color={Color.YELLOW} outlineColor={Color.ORANGE} outlineWidth={3} />
                   <PolylineGraphics
                    positions={[Cartesian3.fromDegrees(settings.analysisPoint.lng, settings.analysisPoint.lat, 2), getSunActualPos() as Cartesian3]}
                    width={2}
                    material={Color.YELLOW.withAlpha(0.4)}
                  />
                   <LabelGraphics
                    text={`☀ 方位角 ${GISService.calculateSolarPosition(settings.analysisPoint.lat, settings.analysisPoint.lng, settings.currentTime).azimuth.toFixed(1)}°`}
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
                    positions={getFlowArrowPositions(200)}
                    width={5}
                    material={Color.AQUA.withAlpha(0.6)}
                  />
                </Entity>
                <Entity position={getFlowArrowPositions(220)[1]}>
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
        )}
      </Viewer>

      {/* Cesium 原生交通圖層 — GroundPolylinePrimitive 貼地 */}
      <TransportCesiumLayer viewerRef={viewerRef} settings={settings} />

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
