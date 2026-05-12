import React from 'react';
import { ImageryLayer } from 'resium';
import {
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  WebMapTileServiceImageryProvider,
} from 'cesium';
import { MapSettings } from '../types';

interface BaseImageryLayersProps {
  settings: MapSettings;
  osmOrigProvider: OpenStreetMapImageryProvider;
  osmDarkProvider: UrlTemplateImageryProvider;
  osmLightProvider: UrlTemplateImageryProvider;
  nlscEmapProvider: UrlTemplateImageryProvider;
  nlscPhotoProvider: UrlTemplateImageryProvider;
  nlscLandSectProvider: WebMapTileServiceImageryProvider;
  nlscContourProvider: WebMapTileServiceImageryProvider;
  nlscHillShadeProvider: WebMapTileServiceImageryProvider;
  nlscAdminBoundProvider: WebMapTileServiceImageryProvider;
}

export const BaseImageryLayers: React.FC<BaseImageryLayersProps> = ({
  settings,
  osmOrigProvider,
  osmDarkProvider,
  osmLightProvider,
  nlscEmapProvider,
  nlscPhotoProvider,
  nlscLandSectProvider,
  nlscContourProvider,
  nlscHillShadeProvider,
  nlscAdminBoundProvider,
}) => {
  const osmImageryProvider =
    settings.baseTheme === 'LIGHT' ? osmLightProvider :
    settings.baseTheme === 'DARK'  ? osmDarkProvider  :
    osmOrigProvider;

  return (
    <>
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
    </>
  );
};
