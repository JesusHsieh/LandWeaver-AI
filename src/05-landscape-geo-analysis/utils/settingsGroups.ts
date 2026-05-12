import { MapSettings } from '../types';

export const baseLayers = (s: MapSettings) => ({
  osmBuildings: s.showOsmBuildings,
  osmImagery: s.showOsmImagery,
  google3DTiles: s.showGoogle3DTiles,
  shadows: s.showShadows,
  terrain: s.showTerrain,
  nlscEmap: s.showNlscEmap,
  nlscPhoto: s.showNlscPhoto,
  nlscLandSect: s.showNlscLandSect,
  nlscContour: s.showNlscContour,
  nlscHillShade: s.showNlscHillShade,
  nlscAdminBound: s.showNlscAdminBound,
});

export const regulatoryLayers = (s: MapSettings) => ({
  urbanPlan: s.showUrbanPlan,
  liquefaction: s.showLiquefaction,
  debrisFlow: s.showDebrisFlow,
  activeFault: s.showActiveFault,
  floodPotential: s.showFloodPotential,
  slopeSensitive: s.showSlopeSensitive,
  drinkingWater: s.showDrinkingWater,
  culturalHeritage: s.showCulturalHeritage,
  zoningRegulation: s.showZoningRegulation,
});

export const analysisLayers = (s: MapSettings) => ({
  microClimate: s.showMicroClimate,
  slopeAnalysis: s.showSlopeAnalysis,
  zoning: s.showZoning,
  urbanStress: s.showUrbanStress,
  hydrology: s.showHydrology,
  soilAnalysis: s.showSoilAnalysis,
  plantMatching: s.showPlantMatching,
  impervious: s.showImperviousLayer,
  ndvi: s.showNdviLayer,
  buildingDensity: s.showBuildingDensity,
  streetTree: s.showStreetTreeLayer,
  landscapeStrategy: s.showLandscapeStrategy,
});

export const transportLayers = (s: MapSettings) => ({
  road: s.showRoadLayer,
  poi: s.showPoiLayer,
  mrt: s.showMrtLayer,
  mrtTrains: s.showMrtTrains,
  thsr: s.showThsrLayer,
  thsrTrains: s.showThsrTrains,
  tra: s.showTRALayer,
  traTrains: s.showTRATrains,
  taoyuanMrt: s.showTaoyuanMrtLayer,
  taoyuanMrtTrains: s.showTaoyuanMrtTrains,
  taichungMrt: s.showTaichungMrtLayer,
  taichungMrtTrains: s.showTaichungMrtTrains,
  kaohsiungMrt: s.showKaohsiungMrtLayer,
  kaohsiungMrtTrains: s.showKaohsiungMrtTrains,
  youBike: s.showYouBikeLayer,
});

export const toolSettings = (s: MapSettings) => ({
  bufferRadius: s.bufferRadius,
  measureTool: s.showMeasureTool,
  elevProfile: s.showElevProfile,
});
