import { SceneParams, DEFAULT_SCENE } from "./sceneParams";

const keywords: Record<string, Partial<SceneParams>> = {
  fire: { fire: 0.9, fireRadius: 1.0, fireHeight: 3.0, col1: "#3d1200", col2: "#6b2800", col3: "#ff4500", skyColor: "#1a0800", fogColor: "#1a0800", fogDensity: 0.04, timeOfDay: 0.05, trees: 0.3 },
  burn: { fire: 0.8, col3: "#ff6020", skyColor: "#1a0800", timeOfDay: 0.05 },
  flame: { fire: 0.85, col3: "#ff5010", skyColor: "#1a0800", timeOfDay: 0.08 },
  blaze: { fire: 0.9, col3: "#ff4500", timeOfDay: 0.05 },
  bright: { stars: 0.3, timeOfDay: 0.45, turbulence: 0.05 },
  forest: { trees: 0.9, terrain: 0.5, col1: "#1a2d0f", col2: "#2d4a1e", col3: "#3a6b2e", skyColor: "#0f1a0a", fogColor: "#1a2d0f", fogDensity: 0.04, timeOfDay: 0.3 },
  tree: { trees: 0.7, terrain: 0.4, col1: "#1a2d0f", col2: "#2d4a1e", col3: "#3a6b2e" },
  wood: { trees: 0.6, terrain: 0.5, col1: "#2d1a0f", col2: "#4a2e1e", col3: "#6b4a2e" },
  night: { stars: 1.0, timeOfDay: 0.0, skyColor: "#020408", fogColor: "#050a10", fogDensity: 0.025 },
  dark: { stars: 0.5, timeOfDay: 0.02, skyColor: "#050a10", fogColor: "#050a10" },
  ocean: { water: 0.95, waterAmplitude: 0.4, waterFrequency: 1.2, col1: "#001a2e", col2: "#002d4e", col3: "#0066aa", skyColor: "#040e1a", fogColor: "#001a2e", fogDensity: 0.03 },
  sea: { water: 0.9, waterAmplitude: 0.3, waterFrequency: 1.0, col1: "#001a2e", col2: "#002d4e", col3: "#0044aa" },
  wave: { water: 0.8, waterAmplitude: 0.5, col3: "#0088cc" },
  river: { water: 0.6, waterAmplitude: 0.15, waterFrequency: 0.8, col3: "#0055aa" },
  rain: { water: 0.4, turbulence: 0.3, fogDensity: 0.05, col3: "#446688", skyColor: "#0a0f15" },
  mountain: { terrain: 0.9, terrainHeight: 5.0, terrainScale: 0.05, col1: "#1a1a1a", col2: "#3a3a3a", col3: "#ffffff", skyColor: "#0a1020", fogColor: "#1a2030" },
  snow: { terrain: 0.7, terrainHeight: 3.0, col1: "#d0d8e8", col2: "#e8f0f8", col3: "#ffffff", skyColor: "#1a2030", turbulence: 0.2 },
  ice: { water: 0.3, col1: "#b0c8e0", col2: "#c8e0f0", col3: "#e0f0ff", skyColor: "#0a1828" },
  star: { stars: 1.0, timeOfDay: 0.0, skyColor: "#010203", fogColor: "#010203", fogDensity: 0.01 },
  sky: { stars: 0.2, timeOfDay: 0.5, skyColor: "#1a60b0", fogColor: "#2060a0", fogDensity: 0.015 },
  cloud: { turbulence: 0.4, fogDensity: 0.04, skyColor: "#2a3040", timeOfDay: 0.45 },
  city: { buildings: 0.9, col1: "#0d0d1a", col2: "#1a1a2e", col3: "#4488ff", skyColor: "#050510", fogColor: "#0d0d1a", fogDensity: 0.035 },
  road: { terrain: 0.4, terrainScale: 0.05, col1: "#1a1a1a", col2: "#2a2a2a", col3: "#888888" },
  stone: { terrain: 0.5, columns: 0.3, col1: "#2a2520", col2: "#3a352e", col3: "#5a5048" },
  ruin: { terrain: 0.4, columns: 0.7, columnHeight: 2.0, col1: "#2a2010", col2: "#3a3020", col3: "#706040" },
  column: { columns: 0.8, columnHeight: 4.0, col1: "#2a2520", col2: "#3a352e", col3: "#8a7a60" },
  hope: { stars: 0.4, timeOfDay: 0.25, skyColor: "#1a2840", col3: "#ffd700", turbulence: 0.05 },
  dream: { stars: 0.6, turbulence: 0.15, col1: "#1a0d2e", col2: "#2e1a4a", col3: "#8844cc", fogDensity: 0.03 },
  death: { timeOfDay: 0.0, col1: "#0a0a0a", col2: "#111111", col3: "#333333", fogDensity: 0.06, stars: 0.1 },
  love: { col1: "#200a14", col2: "#3a0f20", col3: "#cc2244", timeOfDay: 0.25, turbulence: 0.08 },
  god: { stars: 0.7, col3: "#ffd700", timeOfDay: 0.28, turbulence: 0.05, spheres: 0.3 },
  sun: { timeOfDay: 0.5, col3: "#ffd700", skyColor: "#1a60b0", fogColor: "#3080c0", fogDensity: 0.01, stars: 0.0 },
  dawn: { timeOfDay: 0.25, col3: "#ff8844", skyColor: "#1a1428", fogColor: "#2a2040", fogDensity: 0.02 },
  sunset: { timeOfDay: 0.75, col3: "#ff6622", skyColor: "#1a0a20", fogColor: "#2a1030", fogDensity: 0.025 },
  autumn: { trees: 0.7, terrain: 0.4, col1: "#2a1500", col2: "#4a2800", col3: "#d4820a", timeOfDay: 0.4 },
  gold: { col3: "#d4a020", col2: "#4a3000", timeOfDay: 0.4 },
  yellow: { col3: "#d4c020", timeOfDay: 0.4 },
  sand: { terrain: 0.6, col1: "#2a2010", col2: "#4a3a20", col3: "#d4b060", turbulence: 0.2, fogDensity: 0.04 },
  desert: { terrain: 0.7, col1: "#3a2a10", col2: "#5a4020", col3: "#d4b060", turbulence: 0.25, fogDensity: 0.04 },
  bird: { spheres: 0.3, sphereY: 3.0, sphereRadius: 0.2, timeOfDay: 0.4 },
  wind: { turbulence: 0.5, fogDensity: 0.03 },
  mist: { fogDensity: 0.07, turbulence: 0.2, skyColor: "#1a1a28" },
  fog: { fogDensity: 0.08, turbulence: 0.3 },
  silence: { fogDensity: 0.02, turbulence: 0.0, timeOfDay: 0.0, stars: 0.5 },
  empty: { terrain: 0.1, turbulence: 0.0, fogDensity: 0.02 },
  vast: { terrain: 0.5, terrainScale: 0.04, fogDensity: 0.015 },
  eternal: { stars: 1.0, timeOfDay: 0.0, turbulence: 0.0 },
  time: { stars: 0.5, turbulence: 0.1 },
  ancient: { terrain: 0.5, columns: 0.4, turbulence: 0.15 },
};

export function analyzeLineLocally(line: string): Partial<SceneParams> {
  const lower = line.toLowerCase();
  const merged: Partial<SceneParams> = {};
  
  for (const [keyword, params] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      Object.assign(merged, params);
    }
  }
  
  return merged;
}

export function buildApproximateScene(line: string): SceneParams {
  const overrides = analyzeLineLocally(line);
  return { ...DEFAULT_SCENE, ...overrides };
}
