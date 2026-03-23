import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface VortexProps {
  position?: [number, number, number];
}

export function Vortex({ position = [0, 3, -10] }: VortexProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  // Ring layers: 18 rings tightening into a funnel
  const rings = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const t = i / 17;
    return {
      y: 14 - t * 18,
      radius: 9.5 * Math.pow(1 - t, 0.7),
      tube: 0.18 + (1 - t) * 0.08,
      hue: 0.72 + t * 0.08,
      brightness: 0.55 + t * 0.35,
      opacity: 0.45 + t * 0.55,
    };
  }), []);

  // Inner spiral of smaller rings
  const innerRings = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const t = i / 7;
    return {
      y: -2 - t * 5,
      radius: 0.8 + t * 2.5,
      hue: 0.8 + t * 0.05,
    };
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = -t * 0.45;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.9;
      innerRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main vortex funnel */}
      <group ref={groupRef}>
        {rings.map((ring, i) => {
          const col = new THREE.Color().setHSL(ring.hue, 1.0, ring.brightness);
          return (
            <mesh key={i} position={[0, ring.y, 0]}>
              <torusGeometry args={[ring.radius, ring.tube, 10, 64]} />
              <meshStandardMaterial
                color={col}
                emissive={col}
                emissiveIntensity={4}
                transparent
                opacity={ring.opacity}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* Cross-spokes to reinforce the funnel structure */}
        {[0, 1, 2, 3].map(s => {
          const angle = (s / 4) * Math.PI * 2;
          return (
            <mesh key={"spoke" + s} position={[0, 4, 0]} rotation={[Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4]}>
              <cylinderGeometry args={[0.04, 0.04, 18, 6]} />
              <meshStandardMaterial color="#8844ff" emissive={new THREE.Color("#6633cc")} emissiveIntensity={3} transparent opacity={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* Inner tight spiral at the center/bottom */}
      <group ref={innerRef}>
        {innerRings.map((ring, i) => {
          const col = new THREE.Color().setHSL(ring.hue, 1.0, 0.8);
          return (
            <mesh key={i} position={[0, ring.y, 0]}>
              <torusGeometry args={[ring.radius, 0.12, 8, 48]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={6} transparent opacity={0.9} depthWrite={false} />
            </mesh>
          );
        })}
      </group>

      {/* Center singularity */}
      <mesh position={[0, -6, 0]}>
        <sphereGeometry args={[0.35, 14, 12]} />
        <meshStandardMaterial color="#ffffff" emissive={new THREE.Color("#ccaaff")} emissiveIntensity={12} />
      </mesh>

      {/* Lights */}
      <pointLight position={[0, -5, 0]} color="#9944ff" intensity={25} distance={28} decay={2} />
      <pointLight position={[0, 8, 0]} color="#4466ff" intensity={12} distance={35} decay={2} />
      <pointLight position={[0, 2, 0]} color="#6633cc" intensity={8} distance={20} decay={2} />
    </group>
  );
}
