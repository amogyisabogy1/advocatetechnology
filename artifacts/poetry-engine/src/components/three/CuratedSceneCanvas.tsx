import { useRef, useMemo, Suspense, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, AdaptiveDpr } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { SceneParams } from "@workspace/api-client-react";
import { Tiger } from "./Tiger";

function hex(h: string) {
  try { return new THREE.Color(h); } catch { return new THREE.Color("#ffffff"); }
}
function rand(min: number, max: number) { return min + Math.random() * (max - min); }

// ─── Camera ───────────────────────────────────────────────────────────────────

function CameraController({ params }: { params: SceneParams }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 5, 20));
  useEffect(() => {
    const a = params.cameraAngle ?? "horizon";
    const pos: [number, number, number] =
      a === "low"     ? [0, 2, 22] :
      a === "high"    ? [8, 22, 16] :
      a === "closeup" ? [0, 4, 12] :
      a === "wide"    ? [0, 7, 32] :
                        [0, 5, 20];
    targetPos.current.set(...pos);
  }, [params.cameraAngle]);
  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.04);
    camera.lookAt(0, 2, 0);
  });
  return null;
}

// ─── Ground Glow ──────────────────────────────────────────────────────────────

function GroundGlow({ params }: { params: SceneParams }) {
  const col = useMemo(() => hex(params.groundColor || "#0a0010"), [params.groundColor]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.3} roughness={1} />
    </mesh>
  );
}

// ─── Terrain ─────────────────────────────────────────────────────────────────

function Terrain({ params }: { params: SceneParams }) {
  if ((params.terrain ?? 0) < 0.05) return null;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(100, 100, 128, 128);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const h = params.terrainHeight ?? 3;
    const s = params.terrainScale ?? 1.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, params.terrain * (
        Math.sin(x * 0.07 * s) * Math.cos(z * 0.06 * s) * h +
        Math.sin(x * 0.2 * s + z * 0.15 * s) * h * 0.35 +
        Math.cos(x * 0.12 * s - z * 0.18 * s) * h * 0.2
      ));
    }
    g.computeVertexNormals();
    return g;
  }, [params.terrain, params.terrainHeight, params.terrainScale]);
  const col = useMemo(() => hex(params.groundColor || "#1a1a2e"), [params.groundColor]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={col} roughness={0.75} metalness={0.1} emissive={col} emissiveIntensity={0.1} />
    </mesh>
  );
}

// ─── Water ────────────────────────────────────────────────────────────────────

function Water({ params }: { params: SceneParams }) {
  if ((params.water ?? 0) < 0.05) return null;
  const meshRef = useRef<THREE.Mesh>(null);
  const col = useMemo(() => hex(params.waterColor || "#0044cc"), [params.waterColor]);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const amp = 0.4 + (params.turbulence ?? 0) * 1.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.4 + t * 1.2) * amp * 0.5 + Math.cos(z * 0.35 + t * 0.8) * amp * 0.5);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial color={col} roughness={0.05} metalness={0.85} transparent
        opacity={(params.waterOpacity ?? 0.85) * params.water} emissive={col} emissiveIntensity={0.25} />
    </mesh>
  );
}

// ─── Forest ───────────────────────────────────────────────────────────────────

