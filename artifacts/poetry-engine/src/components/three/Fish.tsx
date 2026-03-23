import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FishProps {
  position?: [number, number, number];
  scale?: number;
}

export function Fish({ position = [0, 4, -6], scale = 1.8 }: FishProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const pectoralLRef = useRef<THREE.Mesh>(null);
  const pectoralRRef = useRef<THREE.Mesh>(null);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#7ab8cc",
    roughness: 0.05,
    metalness: 0.92,
    emissive: new THREE.Color("#1a3a50"),
    emissiveIntensity: 0.6,
  }), []);

  const bellMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d0eef8",
    roughness: 0.1,
    metalness: 0.7,
    emissive: new THREE.Color("#88ccdd"),
    emissiveIntensity: 0.4,
  }), []);

  const finMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#55a0bb",
    roughness: 0.08,
    metalness: 0.85,
    transparent: true,
    opacity: 0.82,
    emissive: new THREE.Color("#113344"),
    emissiveIntensity: 0.5,
    side: THREE.DoubleSide,
  }), []);

  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffee00",
    emissive: new THREE.Color("#ffcc00"),
    emissiveIntensity: 8,
    roughness: 0.05,
  }), []);

  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#000000",
    roughness: 1,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(t * 0.28) * 2.5;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.42) * 0.9;
      groupRef.current.rotation.y = Math.sin(t * 0.28) * 0.2;
      groupRef.current.rotation.z = Math.sin(t * 0.42) * 0.06;
    }
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * 2.8) * 0.5;
    }
    if (pectoralLRef.current) {
      pectoralLRef.current.rotation.z = 0.5 + Math.sin(t * 2.8 + 0.5) * 0.25;
    }
    if (pectoralRRef.current) {
      pectoralRRef.current.rotation.z = -0.5 - Math.sin(t * 2.8 + 0.5) * 0.25;
    }
  });

  const sc = scale;

  return (
    <group ref={groupRef} position={position} scale={[sc, sc, sc]}>
      {/* ── BODY ── elongated torpedo shape */}
      <mesh material={bodyMat} castShadow>
        <capsuleGeometry args={[0.72, 2.2, 10, 20]} />
      </mesh>

      {/* Head bulge */}
      <mesh position={[0, 0, 1.55]} material={bodyMat} castShadow>
        <sphereGeometry args={[0.78, 22, 18]} />
      </mesh>

      {/* Belly lighter underside */}
      <mesh position={[0, -0.35, 0.4]} rotation={[0.2, 0, 0]} material={bellMat} castShadow>
        <capsuleGeometry args={[0.52, 1.6, 8, 14]} />
      </mesh>

      {/* Scale pattern — dark patches suggesting scale rows */}
      {[-0.8, -0.3, 0.2, 0.7].map((z, i) => (
        <mesh key={i} position={[0.68, 0.05, z]} rotation={[0, 0.3, 0]} material={bodyMat} castShadow>
          <sphereGeometry args={[0.12, 8, 6]} />
        </mesh>
      ))}
      {[-0.8, -0.3, 0.2, 0.7].map((z, i) => (
        <mesh key={i + 4} position={[-0.68, 0.05, z]} rotation={[0, -0.3, 0]} material={bodyMat} castShadow>
          <sphereGeometry args={[0.12, 8, 6]} />
        </mesh>
      ))}

      {/* ── MOUTH ── */}
      <mesh position={[0, -0.1, 2.3]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.24, 0.07, 8, 22, Math.PI * 0.65]} />
        <meshStandardMaterial color="#334455" roughness={0.9} />
      </mesh>

      {/* ── EYES ── */}
      <mesh position={[0.44, 0.18, 2.15]}>
        <sphereGeometry args={[0.18, 16, 14]} />
        <primitive object={eyeMat} attach="material" />
      </mesh>
      <mesh position={[-0.44, 0.18, 2.15]}>
        <sphereGeometry args={[0.18, 16, 14]} />
        <primitive object={eyeMat} attach="material" />
      </mesh>
      <mesh position={[0.44, 0.18, 2.32]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <primitive object={pupilMat} attach="material" />
      </mesh>
      <mesh position={[-0.44, 0.18, 2.32]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <primitive object={pupilMat} attach="material" />
      </mesh>
      <pointLight position={[0.5, 0.2, 2.5]} color="#ffcc00" intensity={5} distance={7} decay={2} />
      <pointLight position={[-0.5, 0.2, 2.5]} color="#ffcc00" intensity={5} distance={7} decay={2} />

      {/* ── DORSAL FIN ── */}
      <mesh position={[0, 0.95, 0.2]} rotation={[0, 0, 0]} material={finMat} castShadow>
        <coneGeometry args={[0.65, 1.35, 4]} />
      </mesh>

      {/* ── PECTORAL FINS ── */}
      <mesh ref={pectoralLRef} position={[0.82, -0.1, 0.9]} rotation={[0.15, 0, 0.5]} material={finMat} castShadow>
        <coneGeometry args={[0.45, 1.1, 3]} />
      </mesh>
      <mesh ref={pectoralRRef} position={[-0.82, -0.1, 0.9]} rotation={[0.15, 0, -0.5]} material={finMat} castShadow>
        <coneGeometry args={[0.45, 1.1, 3]} />
      </mesh>

      {/* ── VENTRAL FIN ── */}
      <mesh position={[0, -0.9, 0.0]} rotation={[0, 0, Math.PI]} material={finMat} castShadow>
        <coneGeometry args={[0.38, 0.9, 3]} />
      </mesh>

      {/* ── TAIL ── */}
      <group ref={tailRef} position={[0, 0, -1.65]}>
        <mesh position={[0,  0.55, -0.55]} rotation={[-0.55, 0, 0]} material={finMat} castShadow>
          <coneGeometry args={[0.65, 1.7, 4]} />
        </mesh>
        <mesh position={[0, -0.55, -0.55]} rotation={[0.55, 0, 0]} material={finMat} castShadow>
          <coneGeometry args={[0.65, 1.7, 4]} />
        </mesh>
        {/* tail base */}
        <mesh position={[0, 0, 0]} material={bodyMat} castShadow>
          <cylinderGeometry args={[0.28, 0.5, 0.6, 10]} />
        </mesh>
      </group>

      {/* Body glow */}
      <pointLight position={[0, 0, 0.5]} color="#88ddff" intensity={7} distance={12} decay={2} />
      <pointLight position={[0, 0, -0.5]} color="#44aacc" intensity={4} distance={10} decay={2} />
    </group>
  );
}
