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
  terrainScale: 0.08,
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
  sphereRadius: 0.5,
  sphereY: 1.0,
  stars: 0.8,
  turbulence: 0.1,
  col1: "#1a1a2e",
  col2: "#16213e",
  col3: "#0f3460",
  skyColor: "#060d1f",
  fogColor: "#0a0a1a",
  fogDensity: 0.03,
  timeOfDay: 0.0,
};

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}