function Forest({ params }: { params: SceneParams }) {
  const trees = useMemo(() => {
    if ((params.trees ?? 0) < 0.05) return [];
    const count = Math.floor(params.trees * 70);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand(-0.4, 0.4);
      const r = rand(6, 32);
      return { x: Math.cos(angle) * r + rand(-3, 3), z: Math.sin(angle) * r + rand(-3, 3), s: rand(0.5, 1.8), type: Math.floor(rand(0, 3)) };
    });
  }, [params.trees]);
  const col = useMemo(() => hex(params.treeColor || "#22aa44"), [params.treeColor]);
  const tipCol = useMemo(() => col.clone().multiplyScalar(1.6), [col]);
  const trunkCol = useMemo(() => new THREE.Color("#5a2e0e"), []);
  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          {t.type === 0 && <>
            <mesh position={[0, 2.0, 0]} castShadow>
              <coneGeometry args={[0.9, 3.8, 7]} />
              <meshStandardMaterial color={col} emissive={tipCol} emissiveIntensity={0.18} roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.0, 0]} castShadow>
              <coneGeometry args={[1.1, 2.6, 7]} />
              <meshStandardMaterial color={col} emissive={tipCol} emissiveIntensity={0.12} roughness={0.85} />
            </mesh>
          </>}
          {t.type === 1 && <mesh position={[0, 2.2, 0]} castShadow>
            <sphereGeometry args={[1.3, 10, 8]} />
            <meshStandardMaterial color={col} emissive={tipCol} emissiveIntensity={0.14} roughness={0.8} />
          </mesh>}
          {t.type === 2 && <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[0.55, 6, 5]} />
            <meshStandardMaterial color={col} emissive={tipCol} emissiveIntensity={0.12} roughness={0.9} />
          </mesh>}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 0.9, 6]} />
            <meshStandardMaterial color={trunkCol} roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Buildings ────────────────────────────────────────────────────────────────

function Buildings({ params }: { params: SceneParams }) {
  const buildings = useMemo(() => {
    if ((params.buildings ?? 0) < 0.05) return [];
    const count = Math.floor(params.buildings * 28);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = rand(5, 22);
      return { x: Math.cos(angle) * r + rand(-4, 4), z: Math.sin(angle) * r + rand(-4, 4), h: rand(4, 16 * params.buildings), w: rand(1.2, 2.8), hue: Math.random() };
    });
  }, [params.buildings]);
  return (
    <>
      {buildings.map((b, i) => {
        const bodyCol = new THREE.Color().setHSL(0.62, 0.3, 0.12);
        const winCol = new THREE.Color().setHSL(b.hue, 0.9, 0.7);
        return (
          <group key={i}>
            <mesh position={[b.x, b.h / 2, b.z]} castShadow>
              <boxGeometry args={[b.w, b.h, b.w]} />
              <meshStandardMaterial color={bodyCol} roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[b.x, b.h * 0.7, b.z]}>
              <boxGeometry args={[b.w * 0.6, b.h * 0.05, b.w * 0.6]} />
              <meshStandardMaterial color={winCol} emissive={winCol} emissiveIntensity={3.5} />
            </mesh>
            <pointLight position={[b.x, b.h * 0.8, b.z]} color={winCol} intensity={2} distance={8} decay={2} />
          </group>
        );
      })}
    </>
  );
}

// ─── Fire ─────────────────────────────────────────────────────────────────────

function Fire({ params }: { params: SceneParams }) {
  const fires = useMemo(() => {
    if ((params.fire ?? 0) < 0.05) return [];
    const count = Math.floor(params.fire * 10);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = i === 0 ? 0 : rand(2, 12);
      return { x: Math.cos(angle) * r, z: Math.sin(angle) * r, h: rand(1.5, 4.5) * params.fire, r: rand(0.3, 1.2) * params.fire, phase: rand(0, Math.PI * 2) };
    });
  }, [params.fire]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((mesh, i) => {
      if (!mesh || !fires[i]) return;
      const t = clock.elapsedTime + fires[i].phase;
      mesh.position.y = fires[i].h * 0.5 + Math.sin(t * 4) * 0.12;
      mesh.scale.x = 1 + Math.sin(t * 6) * 0.1;
      mesh.scale.z = 1 + Math.cos(t * 5) * 0.1;
    });
  });
  return (
    <>
      {fires.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh ref={el => { refs.current[i] = el; }} position={[0, f.h * 0.5, 0]}>
            <coneGeometry args={[f.r, f.h, 9]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff4400" emissiveIntensity={4.5} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, f.h * 0.28, 0]}>
            <coneGeometry args={[f.r * 0.5, f.h * 0.6, 7]} />
            <meshStandardMaterial color="#ffdd00" emissive="#ffcc00" emissiveIntensity={5.5} transparent opacity={0.75} />
          </mesh>
          <pointLight position={[0, f.h * 0.5, 0]} color="#ff6600" intensity={params.fire * 18} distance={16} decay={2} />
          <pointLight position={[0, 0.2, 0]} color="#ff3300" intensity={params.fire * 7} distance={7} decay={2} />
        </group>
      ))}
    </>
  );
}

