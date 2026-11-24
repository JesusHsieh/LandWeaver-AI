import { useMemo } from 'react';
import {
  OpenStreetMapImageryProvider,
  Rectangle,
  UrlTemplateImageryProvider,
  WebMapTileServiceImageryProvider,
  WebMapServiceImageryProvider,
} from 'cesium';

const TAIWAN_WMS_RECTANGLE = Rectangle.fromDegrees(118.0, 21.0, 123.5, 26.5);
const WMS_OVERLAY_OPTIONS = {
  parameters: { transparent: 'true', format: 'image/png', tiled: 'true' },
  rectangle: TAIWAN_WMS_RECTANGLE,
  tileWidth: 512,
  tileHeight: 512,
  enablePickFeatures: false,
};

const ESRI_CANVAS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
const esriCanvas = (service: string) => new UrlTemplateImageryProvider({
  url: `${ESRI_CANVAS_URL}/${service}/MapServer/tile/{z}/{y}/{x}`,
  maximumLevel: 16,
  credit: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
});

export function useImageryProviders() {
  const osmOrigProvider = useMemo(() => new OpenStreetMapImageryProvider({
    url: 'https://a.tile.openstreetmap.org/',
  }), []);
  // CARTO basemaps now answer keyless requests with an "API KEY REQUIRED" tile,
  // so DARK / LIGHT use Esri's keyless Canvas basemaps (tiles stop at level 16).
  const osmDarkProvider = useMemo(() => esriCanvas('World_Dark_Gray_Base'), []);
  const osmLightProvider = useMemo(() => esriCanvas('World_Light_Gray_Base'), []);
  const esriDarkLabelsProvider = useMemo(() => esriCanvas('World_Dark_Gray_Reference'), []);
  const esriLightLabelsProvider = useMemo(() => esriCanvas('World_Light_Gray_Reference'), []);

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
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 9,
    maximumLevel: 14,
    credit: '內政部 NLSC · 都市計畫分區 LUIMAP',
  }), []);

  // 08B 地盤液化潛勢
  const cgsLiquefactionProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_Soil_liquefatcion_2021',
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 土壤液化潛勢 2021',
  }), []);

  // 08D 活動斷層地質敏感區
  const cgsFaultProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_fault',
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（活動斷層）',
  }), []);

  // 08E 淹水潛勢：24 小時 500 mm 情境的模擬淹水深度（與右側面板規則檢核同一情境）。
  // 不用 114nfp_* 圖層：那是河道範圍，不含淹水深度。
  // Loaded straight from WRA, not through /api/proxy: WRA's firewall rejects
  // requests from Vercel's data-centre IPs, and the server sends CORS headers.
  const wraFloodProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: 'https://maps.wra.gov.tw/arcgis/services/WMS/GIC_WMS/MapServer/WMSServer',
    layers: 'flood_500mm_24hr',
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '經濟部水利署 · 淹水潛勢圖（24 小時 500 mm）',
  }), []);

  // 08C 土石流/崩塌地
  const cgsDebrisProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Geomap_Envi_DebrisSlide_2013',
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 崩塌地 DebrisSlide 2013',
  }), []);

  // 08F 山崩/地滑地質敏感區
  const cgsSlopeProvider = useMemo(() => new WebMapServiceImageryProvider({
    url: '/cgs-wms/mapguide/mapagent/mapagent.fcgi',
    layers: 'WMS/Sensitive_area_landslide',
    ...WMS_OVERLAY_OPTIONS,
    minimumLevel: 7,
    maximumLevel: 14,
    credit: '地質調查及礦業管理中心 · 地質敏感區（山崩與地滑）',
  }), []);

  // Transparent layers, bottom to top — kept above whichever base map is on.
  const overlayOrder = useMemo(() => [
    esriDarkLabelsProvider, esriLightLabelsProvider,
    nlscHillShadeProvider, nlscContourProvider, nlscLandSectProvider, nlscAdminBoundProvider,
    nlscUrbanPlanProvider, cgsLiquefactionProvider, cgsDebrisProvider,
    cgsFaultProvider, wraFloodProvider, cgsSlopeProvider,
  ], [
    esriDarkLabelsProvider, esriLightLabelsProvider,
    nlscHillShadeProvider, nlscContourProvider, nlscLandSectProvider, nlscAdminBoundProvider,
    nlscUrbanPlanProvider, cgsLiquefactionProvider, cgsDebrisProvider,
    cgsFaultProvider, wraFloodProvider, cgsSlopeProvider,
  ]);

  return {
    osmOrigProvider, osmDarkProvider, osmLightProvider,
    esriDarkLabelsProvider, esriLightLabelsProvider,
    nlscEmapProvider, nlscPhotoProvider,
    nlscLandSectProvider, nlscContourProvider, nlscHillShadeProvider, nlscAdminBoundProvider,
    nlscUrbanPlanProvider,
    cgsLiquefactionProvider, cgsFaultProvider, wraFloodProvider, cgsDebrisProvider, cgsSlopeProvider,
    overlayOrder,
  };
}
