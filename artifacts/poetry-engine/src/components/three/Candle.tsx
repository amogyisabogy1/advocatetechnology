import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CandleProps {
  position?: [number, number, number];
  scale?: number;
}

export function Candle({ position = [0, -1, -3], scale = 1.6 }: CandleProps) {
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const flickerRef = useRef<THREE.PointLight>(null);
  const glassRef = useRef<THREE.Mesh>(null);

  const waxMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#f5edda",
    roughness: 0.92,
    metalness: 0.0,
    emissive: new THREE.Color("#3a2000"),
    emissiveIntensity: 0.08,
  }), []);

  const dripMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ede0c4",
    roughness: 0.95,
    metalness: 0.0,
  }), []);

  const flameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ff8800",
    emissive: new THREE.Color("#ff5500"),
    emissiveIntensity: 10,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  }), []);

  const innerFlameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: new THREE.Color("#ffeeaa"),
    emissiveIntensity: 14,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.x = 1 + Math.sin(t * 9.1) * 0.11 + Math.sin(t * 5.7) * 0.07;
      flameRef.current.scale.z = 1 + Math.cos(t * 7.8) * 0.09;
      flameRef.current.position.x = Math.sin(t * 4.3) * 0.05;
      flameRef.current.position.z = Math.cos(t * 3.7) * 0.04;
    }
    if (innerFlameRef.current) {
      innerFlameRef.current.scale.x = 1 + Math.sin(t * 12.3) * 0.14;
      innerFlameRef.current.position.x = Math.sin(t * 6.2) * 0.04;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 18 + Math.sin(t * 8.1) * 3.5 + Math.sin(t * 4.8) * 2.5;
    }
    if (flickerRef.current) {
      flickerRef.current.intensity = 4 + Math.sin(t * 11) * 2;
    }
    if (glassRef.current) {
      // Gentle warm glow pulse on the wax
      (glassRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.08 + Math.sin(t * 3) * 0.04;
    }
  });

  const sc = scale;

  return (
    <group position={position} scale={[sc, sc, sc]}>
      {/* ── CANDLE BODY ── */}
      <mesh ref={glassRef} position={[0, 1.5, 0]} castShadow material={waxMat}>
        <cylinderGeometry args={[0.42, 0.44, 3.0, 20]} />
      </mesh>

      {/* Wax pool at top */}
      <mesh position={[0, 3.03, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.06, 18]} />
        <meshStandardMaterial color="#ede0c4" roughness={0.9} emissive={new THREE.Color("#aa6600")} emissiveIntensity={0.3} />
      </mesh>

      {/* Wax drips — organic side runs */}
      <mesh position={[0.3, 2.4, 0.1]} rotation={[0.3, 0, 0.35]} material={dripMat} castShadow>
        <capsuleGeometry args={[0.055, 0.55, 4, 8]} />
      </mesh>
      <mesh position={[-0.25, 2.55, 0.18]} rotation={[0.2, 0, -0.25]} material={dripMat} castShadow>
        <capsuleGeometry args={[0.048, 0.4, 4, 8]} />
      </mesh>
      <mesh position={[0.08, 2.5, -0.32]} rotation={[0.4, 0, 0.1]} material={dripMat} castShadow>
        <capsuleGeometry args={[0.05, 0.45, 4, 8]} />
      </mesh>
      <mesh position={[-0.15, 2.3, -0.28]} rotation={[0.5, 0, -0.15]} material={dripMat} castShadow>
        <capsuleGeometry args={[0.042, 0.35, 4, 8]} />
      </mesh>

      {/* Wick */}
      <mesh position={[0, 3.17, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.28, 6]} />
        <meshStandardMaterial color="#1a1000" roughness={1} />
      </mesh>
      {/* Wick tip glow */}
      <mesh position={[0, 3.32, 0]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#ff8800" emissive={new THREE.Color("#ff6600")} emissiveIntensity={6} />
      </mesh>

      {/* ── FLAME ── */}
      {/* Outer flame — warm orange */}
      <mesh ref={flameRef} position={[0, 3.72, 0]}>
        <coneGeometry args={[0.2, 0.72, 10]} />
        <primitive object={flameMat} attach="material" />
      </mesh>
      {/* Inner flame — bright white-yellow core */}
      <mesh ref={innerFlameRef} position={[0, 3.58, 0]}>
        <coneGeometry args={[0.09, 0.42, 10]} />
        <primitive object={innerFlameMat} attach="material" />
      </mesh>

      {/* ── LIGHTS ── */}
      {/* Main warm glow from flame */}
      <pointLight ref={lightRef} position={[0, 3.7, 0]} color="#ff8800" intensity={18} distance={22} decay={2} />
      {/* Soft secondary fill */}
      <pointLight ref={flickerRef} position={[0, 3.5, 0]} color="#ffdd44" intensity={5} distance={10} decay={2} />
      {/* Very soft downward warm fill on wax */}
      <pointLight position={[0, 2.0, 0]} color="#cc5500" intensity={1.2} distance={5} decay={2} />
    </group>
  );
}