// ─── Spheres ──────────────────────────────────────────────────────────────────

function Spheres({ params }: { params: SceneParams }) {
  const items = useMemo(() => {
    if ((params.spheres ?? 0) < 0.05) return [];
    const count = Math.floor(params.spheres * 14);
    return Array.from({ length: count }, () => ({
      x: rand(-25, 25), y: rand(2, 16), z: rand(-25, 25),
      r: rand(0.3, 2.0) * params.spheres, phase: rand(0, Math.PI * 2), speed: rand(0.2, 0.8), hue: Math.random(),
    }));
  }, [params.spheres]);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      if (i < items.length) child.position.y = items[i].y + Math.sin(clock.elapsedTime * items[i].speed + items[i].phase) * 1.4;
    });
  });
  return (
    <group ref={groupRef}>
      {items.map((s, i) => {
        const col = new THREE.Color().setHSL(s.hue, 0.9, 0.65);
        return (
          <group key={i} position={[s.x, s.y, s.z]}>
            <mesh>
              <sphereGeometry args={[s.r, 20, 16]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.4} roughness={0.05} metalness={0.95} transparent opacity={0.92} />
            </mesh>
            <pointLight color={col} intensity={2.5} distance={s.r * 9} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

// ─── Rings ────────────────────────────────────────────────────────────────────

function Rings({ params }: { params: SceneParams }) {
  const items = useMemo(() => {
    if ((params.rings ?? 0) < 0.05) return [];
    const count = Math.floor(params.rings * 10);
    return Array.from({ length: count }, (_, i) => ({
      x: rand(-14, 14), y: rand(3, 18), z: rand(-20, 5),
      r: rand(1.5, 6.5), rx: rand(0, Math.PI), ry: (i / count) * Math.PI * 2,
      phase: rand(0, Math.PI * 2), hue: Math.random(),
    }));
  }, [params.rings]);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      if (i < items.length) {
        child.rotation.y = clock.elapsedTime * 0.18 + items[i].phase;
        child.rotation.x = Math.sin(clock.elapsedTime * 0.1 + items[i].phase) * 0.3 + items[i].rx;
      }
    });
  });
  return (
    <group ref={groupRef}>
      {items.map((ring, i) => {
        const col = new THREE.Color().setHSL(ring.hue, 1.0, 0.7);
        return (
          <mesh key={i} position={[ring.x, ring.y, ring.z]}>
            <torusGeometry args={[ring.r, 0.07, 10, 80]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={3} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Giant Eye (for "What immortal hand or eye") ──────────────────────────────

function GiantEye({ params }: { params: SceneParams }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.08;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.15;
    const t = clock.elapsedTime;
    // pulsing
    const sc = 1 + Math.sin(t * 1.5) * 0.04;
    groupRef.current.scale.set(sc, sc, sc);
  });
  const irisCol = new THREE.Color("#ff8800");
  const pupilCol = new THREE.Color("#000000");
  const scleraCol = new THREE.Color("#ffffff");
  const glowCol = new THREE.Color("#ff6600");
  return (
    <group ref={groupRef} position={[0, 10, -20]}>
      {/* Sclera (white of eye) */}
      <mesh>
        <sphereGeometry args={[4.5, 32, 24]} />
        <meshStandardMaterial color={scleraCol} emissive={new THREE.Color("#ffccaa")} emissiveIntensity={0.3} roughness={0.1} />
      </mesh>
      {/* Iris */}
      <mesh position={[0, 0, 4.0]}>
        <sphereGeometry args={[2.2, 24, 20]} />
        <meshStandardMaterial color={irisCol} emissive={irisCol} emissiveIntensity={2.5} roughness={0.05} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 5.2]}>
        <sphereGeometry args={[1.0, 20, 16]} />
        <meshStandardMaterial color={pupilCol} roughness={0.1} />
      </mesh>
      {/* Glow rings around eye */}
      {[6, 7.5, 9.5].map((r, i) => {
        const c = new THREE.Color().setHSL(0.07 - i * 0.01, 1, 0.6 - i * 0.1);
        return (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <torusGeometry args={[r, 0.06, 10, 80]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.5} transparent opacity={0.7 - i * 0.15} />
          </mesh>
        );
      })}
      {/* Point light from the iris */}
      <pointLight position={[0, 0, 5]} color={glowCol} intensity={8} distance={30} decay={2} />
    </group>
  );
}

// ─── Ship Silhouette (for Whitman) ────────────────────────────────────────────

function CaptainShip({ params }: { params: SceneParams }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = -0.5 + Math.sin(t * 0.5) * 0.4;
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.04;
  });
  const woodCol = new THREE.Color("#3a2010");
  const sailCol = new THREE.Color("#e8e0cc");
  return (
    <group ref={groupRef} position={[0, 0, -8]}>
      {/* hull */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[8, 1.8, 3]} />
        <meshStandardMaterial color={woodCol} roughness={0.9} />
      </mesh>
      {/* hull bow */}
      <mesh position={[4.5, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.5, 1.2, 3]} />
        <meshStandardMaterial color={woodCol} roughness={0.9} />
      </mesh>
      {/* mast */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 10, 8]} />
        <meshStandardMaterial color={woodCol} roughness={0.9} />
      </mesh>
      {/* main sail */}
      <mesh position={[0, 5.5, 0.05]}>
        <planeGeometry args={[5, 6]} />
        <meshStandardMaterial color={sailCol} side={THREE.DoubleSide} transparent opacity={0.9} roughness={0.9}
          emissive={new THREE.Color("#aaaacc")} emissiveIntensity={0.1} />
      </mesh>
      {/* top sail */}
      <mesh position={[0, 9.2, 0.05]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color={sailCol} side={THREE.DoubleSide} transparent opacity={0.85} roughness={0.9} />
      </mesh>
      {/* flag */}
      <mesh position={[0, 10.5, 0.1]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[1.2, 0.7]} />
        <meshStandardMaterial color="#dd2233" emissive={new THREE.Color("#cc2233")} emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* lantern */}
      <mesh position={[4, 2.5, 0]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#ffdd88" emissive={new THREE.Color("#ffdd88")} emissiveIntensity={3} />
      </mesh>
      <pointLight position={[4, 2.5, 0]} color="#ffcc44" intensity={6} distance={12} decay={2} />
    </group>
  );
}

// ─── Particles ────────────────────────────────────────────────────────────────

type ParticleMotion = "still" | "float" | "rain" | "rise" | "spiral" | "orbit" | "scatter" | "drift" | "pulse";

function ParticleSystem({ params }: { params: SceneParams }) {
  if ((params.particles ?? 0) < 0.05) return null;
  const count = Math.min(8000, Math.floor((params.particleCount ?? 2000) * Math.max(params.particles, 0.4)));
  const spread = params.particleSpread ?? 30;
  const motion = (params.particleMotion ?? "float") as ParticleMotion;
  const pSize = params.particleSize ?? 0.06;
  const pColor = useMemo(() => hex(params.particleColor || "#aabbff"), [params.particleColor]);

  const { positions, origPositions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (motion === "rain") {
        positions[i3] = rand(-spread, spread); positions[i3 + 1] = rand(0, 22); positions[i3 + 2] = rand(-spread, spread);
      } else if (motion === "rise") {
        positions[i3] = rand(-spread * 0.5, spread * 0.5); positions[i3 + 1] = rand(-2, 10); positions[i3 + 2] = rand(-spread * 0.5, spread * 0.5);
      } else if (motion === "spiral") {
        const angle = rand(0, Math.PI * 2), r = rand(0, spread * 0.5);
        positions[i3] = Math.cos(angle) * r; positions[i3 + 1] = rand(0, 18); positions[i3 + 2] = Math.sin(angle) * r;
      } else if (motion === "orbit") {
        const angle = rand(0, Math.PI * 2), r = rand(3, spread * 0.4), tilt = rand(-0.5, 0.5);
        positions[i3] = Math.cos(angle) * r; positions[i3 + 1] = rand(1, 14) + Math.sin(angle) * r * tilt; positions[i3 + 2] = Math.sin(angle) * r;
      } else {
        positions[i3] = rand(-spread, spread); positions[i3 + 1] = rand(0, 20); positions[i3 + 2] = rand(-spread, spread);
      }
      phases[i] = rand(0, Math.PI * 2);
    }
    return { positions, origPositions: positions.slice(), phases };
  }, [count, spread, motion]);

  const posRef = useRef(origPositions.slice());
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const t = params.turbulence ?? 0;

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const time = clock.elapsedTime;
    const pos = posRef.current;
    const speed = 0.35 + t * 1.5;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3, ph = phases[i];
      if (motion === "float") {
        pos[i3 + 1] = origPositions[i3 + 1] + Math.sin(time * speed * 0.35 + ph) * 2;
        pos[i3]     = origPositions[i3]     + Math.sin(time * 0.12 + ph) * 1.2;
        pos[i3 + 2] = origPositions[i3 + 2] + Math.cos(time * 0.10 + ph) * 1.2;
      } else if (motion === "rain") {
        pos[i3 + 1] -= speed * 0.09;
        if (pos[i3 + 1] < -2) pos[i3 + 1] = 22;
        pos[i3] = origPositions[i3] + Math.sin(time * 0.3 + ph) * t * 2;
      } else if (motion === "rise") {
        pos[i3 + 1] += speed * 0.035;
        if (pos[i3 + 1] > 22) pos[i3 + 1] = -2;
        pos[i3]     = origPositions[i3]     + Math.sin(time * 0.5 + ph) * 0.6;
        pos[i3 + 2] = origPositions[i3 + 2] + Math.cos(time * 0.4 + ph) * 0.6;
      } else if (motion === "spiral") {
        const angle = time * speed * 0.2 + ph;
        const r = Math.sqrt(origPositions[i3] ** 2 + origPositions[i3 + 2] ** 2);
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 2] = Math.sin(angle) * r;
        pos[i3 + 1] = origPositions[i3 + 1] + Math.sin(time * 0.3 + ph) * 1.5;
      } else if (motion === "orbit") {
        const r = Math.sqrt(origPositions[i3] ** 2 + origPositions[i3 + 2] ** 2);
        const baseA = Math.atan2(origPositions[i3 + 2], origPositions[i3]);
        const a = baseA + time * speed * 0.15;
        pos[i3] = Math.cos(a) * r;
        pos[i3 + 2] = Math.sin(a) * r;
        pos[i3 + 1] = origPositions[i3 + 1] + Math.sin(time * 0.4 + ph) * 0.8;
      } else if (motion === "scatter") {
        pos[i3]     = origPositions[i3]     + Math.sin(time * speed * 0.3 + ph) * t * 4;
        pos[i3 + 1] = origPositions[i3 + 1] + Math.cos(time * speed * 0.2 + ph * 1.3) * t * 2.5;
        pos[i3 + 2] = origPositions[i3 + 2] + Math.sin(time * speed * 0.25 + ph * 0.7) * t * 4;
      } else if (motion === "drift") {
        pos[i3]     = origPositions[i3]     + Math.sin(time * 0.08 + ph) * 4;
        pos[i3 + 1] = origPositions[i3 + 1] + Math.sin(time * 0.06 + ph * 1.5) * 2;
        pos[i3 + 2] = origPositions[i3 + 2] + Math.cos(time * 0.07 + ph) * 3;
      } else if (motion === "pulse") {
        const sc = 1 + Math.sin(time * 2 + ph) * 0.35;
        pos[i3]     = origPositions[i3]     * sc;
        pos[i3 + 1] = origPositions[i3 + 1] + Math.sin(time + ph) * 1.5;
        pos[i3 + 2] = origPositions[i3 + 2] * sc;
      }
    }
    const attr = geoRef.current.attributes.position as THREE.BufferAttribute;
    attr.set(pos);
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" array={posRef.current} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={pColor} size={pSize} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

