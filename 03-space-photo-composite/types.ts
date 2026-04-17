
export enum ObjectType {
  Man = 'Man',
  Woman = 'Woman',
  // Child removed per request
  TreeBroadleaf = 'Broadleaf Tree',
  TreeConifer = 'Conifer Tree',
  TreePalm = 'Palm Tree',
  ShrubSmall = 'Small Shrub',
  ShrubMedium = 'Medium Shrub',
  ShrubLarge = 'Large Shrub',
  ShrubGroundCover = 'Ground Cover',
  FurnitureChair = 'Chair',
  FurnitureTable = 'Table',
  // New Landscape Objects
  LandscapeRock = 'Landscape Rock',
  LandscapeLight = 'Landscape Light',
  WaterFeature = 'Water Feature',
  OutdoorPot = 'Outdoor Pot'
}

export interface ObjectAttributes {
  [key: string]: string;
}

export interface SceneObject {
  id: string;
  type: ObjectType;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  label: string;
  attributes?: ObjectAttributes; // Custom details (e.g., age, hair color)
}

export interface CameraState {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  rotation: number; // Degrees
}

export interface GenerationRequest {
  referenceImage: string | null; // Base64
  contextDescription: string;
  atmosphereDescription: string;
  objectPrompt?: string; // New: Specific prompt for objects
  camera: CameraState;
  objects: SceneObject[];
}
