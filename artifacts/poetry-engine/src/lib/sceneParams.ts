export interface SceneParams {
  terrain: number;
  terrainHeight: number;
  terrainScale: number;
  water: number;
  waterAmplitude: number;
  waterFrequency: number;
  trees: number;
  buildings: number;
  columns: number;
  columnHeight: number;
  columnRadius: number;
  fire: number;
  fireRadius: number;
  fireHeight: number;
  spheres: number;
  sphereRadius: number;
  sphereY: number;
  stars: number;
  turbulence: number;
  col1: string;
  col2: string;
  col3: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  timeOfDay: number;
}

export const DEFAULT_SCENE: SceneParams = {
  terrain: 0.3,
  terrainHeight: 1.5,
  terrainScale: 0.06,
  water: 0.0,
  waterAmplitude: 0.2,
  waterFrequency: 1.0,
  trees: 0.0,
  buildings: 0.0,
  columns: 0.0,
  columnHeight: 3.0,
  columnRadius: 0.2,
  fire: 0.0,
  fireRadius: 0.5,
  fireHeight: 2.0,
  spheres: 0.0,
  sphereRadius: 0.8,
  sphereY: 1.5,
  stars: 0.6,
  turbulence: 0.2,
  col1: "#1a1a2e",
  col2: "#16213e",
  col3: "#7b68ee",
  skyColor: "#0a0a1a",
  fogColor: "#0d0d1f",
  fogDensity: 0.04,
  timeOfDay: 0.05,
};

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

// Quick client-side keyword analysis for instant preview
export function analyzeLineLocally(line: string): Partial<SceneParams> {
  const l = line.toLowerCase();
  const params: Partial<SceneParams> = {};

  // Fire keywords
  if (/fire|burn|flame|blaze|ember|tyger|bright|hot/.test(l)) {
    params.fire = 0.8 + Math.random() * 0.2;
    params.fireRadius = 0.8;
    params.fireHeight = 2.5;
    params.col3 = "#ff4500";
    params.col1 = "#1a0500";
    params.skyColor = "#0a0200";
    params.timeOfDay = 0.05;
    params.fogColor = "#200800";
    params.fogDensity = 0.06;
  }

  // Ocean/water keywords
  if (/ocean|sea|wave|water|river|lake|rain|flood|sail|shore|tide/.test(l)) {
    params.water = 0.9;
    params.waterAmplitude = 0.3;
    params.waterFrequency = 1.2;
    params.terrain = 0.1;
    params.col1 = "#001a3a";
    params.col2 = "#002855";
    params.col3 = "#4488cc";
    params.skyColor = "#001122";
    params.fogColor = "#001830";
    params.fogDensity = 0.05;
  }

  // Forest/tree keywords
  if (/forest|tree|wood|branch|leaf|grove|jungle|garden|green/.test(l)) {
    params.trees = 0.9;
    params.terrain = 0.4;
    params.col1 = "#0d1f0d";
    params.col2 = "#1a3d1a";
    params.col3 = "#2d6a2d";
    params.skyColor = "#0a1a0a";
    params.fogColor = "#0d1a0d";
  }

  // Night/star keywords
  if (/night|dark|star|moon|midnight|dream|sleep|shadow/.test(l)) {
    params.stars = 1.0;
    params.timeOfDay = 0.0;
    params.skyColor = "#000510";
    params.fogColor = "#000a1a";
    params.fogDensity = 0.03;
  }

  // Dawn/sunrise keywords
  if (/dawn|sunrise|morning|rise|gold|golden|hope|bright/.test(l)) {
    params.timeOfDay = 0.25;
    params.col3 = "#ffa040";
    params.skyColor = "#1a0a05";
    params.fogColor = "#2a1505";
  }

  // Sunset keywords
  if (/sunset|dusk|evening|twilight|last/.test(l)) {
    params.timeOfDay = 0.75;
    params.col3 = "#ff6020";
    params.skyColor = "#150a00";
    params.fogColor = "#1a0d00";
  }

  // Mountain/stone keywords
  if (/mountain|stone|rock|peak|cliff|ruins|statue|sand|desert|vast/.test(l)) {
    params.terrain = 0.9;
    params.terrainHeight = 4.5;
    params.turbulence = 0.3;
    params.col1 = "#2a2a2a";
    params.col2 = "#3a3530";
    params.col3 = "#888880";
  }

  // Snow/winter keywords
  if (/snow|ice|cold|winter|frost|freeze|white/.test(l)) {
    params.terrain = 0.7;
    params.col1 = "#c8d4e0";
    params.col2 = "#e0e8f0";
    params.col3 = "#ffffff";
    params.skyColor = "#0a0f1a";
  }

  // City/building keywords
  if (/city|building|street|tower|bridge|road|path/.test(l)) {
    params.buildings = 0.7;
    params.terrain = 0.2;
    params.col1 = "#1a1a1a";
    params.col2 = "#252525";
    params.col3 = "#4488ff";
  }

  // Hope/feather/bird keywords
  if (/hope|feather|bird|fly|wing|soar|dream|heaven|angel/.test(l)) {
    params.spheres = 0.3;
    params.stars = 0.5;
    params.timeOfDay = 0.3;
    params.turbulence = 0.4;
    params.col3 = "#88aaff";
    params.skyColor = "#050a1a";
  }

  return params;
}
