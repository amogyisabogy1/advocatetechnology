import {
  useRef,
  useMemo,
  Suspense,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import type { SceneParams } from "@workspace/api-client-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function hex(h: string) {
  try {
    return new THREE.Color(h);
  } catch {
    return new THREE.Color("#ffffff");
  }
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── Camera Controller ───────────────────────────────────────────────────────

function CameraController({ params }: { params: SceneParams }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());
  const posRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const angle = params.cameraAngle ?? "horizon";
    let pos: [number, number, number];

    switch (angle) {
      case "low":
        pos = [0, 2, 22];
        break;
      case "high":
        pos = [8, 20, 16];
        break;
      case "closeup":
        pos = [0, 3, 10];
        break;
      case "wide":
        pos = [0, 6, 30];
        break;
      default: // horizon
        pos = [0, 5, 20];
    }
    posRef.current.set(...pos);
    targetRef.current.set(0, 0, 0);
  }, [params.cameraAngle]);

  useFrame(() => {
    camera.position.lerp(posRef.current, 0.04);
    const lp = new THREE.Vector3().lerp(targetRef.current, 0.04);
    camera.lookAt(lp);
  });

  return null;
}

// ─── Terrain ─────────────────────────────────────────────────────────────────

function Terrain({ params }: { params: SceneParams }) {
  if (params.terrain < 0.05) return null;

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(100, 100, 120, 120);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const h = params.terrainHeight ?? 3;
    const s = params.terrainScale ?? 1.5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        params.terrain *
        (Math.sin(x * 0.07 * s) * Math.cos(z * 0.06 * s) * h +
          Math.sin(x * 0.2 * s + z * 0.15 * s) * h * 0.35 +
          Math.cos(x * 0.12 * s - z * 0.18 * s) * h * 0.2);
      pos.setY(i, y);
    }
    g.computeVertexNormals();
    return g;
  }, [params.terrain, params.terrainHeight, params.terrainScale]);

  const col = useMemo(() => hex(params.groundColor || "#1a1a2e"), [params.groundColor]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && (params.turbulence ?? 0) > 0.5) {
      meshRef.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.15 * params.turbulence) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geo} receiveShadow>
      <meshStandardMaterial color={col} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

// ─── Water ───────────────────────────────────────────────────────────────────

function Water({ params }: { params: SceneParams }) {
  if ((params.water ?? 0) < 0.05) return null;
  const meshRef = useRef<THREE.Mesh>(null);
  const col = useMemo(() => hex(params.waterColor || "#0a1f3c"), [params.waterColor]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const amp = 0.4 + (params.turbulence ?? 0) * 1.2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(
        i,
        Math.sin(x * 0.4 + t * 1.2) * amp * 0.5 +
          Math.cos(z * 0.35 + t * 0.8) * amp * 0.5
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
    >
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial
        color={col}
        roughness={0.08}
        metalness={0.7}
        transparent
        opacity={(params.waterOpacity ?? 0.85) * params.water}
      />
    </mesh>
  );
}

// ─── Trees ───────────────────────────────────────────────────────────────────

function Forest({ params }: { params: SceneParams }) {
  const trees = useMemo(() => {
    if ((params.trees ?? 0) < 0.05) return [];
    const count = Math.floor(params.trees * 60);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand(-0.4, 0.4);
      const r = rand(6, 28);
      return {
        x: Math.cos(angle) * r + rand(-3, 3),
        z: Math.sin(angle) * r + rand(-3, 3),
        s: rand(0.5, 1.6),
        type: Math.floor(rand(0, 3)),
      };
    });
  }, [params.trees]);

  const col = useMemo(() => hex(params.treeColor || "#1a3320"), [params.treeColor]);
  const trunkCol = useMemo(() => new THREE.Color("#2d1a0e"), []);

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          {t.type === 0 && (
            <>
              <mesh position={[0, 1.8, 0]} castShadow>
                <coneGeometry args={[0.9, 3.5, 7]} />
                <meshStandardMaterial color={col} roughness={0.95} />
              </mesh>
              <mesh position={[0, 0.9, 0]} castShadow>
                <coneGeometry args={[1.1, 2.5, 7]} />
                <meshStandardMaterial color={col} roughness={0.95} />
              </mesh>
            </>
          )}
          {t.type === 1 && (
            <mesh position={[0, 2, 0]} castShadow>
              <sphereGeometry args={[1.2, 8, 6]} />
              <meshStandardMaterial color={col} roughness={0.95} />
            </mesh>
          )}
          {t.type === 2 && (
            <mesh position={[0, 2.5, 0]} castShadow>
              <coneGeometry args={[0.6, 5, 5]} />
              <meshStandardMaterial color={col} roughness={0.95} />
            </mesh>
          )}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 0.9, 6]} />
            <meshStandardMaterial color={trunkCol} roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Buildings ───────────────────────────────────────────────────────────────

