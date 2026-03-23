import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GashesProps {
  count?: number;
}

export function Gashes({ count = 6 }: GashesProps) {
  const groupRef = useRef<THREE.Group>(null);

  const woundMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#bb0015",
    emissive: new THREE.Color("#ff001a"),
    emissiveIntensity: 5,
    roughness: 0.05,
    metalness: 0.3,
    side: THREE.DoubleSide,
    depthWrite: true,
  }), []);

  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#3a0008",
    emissive: new THREE.Color("#660010"),
    emissiveIntensity: 3,
    roughness: 0.6,
    side: THREE.DoubleSide,
  }), []);

  const dripMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#880010",
    emissive: new THREE.Color("#cc0018"),
    emissiveIntensity: 2.5,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  }), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.15;
    groupRef.current.rotation.x = Math.sin(t * 0.17) * 0.06;
    // Pulsing glow on each gash
    groupRef.current.children.forEach((child, i) => {
      const pulse = 0.92 + Math.sin(t * 2.1 + i * 1.3) * 0.08;
      child.scale.set(pulse, pulse, pulse);
    });
  });

  // Hand-placed gashes — varied positions, angles, sizes
  const gashDefs = [
    { x: -2.2, y: 5.5, z: -1,   rx: 0.25, ry:  0.5, rz:  0.85, w: 2.8, h: 0.3,  drips: 2 },
    { x:  2.5, y: 7.5, z: -2.5, rx: -0.2, ry: -0.4, rz: -0.55, w: 3.2, h: 0.35, drips: 3 },
    { x: -0.4, y: 9.2, z: -0.5, rx:  0.1, ry:  0.7, rz:  1.2,  w: 2.0, h: 0.25, drips: 1 },
    { x:  1.2, y: 3.8, z: -3.5, rx:  0.45, ry: -0.15, rz: 0.3, w: 3.8, h: 0.4,  drips: 4 },
    { x: -2.8, y: 8.2, z:  0.5, rx: -0.35, ry: 0.9, rz: -0.9,  w: 2.2, h: 0.28, drips: 2 },
    { x:  0.6, y: 11.2, z: -1.5, rx: 0.15, ry: -0.6, rz: 0.55, w: 1.8, h: 0.22, drips: 1 },
  ];

  return (
    <group ref={groupRef}>
      {gashDefs.slice(0, count).map((g, i) => (
        <group key={i} position={[g.x, g.y, g.z]} rotation={[g.rx, g.ry, g.rz]}>
          {/* Gash surface — the red slash */}
          <mesh material={woundMat} castShadow>
            <boxGeometry args={[g.w, g.h, 0.05]} />
          </mesh>

          {/* Inner darkness — the wound depth */}
          <mesh position={[0, 0, -0.025]} material={innerMat}>
            <boxGeometry args={[g.w * 0.8, g.h * 0.55, 0.08]} />
          </mesh>

          {/* Jagged torn edges — top */}
          {Array.from({ length: 5 }).map((_, j) => {
            const ex = (j / 4 - 0.5) * g.w * 0.8;
            const h2 = 0.08 + Math.abs(Math.sin(i * 7 + j * 3.1)) * 0.18;
            return (
              <mesh key={"t" + j} position={[ex, g.h * 0.5 + h2 * 0.5, 0]}
                rotation={[0, 0, Math.sin(i + j * 1.7) * 0.5]} material={woundMat}>
                <coneGeometry args={[0.065, h2, 3]} />
              </mesh>
            );
          })}
          {/* Jagged torn edges — bottom */}
          {Array.from({ length: 4 }).map((_, j) => {
            const ex = (j / 3 - 0.5) * g.w * 0.7;
            const h2 = 0.06 + Math.abs(Math.cos(i * 5 + j * 2.3)) * 0.14;
            return (
              <mesh key={"b" + j} position={[ex, -g.h * 0.5 - h2 * 0.5, 0]}
                rotation={[Math.PI, 0, Math.sin(i + j * 2.3) * 0.5]} material={woundMat}>
                <coneGeometry args={[0.055, h2, 3]} />
              </mesh>
            );
          })}

          {/* Blood drips hanging below */}
          {Array.from({ length: g.drips }).map((_, d) => {
            const dx = (d / (g.drips - 1 || 1) - 0.5) * g.w * 0.6;
            const dl = 0.3 + Math.abs(Math.sin(i * 4 + d * 2.2)) * 0.7;
            return (
              <mesh key={"d" + d} position={[dx, -g.h * 0.5 - dl * 0.5 - 0.12, 0.02]} material={dripMat}>
                <capsuleGeometry args={[0.045, dl, 4, 8]} />
              </mesh>
            );
          })}

          {/* Wound glow */}
          <pointLight position={[0, 0, 0.3]} color="#ff0022" intensity={5} distance={7} decay={2} />
        </group>
      ))}
    </group>
  );
}