// ─── Lighting ─────────────────────────────────────────────────────────────────

function Lighting({ params }: { params: SceneParams }) {
  const ambCol = useMemo(() => hex(params.ambientColor || "#111133"), [params.ambientColor]);
  const lightCol = useMemo(() => hex(params.lightColor || "#ffffff"), [params.lightColor]);
  const intensity = params.lightIntensity ?? 1.5;
  const tod = params.timeOfDay ?? 0;
  const sunY = Math.abs(Math.sin(tod * Math.PI)) * 28 + 4;
  const sunX = Math.cos(tod * Math.PI * 2) * 40;
  return (
    <>
      <ambientLight intensity={0.2 + tod * 0.2} color={ambCol} />
      <directionalLight position={[sunX, sunY, 20]} intensity={intensity} color={lightCol} castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-sunX * 0.5, sunY * 0.3, -15]} intensity={intensity * 0.3} color={lightCol} />
    </>
  );
}

// ─── Post FX ──────────────────────────────────────────────────────────────────

function PostFX({ params, customScene }: { params: SceneParams; customScene?: string }) {
  const hasFire = (params.fire ?? 0) > 0.3 || customScene === "tiger";
  const hasRings = (params.rings ?? 0) > 0.2;
  const hasSpheres = (params.spheres ?? 0) > 0.2;
  const hasEye = customScene === "eye";
  const bloomStrength = hasEye ? 1.8 : hasFire ? 1.5 : hasRings || hasSpheres ? 1.2 : 0.7;
  return (
    <EffectComposer>
      <Bloom intensity={bloomStrength} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur />
      {(hasFire || hasEye) && (
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.001, 0.001]} radialModulation={false} modulationOffset={0} />
      )}
    </EffectComposer>
  );
}

