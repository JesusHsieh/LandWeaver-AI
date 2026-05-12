import { useMemo } from 'react';
import {
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  WebMapTileServiceImageryProvider,
  WebMapServiceImageryProvider,
} from 'cesium';

export function useImageryProviders() {
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

  // 08A 都市計畫色塊
  const nlscUrbanPlanProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/nlsc-wms',
    layers: 'LUIMAP',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 9,
    maximumLevel: 14,
    tileWidth: 512,
    tileHeight: 512,
    credit: '內政部 NLSC · 都市計畫分區 LUIMAP',
  }), []);

  // 08B 地盤液化潛勢
  const cgsLiquefactionProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_Soil_liquefatcion_2021',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 土壤液化潛勢 2021',
  }), []);

  // 08D 活動斷層地質敏感區
  const cgsFaultProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_fault',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（活動斷層）',
  }), []);

  // 08E 淹水潛勢
  const wraFloodProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/wra-wms/arcgis/services/WMS/GIC_WMS/MapServer/WMSServer',
    layers: '0,1',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '水利署 WRA · 淹水潛勢圖 114年',
  }), []);

  // 08C 土石流/崩塌地
  const cgsDebrisProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_DebrisSlide_2013',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 崩塌地 DebrisSlide 2013',
  }), []);

  // 08F 山崩/地滑地質敏感區
  const cgsSlopeProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_landslide',
    parameters: { transparent: 'true', format: 'image/png' },
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（山崩與地滑）',
  }), []);

  return {
    osmOrigProvider, osmDarkProvider, osmLightProvider,
    nlscEmapProvider, nlscPhotoProvider,
    nlscLandSectProvider, nlscContourProvider, nlscHillShadeProvider, nlscAdminBoundProvider,
    nlscUrbanPlanProvider,
    cgsLiquefactionProvider, cgsFaultProvider, wraFloodProvider, cgsDebrisProvider, cgsSlopeProvider,
  };
}
