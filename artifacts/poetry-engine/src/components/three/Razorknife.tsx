import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RazorknifeProps {
  position?: [number, number, number];
  scale?: number;
}

export function Razorknife({ position = [0, 3, -4], scale = 1.3 }: RazorknifeProps) {
  const groupRef = useRef<THREE.Group>(null);

  const bladeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d8e4f4",
    roughness: 0.01,
    metalness: 1.0,
    emissive: new THREE.Color("#223366"),
    emissiveIntensity: 0.4,
    envMapIntensity: 2.0,
  }), []);

  const edgeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: new THREE.Color("#88bbff"),
    emissiveIntensity: 5,
    roughness: 0.0,
    metalness: 1.0,
  }), []);

  const spine = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#b0bcd0",
    roughness: 0.04,
    metalness: 0.98,
    emissive: new THREE.Color("#1a2844"),
    emissiveIntensity: 0.2,
  }), []);

  const handleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1c1c22",
    roughness: 0.88,
    metalness: 0.08,
  }), []);

  const bolsterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#99aabb",
    roughness: 0.05,
    metalness: 0.95,
    emissive: new THREE.Color("#334466"),
    emissiveIntensity: 0.6,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!groupRef.current) return;
    // Slow dignified rotation — you're looking at the knife
    groupRef.current.rotation.y = Math.sin(t * 0.22) * 0.4;
    groupRef.current.rotation.z = Math.sin(t * 0.15) * 0.06;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.35) * 0.18;
  });

  const sc = scale;

  return (
    // Tilt so blade faces viewer, spine up
    <group ref={groupRef} position={position} scale={[sc, sc, sc]} rotation={[0.1, 0, -0.38]}>

      {/* ── BLADE MAIN BODY ── */}
      {/* Primary flat slab */}
      <mesh material={bladeMat} castShadow>
        <boxGeometry args={[3.8, 0.55, 0.09]} />
      </mesh>

      {/* Taper — blade gets thinner toward the tip */}
      <mesh position={[1.4, -0.08, 0]} rotation={[0, 0, 0.07]} material={bladeMat} castShadow>
        <boxGeometry args={[1.2, 0.4, 0.085]} />
      </mesh>

      {/* ── CURVED TIP (the "curved tip" part) ── */}
      {/* Curve segment 1 */}
      <mesh position={[2.2, 0.06, 0]} rotation={[0, 0, 0.45]} material={bladeMat} castShadow>
        <boxGeometry args={[0.7, 0.38, 0.075]} />
      </mesh>
      {/* Curve segment 2 */}
      <mesh position={[2.62, 0.3, 0]} rotation={[0, 0, 0.9]} material={bladeMat} castShadow>
        <boxGeometry args={[0.45, 0.28, 0.065]} />
      </mesh>
      {/* Very tip — sharp point */}
      <mesh position={[2.85, 0.54, 0]} rotation={[0, 0, 1.3]} material={bladeMat} castShadow>
        <boxGeometry args={[0.22, 0.14, 0.05]} />
      </mesh>

      {/* ── SHARP EDGE — bright emissive gleam along the cutting edge ── */}
      {/* Main straight edge */}
      <mesh position={[0, -0.26, 0.01]} material={edgeMat}>
        <boxGeometry args={[3.85, 0.025, 0.02]} />
      </mesh>
      {/* Curved edge segments */}
      <mesh position={[2.2, -0.12, 0.01]} rotation={[0, 0, 0.42]} material={edgeMat}>
        <boxGeometry args={[0.72, 0.022, 0.018]} />
      </mesh>
      <mesh position={[2.62, 0.12, 0.01]} rotation={[0, 0, 0.88]} material={edgeMat}>
        <boxGeometry args={[0.46, 0.02, 0.016]} />
      </mesh>
      <mesh position={[2.84, 0.42, 0.01]} rotation={[0, 0, 1.28]} material={edgeMat}>
        <boxGeometry args={[0.22, 0.016, 0.014]} />
      </mesh>

      {/* ── BLADE SPINE (thick top edge) ── */}
      <mesh position={[0.5, 0.3, 0]} material={spine} castShadow>
        <boxGeometry args={[3.0, 0.1, 0.13]} />
      </mesh>

      {/* ── GRIND LINES (horizontal polish marks on blade face) ── */}
      {[-0.05, 0.08, 0.18].map((y, i) => (
        <mesh key={i} position={[0.2, y, 0.045]}>
          <boxGeometry args={[3.2 - i * 0.3, 0.008, 0.002]} />
          <meshStandardMaterial color="#ffffff" emissive={new THREE.Color("#aaccff")} emissiveIntensity={2 - i * 0.4} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* ── BOLSTER (guard between blade and handle) ── */}
      <mesh position={[-1.95, 0.05, 0]} material={bolsterMat} castShadow>
        <boxGeometry args={[0.22, 0.9, 0.25]} />
      </mesh>
      {/* Bolster rivets */}
      <mesh position={[-1.95, 0.28, 0.1]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <primitive object={bolsterMat} attach="material" />
      </mesh>
      <mesh position={[-1.95, -0.18, 0.1]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <primitive object={bolsterMat} attach="material" />
      </mesh>

      {/* ── HANDLE ── */}
      {/* Main handle body */}
      <mesh position={[-2.85, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={handleMat} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 1.78, 12]} />
      </mesh>
      {/* Handle finger grooves */}
      {[-2.3, -2.7, -3.1, -3.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.27, 0.03, 8, 18]} />
          <meshStandardMaterial color="#0e0e14" roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {/* Handle end cap */}
      <mesh position={[-3.72, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={bolsterMat} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.18, 12]} />
      </mesh>

      {/* ── LIGHTS ── */}
      {/* Main gleam — bright cool light on blade face */}
      <pointLight position={[0, 2, 1.5]} color="#aaccff" intensity={12} distance={10} decay={2} />
      {/* Tip highlight */}
      <pointLight position={[3, 1.5, 1]} color="#ffffff" intensity={16} distance={7} decay={2} />
      {/* Edge gleam from below */}
      <pointLight position={[0, -1.5, 0.5]} color="#6699cc" intensity={6} distance={8} decay={2} />
      {/* Warm fill from handle side */}
      <pointLight position={[-3, 0, 1]} color="#ccddff" intensity={4} distance={8} decay={2} />
    </group>
  );
}