// ─── Scene Content ────────────────────────────────────────────────────────────

function SceneContent({ params, customScene }: { params: SceneParams; customScene?: string }) {
  const fogCol = useMemo(() => hex(params.fogColor || "#0a0d1a"), [params.fogColor]);
  return (
    <>
      <fog attach="fog" args={[fogCol, 14, 90]} />
      <CameraController params={params} />
      <Lighting params={params} />
      <GroundGlow params={params} />
      <Terrain params={params} />
      <Water params={params} />
      <Forest params={params} />
      <Buildings params={params} />
      <Fire params={params} />
      <Spheres params={params} />
      <Rings params={params} />
      {customScene === "tiger" && <Tiger position={[0, 0, -2]} scale={1.4} />}
      {customScene === "eye" && <GiantEye params={params} />}
      {customScene === "captain" && <CaptainShip params={params} />}
      <ParticleSystem params={params} />
      {(params.stars ?? 0) > 0.2 && (
        <Stars radius={90} depth={60} count={Math.floor(params.stars * 7000)} factor={5} saturation={0.8} fade speed={(params.turbulence ?? 0) * 0.5 + 0.08} />
      )}
      <PostFX params={params} customScene={customScene} />
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface CuratedSceneCanvasProps {
  params: SceneParams;
  isTransitioning: boolean;
  customScene?: string;
}

export function CuratedSceneCanvas({ params, isTransitioning, customScene }: CuratedSceneCanvasProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const checkWebGL = useCallback(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebglOk(!!gl);
    } catch { setWebglOk(false); }
  }, []);
  useEffect(() => { checkWebGL(); }, [checkWebGL]);

  const style: React.CSSProperties = { opacity: isTransitioning ? 0.25 : 1, transition: "opacity 0.5s ease" };

  if (webglOk === false) {
    return (
      <div className="absolute inset-0" style={style}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 40% 60%, ${params.groundColor || "#2a1060"} 0%, ${params.skyColor || "#060818"} 100%)` }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={style}>
      <Canvas
        camera={{ position: [0, 5, 20], fov: 62, near: 0.1, far: 250 }}
        shadows="soft"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        style={{ background: params.skyColor || "#03050f" }}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFShadowMap; }}
      >
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneContent params={params} customScene={customScene} />
        </Suspense>
      </Canvas>
    </div>
  );
}
