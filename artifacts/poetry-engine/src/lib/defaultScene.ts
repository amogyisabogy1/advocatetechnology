import type { SceneParams } from "@workspace/api-client-react";

export const DEFAULT_SCENE: SceneParams = {
  terrain: 0.4,
  terrainHeight: 2.5,
  terrainScale: 1.5,
  water: 0.2,
  waterAmplitude: 0.3,
  waterFrequency: 1.0,
  trees: 0.3,
  buildings: 0,
  columns: 0,
  columnHeight: 6,
  columnRadius: 0.3,
  fire: 0,
  fireRadius: 0.5,
  fireHeight: 2,
  spheres: 0.2,
  sphereRadius: 0.8,
  sphereY: 4,
  stars: 0.7,
  turbulence: 0.1,
  col1: "#1a0a2e",
  col2: "#16213e",
  col3: "#0f3460",
  skyColor: "#060818",
  fogColor: "#0d1b2a",
  fogDensity: 0.015,
  timeOfDay: 0.0,
};

export const IDLE_SCENE: SceneParams = {
  ...DEFAULT_SCENE,
  stars: 0.9,
  terrain: 0.2,
  turbulence: 0.05,
  fogDensity: 0.008,
};