function Buildings({ params }: { params: SceneParams }) {
  const buildings = useMemo(() => {
    if ((params.buildings ?? 0) < 0.05) return [];
    const count = Math.floor(params.buildings * 25);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = rand(5, 22);
      return {
        x: Math.cos(angle) * r + rand(-4, 4),
        z: Math.sin(angle) * r + rand(-4, 4),
        h: rand(3, 14 * params.buildings),
        w: rand(1, 2.5),
        emissive: rand(0, 1) > 0.6,
      };
    });
  }, [params.buildings]);

  const col = useMemo(() => new THREE.Color("#1c1c2e"), []);
  const winCol = useMemo(() => new THREE.Color("#ffee88"), []);

  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial
            color={col}
            roughness={0.4}
            metalness={0.5}
            emissive={b.emissive ? winCol : col}
            emissiveIntensity={b.emissive ? 0.15 : 0}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Columns / Ruins ─────────────────────────────────────────────────────────

function Ruins({ params }: { params: SceneParams }) {
  const cols = useMemo(() => {
    if ((params.columns ?? 0) < 0.05) return [];
    const count = Math.floor(params.columns * 16);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = rand(5, 14);
      return {
        x: Math.cos(angle) * r + rand(-2, 2),
        z: Math.sin(angle) * r + rand(-2, 2),
        h: rand(3, 10),
        broken: Math.random() > 0.5,
        lean: rand(-0.05, 0.05),
      };
    });
  }, [params.columns]);

  const col = useMemo(() => new THREE.Color("#c8b89a"), []);

  return (
    <>
      {cols.map((c, i) => (
        <group
          key={i}
          position={[c.x, 0, c.z]}
          rotation={[c.lean, 0, c.lean * 0.5]}
        >
          <mesh position={[0, (c.broken ? c.h * 0.5 : c.h) / 2, 0]} castShadow>
            <cylinderGeometry
              args={[0.3, 0.38, c.broken ? c.h * 0.55 : c.h, 12]}
            />
            <meshStandardMaterial color={col} roughness={0.95} />
          </mesh>
          {!c.broken && (
            <mesh position={[0, c.h + 0.18, 0]}>
              <boxGeometry args={[1.0, 0.3, 1.0]} />
              <meshStandardMaterial color={col} roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

// ─── Fire ────────────────────────────────────────────────────────────────────

function Fire({ params }: { params: SceneParams }) {
  const fires = useMemo(() => {
    if ((params.fire ?? 0) < 0.05) return [];
    const count = Math.floor(params.fire * 10);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = i === 0 ? 0 : rand(2, 12);
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        h: rand(1.5, 4) * params.fire,
        r: rand(0.3, 1.2) * params.fire,
        phase: rand(0, Math.PI * 2),
      };
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
          <mesh
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[0, f.h * 0.5, 0]}
          >
            <coneGeometry args={[f.r, f.h, 9]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff6600"
              emissiveIntensity={2.5}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* inner flame */}
          <mesh position={[0, f.h * 0.3, 0]}>
            <coneGeometry args={[f.r * 0.5, f.h * 0.6, 7]} />
            <meshStandardMaterial
              color="#ffcc00"
              emissive="#ffaa00"
              emissiveIntensity={3}
              transparent
              opacity={0.7}
            />
          </mesh>
          <pointLight
            position={[0, f.h * 0.5, 0]}
            color="#ff5500"
            intensity={params.fire * 12}
            distance={10}
            decay={2}
          />
        </group>
      ))}
    </>
  );
}

// ─── Spheres ─────────────────────────────────────────────────────────────────

function Spheres({ params }: { params: SceneParams }) {
  const items = useMemo(() => {
    if ((params.spheres ?? 0) < 0.05) return [];
    const count = Math.floor(params.spheres * 14);
    return Array.from({ length: count }, () => ({
      x: rand(-25, 25),
      y: rand(2, 14),
      z: rand(-25, 25),
      r: rand(0.3, 1.8) * params.spheres,
      phase: rand(0, Math.PI * 2),
      speed: rand(0.2, 0.8),
    }));
  }, [params.spheres]);

  const col = useMemo(
    () => hex(params.sphereColor || "#8888ff"),
    [params.sphereColor]
  );
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      if (i < items.length) {
        child.position.y =
          items[i].y + Math.sin(clock.elapsedTime * items[i].speed + items[i].phase) * 1.2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {items.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[s.r, 16, 16]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.9}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Rings ───────────────────────────────────────────────────────────────────

function Rings({ params }: { params: SceneParams }) {
  const items = useMemo(() => {
    if ((params.rings ?? 0) < 0.05) return [];
    const count = Math.floor(params.rings * 8);
    return Array.from({ length: count }, (_, i) => ({
      x: rand(-15, 15),
      y: rand(3, 15),
      z: rand(-20, 5),
      r: rand(1.5, 5),
      rx: rand(0, Math.PI),
      ry: (i / count) * Math.PI * 2,
      phase: rand(0, Math.PI * 2),
    }));
  }, [params.rings]);

  const col = useMemo(() => hex(params.ringColor || "#ffffff"), [params.ringColor]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      if (i < items.length) {
        child.rotation.y = clock.elapsedTime * 0.15 + items[i].phase;
        child.rotation.x = Math.sin(clock.elapsedTime * 0.1 + items[i].phase) * 0.3 + items[i].rx;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {items.map((ring, i) => (
        <mesh key={i} position={[ring.x, ring.y, ring.z]}>
          <torusGeometry args={[ring.r, 0.06, 8, 64]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Particle System ─────────────────────────────────────────────────────────

type ParticleMotion = "still" | "float" | "rain" | "rise" | "spiral" | "orbit" | "scatter" | "drift" | "pulse";

function ParticleSystem({ params }: { params: SceneParams }) {
  const pDensity = params.particles ?? 0;
  if (pDensity < 0.05) return null;

  const count = Math.min(8000, Math.floor((params.particleCount ?? 2000) * pDensity));
  const spread = params.particleSpread ?? 30;
  const motion: ParticleMotion = (params.particleMotion ?? "float") as ParticleMotion;
  const pSize = params.particleSize ?? 0.05;
  const pColor = useMemo(() => hex(params.particleColor || "#aabbff"), [params.particleColor]);

  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (motion === "rain") {
        positions[i3] = rand(-spread, spread);
        positions[i3 + 1] = rand(0, 20);
        positions[i3 + 2] = rand(-spread, spread);
      } else if (motion === "rise") {
        positions[i3] = rand(-spread * 0.5, spread * 0.5);
        positions[i3 + 1] = rand(-2, 8);
        positions[i3 + 2] = rand(-spread * 0.5, spread * 0.5);
      } else if (motion === "spiral") {
        const angle = rand(0, Math.PI * 2);
        const r = rand(0, spread * 0.5);
        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = rand(0, 15);
        positions[i3 + 2] = Math.sin(angle) * r;
      } else if (motion === "orbit") {
        const angle = rand(0, Math.PI * 2);
        const r = rand(3, spread * 0.4);
        const tilt = rand(-0.5, 0.5);
        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = rand(1, 12) + Math.sin(angle) * r * tilt;
        positions[i3 + 2] = Math.sin(angle) * r;
      } else {
        positions[i3] = rand(-spread, spread);
        positions[i3 + 1] = rand(0, 18);
        positions[i3 + 2] = rand(-spread, spread);
      }

      velocities[i3] = rand(-0.5, 0.5);
      velocities[i3 + 1] = rand(-0.5, 0.5);
      velocities[i3 + 2] = rand(-0.5, 0.5);
      phases[i] = rand(0, Math.PI * 2);
    }
    return { positions, velocities, phases };
  }, [count, spread, motion]);

  const posRef = useRef(positions.slice());
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const t = params.turbulence ?? 0;

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const time = clock.elapsedTime;
    const pos = posRef.current;
    const speed = 0.3 + t * 1.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const ph = phases[i];

      if (motion === "float") {
        pos[i3 + 1] = positions[i3 + 1] + Math.sin(time * speed * 0.4 + ph) * 1.5;
        pos[i3] = positions[i3] + Math.sin(time * 0.15 + ph) * 0.8;
        pos[i3 + 2] = positions[i3 + 2] + Math.cos(time * 0.12 + ph) * 0.8;
      } else if (motion === "rain") {
        pos[i3 + 1] -= speed * 0.08;
        if (pos[i3 + 1] < -2) pos[i3 + 1] = 20;
        pos[i3] = positions[i3] + Math.sin(time * 0.3 + ph) * t * 2;
      } else if (motion === "rise") {
        pos[i3 + 1] += speed * 0.03;
        if (pos[i3 + 1] > 20) pos[i3 + 1] = -2;
        pos[i3] = positions[i3] + Math.sin(time * 0.5 + ph) * 0.5;
        pos[i3 + 2] = positions[i3 + 2] + Math.cos(time * 0.4 + ph) * 0.5;
      } else if (motion === "spiral") {
        const angle = time * speed * 0.2 + ph;
        const r = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2);
        pos[i3] = Math.cos(angle) * r;
        pos[i3 + 2] = Math.sin(angle) * r;
        pos[i3 + 1] = positions[i3 + 1] + Math.sin(time * 0.3 + ph) * 1;
      } else if (motion === "orbit") {
        const orbitSpeed = speed * 0.15;
        const ox = positions[i3], oz = positions[i3 + 2];
        const r = Math.sqrt(ox * ox + oz * oz);
        const baseAngle = Math.atan2(oz, ox);
        const newAngle = baseAngle + time * orbitSpeed;
        pos[i3] = Math.cos(newAngle) * r;
        pos[i3 + 2] = Math.sin(newAngle) * r;
        pos[i3 + 1] = positions[i3 + 1] + Math.sin(time * 0.4 + ph) * 0.8;
      } else if (motion === "scatter") {
        pos[i3] = positions[i3] + Math.sin(time * speed * 0.3 + ph) * t * 3;
        pos[i3 + 1] = positions[i3 + 1] + Math.cos(time * speed * 0.2 + ph * 1.3) * t * 2;
        pos[i3 + 2] = positions[i3 + 2] + Math.sin(time * speed * 0.25 + ph * 0.7) * t * 3;
      } else if (motion === "drift") {
        pos[i3] = positions[i3] + Math.sin(time * 0.08 + ph) * 3;
        pos[i3 + 1] = positions[i3 + 1] + Math.sin(time * 0.06 + ph * 1.5) * 1.5;
        pos[i3 + 2] = positions[i3 + 2] + Math.cos(time * 0.07 + ph) * 2;
      } else if (motion === "pulse") {
        const scale = 1 + Math.sin(time * 2 + ph) * 0.3;
        pos[i3] = positions[i3] * scale;
        pos[i3 + 1] = positions[i3 + 1] + Math.sin(time + ph) * 1;
        pos[i3 + 2] = positions[i3 + 2] * scale;
      }
    }

    const geo = geoRef.current;
    const attr = geo.attributes.position as THREE.BufferAttribute;
    attr.set(pos);
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          array={posRef.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={pColor}
        size={pSize}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Lighting ────────────────────────────────────────────────────────────────

function Lighting({ params }: { params: SceneParams }) {
  const ambCol = useMemo(() => hex(params.ambientColor || "#111122"), [params.ambientColor]);
  const lightCol = useMemo(() => hex(params.lightColor || "#ffffff"), [params.lightColor]);
  const intensity = params.lightIntensity ?? 1;
  const tod = params.timeOfDay ?? 0;

  const sunY = Math.abs(Math.sin(tod * Math.PI)) * 25 + 3;
  const sunX = Math.cos(tod * Math.PI * 2) * 35;

  return (
    <>
      <ambientLight intensity={0.12 + tod * 0.15} color={ambCol} />
      <directionalLight
        position={[sunX, sunY, 20]}
        intensity={intensity}
        color={lightCol}
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </>
  );
}

// ─── Scene Content ────────────────────────────────────────────────────────────

function SceneContent({ params }: { params: SceneParams }) {
  const fogCol = useMemo(() => hex(params.fogColor || "#0a0d1a"), [params.fogColor]);

  return (
    <>
      <fog attach="fog" args={[fogCol, 12, 80]} />
      <CameraController params={params} />
      <Lighting params={params} />
      <Terrain params={params} />
      <Water params={params} />
      <Forest params={params} />
      <Buildings params={params} />
      <Ruins params={params} />
      <Fire params={params} />
      <Spheres params={params} />
      <Rings params={params} />
      <ParticleSystem params={params} />
      {(params.stars ?? 0) > 0.2 && (
        <Stars
          radius={90}
          depth={60}
          count={Math.floor(params.stars * 6000)}
          factor={4}
          saturation={0.4}
          fade
          speed={(params.turbulence ?? 0) * 0.5 + 0.05}
        />
      )}
    </>
  );
}

// ─── Gradient Fallback ────────────────────────────────────────────────────────

function GradientFallback({ params }: { params: SceneParams }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 40% 60%, ${params.groundColor || "#1a0a2e"} 0%, ${params.skyColor || "#060818"} 100%)`,
      }}
    />
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface SceneCanvasProps {
  params: SceneParams;
  isTransitioning: boolean;
}

export function SceneCanvas({ params, isTransitioning }: SceneCanvasProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  const checkWebGL = useCallback(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    checkWebGL();
  }, [checkWebGL]);

  const style: React.CSSProperties = {
    opacity: isTransitioning ? 0.35 : 1,
    transition: "opacity 0.5s ease",
  };

  if (webglOk === false) {
    return (
      <div className="absolute inset-0" style={style}>
        <GradientFallback params={params} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={style}>
      <Canvas
        camera={{ position: [0, 5, 20], fov: 62, near: 0.1, far: 250 }}
        shadows="soft"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: params.skyColor || "#03050f" }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneContent params={params} />
        </Suspense>
      </Canvas>
    </div>
  );
}
