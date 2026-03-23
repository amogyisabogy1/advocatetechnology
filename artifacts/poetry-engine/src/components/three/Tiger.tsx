import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A stylized 3D tiger built entirely from primitives
// Large, imposing, amber-striped — clearly a tiger

interface TigerProps {
  position?: [number, number, number];
  scale?: number;
}

function TigerStripe({ x, y, z, rx, ry, rz, w, h, d }: {
  x: number; y: number; z: number; rx?: number; ry?: number; rz?: number;
  w: number; h: number; d: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[rx ?? 0, ry ?? 0, rz ?? 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#1a0800" roughness={0.9} transparent opacity={0.85} />
    </mesh>
  );
}

export function Tiger({ position = [0, 0, -4], scale = 1 }: TigerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const tigerColor = "#cc5500";
  const bellyColor = "#f0c080";
  const tigerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: tigerColor, roughness: 0.8, metalness: 0.0,
    emissive: new THREE.Color("#551500"), emissiveIntensity: 0.15,
  }), []);
  const bellyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: bellyColor, roughness: 0.85, metalness: 0.0,
  }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ff8800", emissive: "#ff6600", emissiveIntensity: 4, roughness: 0.1,
  }), []);
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#000000", roughness: 1,
  }), []);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#cc3344", roughness: 0.8,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Slow breathing
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.025;
      bodyRef.current.scale.z = 1 + Math.sin(t * 1.2) * 0.015;
    }
    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * 0.9) * 0.5;
      tailRef.current.rotation.z = Math.sin(t * 1.1) * 0.18;
    }
    // Head slight movement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
      headRef.current.rotation.x = Math.sin(t * 0.55) * 0.04;
    }
    // Slow global sway
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.22) * 0.06;
    }
  });

  const sc = scale;

  return (
    <group ref={groupRef} position={position} scale={[sc, sc, sc]}>
      {/* ── BODY ── */}
      <mesh ref={bodyRef} position={[0, 2.2, 0]} material={tigerMat} castShadow>
        <sphereGeometry args={[1.45, 20, 14]} />
      </mesh>
      {/* body length extension */}
      <mesh position={[0, 2.2, -0.6]} material={tigerMat} castShadow>
        <capsuleGeometry args={[1.2, 2.2, 8, 16]} />
      </mesh>
      {/* belly */}
      <mesh position={[0, 1.6, 0.1]} rotation={[0.3, 0, 0]} material={bellyMat} castShadow>
        <sphereGeometry args={[0.85, 14, 10]} />
      </mesh>

      {/* ── STRIPES ON BODY ── */}
      <TigerStripe x={0.9}  y={2.4} z={0}    ry={0.3}  w={0.18} h={1.5} d={0.08} />
      <TigerStripe x={-0.9} y={2.4} z={0}    ry={-0.3} w={0.18} h={1.5} d={0.08} />
      <TigerStripe x={0.85} y={2.1} z={-0.9} ry={0.45} w={0.16} h={1.4} d={0.08} />
      <TigerStripe x={-0.85}y={2.1} z={-0.9} ry={-0.45}w={0.16} h={1.4} d={0.08} />
      <TigerStripe x={0.7}  y={2.0} z={-1.8} ry={0.55} w={0.14} h={1.3} d={0.08} />
      <TigerStripe x={-0.7} y={2.0} z={-1.8} ry={-0.55}w={0.14} h={1.3} d={0.08} />
      <TigerStripe x={0.5}  y={1.9} z={-2.6} ry={0.7}  w={0.13} h={1.2} d={0.08} />
      <TigerStripe x={-0.5} y={1.9} z={-2.6} ry={-0.7} w={0.13} h={1.2} d={0.08} />

      {/* ── HEAD ── */}
      <group ref={headRef} position={[0, 3.05, 1.5]}>
        {/* skull */}
        <mesh material={tigerMat} castShadow>
          <sphereGeometry args={[1.0, 20, 16]} />
        </mesh>
        {/* forehead bump */}
        <mesh position={[0, 0.5, 0.2]} material={tigerMat}>
          <sphereGeometry args={[0.55, 12, 10]} />
        </mesh>
        {/* muzzle */}
        <mesh position={[0, -0.2, 0.85]} material={bellyMat} castShadow>
          <sphereGeometry args={[0.52, 14, 12]} />
        </mesh>
        {/* nose */}
        <mesh position={[0, 0.04, 1.32]}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <primitive object={noseMat} attach="material" />
        </mesh>
        {/* cheek poufs */}
        <mesh position={[0.55, -0.2, 0.65]} material={bellyMat}>
          <sphereGeometry args={[0.38, 12, 10]} />
        </mesh>
        <mesh position={[-0.55, -0.2, 0.65]} material={bellyMat}>
          <sphereGeometry args={[0.38, 12, 10]} />
        </mesh>
        {/* ── EYES ── */}
        <mesh position={[0.4, 0.22, 0.82]}>
          <sphereGeometry args={[0.19, 14, 12]} />
          <primitive object={eyeMat} attach="material" />
        </mesh>
        <mesh position={[-0.4, 0.22, 0.82]}>
          <sphereGeometry args={[0.19, 14, 12]} />
          <primitive object={eyeMat} attach="material" />
        </mesh>
        {/* pupils */}
        <mesh position={[0.4, 0.22, 0.99]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <primitive object={pupilMat} attach="material" />
        </mesh>
        <mesh position={[-0.4, 0.22, 0.99]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <primitive object={pupilMat} attach="material" />
        </mesh>
        {/* ── EARS ── */}
        <mesh position={[0.7, 0.9, -0.1]} rotation={[0, 0, 0.25]} material={tigerMat} castShadow>
          <coneGeometry args={[0.28, 0.55, 8]} />
        </mesh>
        <mesh position={[-0.7, 0.9, -0.1]} rotation={[0, 0, -0.25]} material={tigerMat} castShadow>
          <coneGeometry args={[0.28, 0.55, 8]} />
        </mesh>
        {/* ear inner */}
        <mesh position={[0.7, 0.95, -0.05]} rotation={[0, 0, 0.25]}>
          <coneGeometry args={[0.14, 0.32, 8]} />
          <meshStandardMaterial color="#cc3355" roughness={0.9} />
        </mesh>
        <mesh position={[-0.7, 0.95, -0.05]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.14, 0.32, 8]} />
          <meshStandardMaterial color="#cc3355" roughness={0.9} />
        </mesh>
        {/* ── HEAD STRIPES ── */}
        <TigerStripe x={0.5}  y={0.5}  z={0.5} rx={0.4} ry={0.35} rz={0.1} w={0.12} h={0.7} d={0.06} />
        <TigerStripe x={-0.5} y={0.5}  z={0.5} rx={0.4} ry={-0.35} rz={-0.1} w={0.12} h={0.7} d={0.06} />
        <TigerStripe x={0}    y={0.2}  z={0.9} rx={0.2} ry={0} rz={0} w={0.1} h={0.5} d={0.06} />

        {/* Eye glow lights */}
        <pointLight position={[0.4, 0.22, 1.2]} color="#ff8800" intensity={3} distance={5} decay={2} />
        <pointLight position={[-0.4, 0.22, 1.2]} color="#ff8800" intensity={3} distance={5} decay={2} />
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 2.7, 1.05]} rotation={[0.45, 0, 0]} material={tigerMat} castShadow>
        <cylinderGeometry args={[0.7, 0.9, 1.1, 14]} />
      </mesh>

      {/* ── LEGS ── */}
      {/* Front legs */}
      <mesh position={[0.7, 1.05, 1.0]} rotation={[0.2, 0, 0.08]} material={tigerMat} castShadow>
        <capsuleGeometry args={[0.28, 1.3, 8, 12]} />
      </mesh>
      <mesh position={[-0.7, 1.05, 1.0]} rotation={[0.2, 0, -0.08]} material={tigerMat} castShadow>
        <capsuleGeometry args={[0.28, 1.3, 8, 12]} />
      </mesh>
      {/* paws front */}
      <mesh position={[0.72, 0.28, 1.35]} material={tigerMat} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
      </mesh>
      <mesh position={[-0.72, 0.28, 1.35]} material={tigerMat} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
      </mesh>
      {/* Back legs */}
      <mesh position={[0.75, 1.05, -1.6]} rotation={[-0.25, 0, 0.1]} material={tigerMat} castShadow>
        <capsuleGeometry args={[0.3, 1.4, 8, 12]} />
      </mesh>
      <mesh position={[-0.75, 1.05, -1.6]} rotation={[-0.25, 0, -0.1]} material={tigerMat} castShadow>
        <capsuleGeometry args={[0.3, 1.4, 8, 12]} />
      </mesh>
      {/* paws back */}
      <mesh position={[0.78, 0.28, -1.9]} material={tigerMat} castShadow>
        <sphereGeometry args={[0.34, 12, 10]} />
      </mesh>
      <mesh position={[-0.78, 0.28, -1.9]} material={tigerMat} castShadow>
        <sphereGeometry args={[0.34, 12, 10]} />
      </mesh>

      {/* ── TAIL ── */}
      <group ref={tailRef} position={[0, 2.4, -2.9]}>
        <mesh position={[0, 0.5, -0.5]} rotation={[0.7, 0, 0]} material={tigerMat} castShadow>
          <capsuleGeometry args={[0.2, 1.4, 6, 10]} />
        </mesh>
        <mesh position={[0.3, 1.3, -1.0]} rotation={[0.3, 0.3, 0.2]} material={tigerMat} castShadow>
          <capsuleGeometry args={[0.16, 1.2, 6, 10]} />
        </mesh>
        {/* tail tip */}
        <mesh position={[0.5, 1.8, -1.5]}>
          <sphereGeometry args={[0.25, 10, 8]} />
          <meshStandardMaterial color="#220800" roughness={0.9} />
        </mesh>
        {/* tail stripes */}
        <TigerStripe x={0.1} y={0.6} z={-0.6} rx={0.5} w={0.22} h={0.22} d={0.28} />
        <TigerStripe x={0.2} y={1.0} z={-0.95} rx={0.35} w={0.18} h={0.2} d={0.26} />
      </group>

      {/* Ground shadow glow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.2, 1.5, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#220800" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}
