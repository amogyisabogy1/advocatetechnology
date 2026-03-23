import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import type { SceneParams } from "@workspace/api-client-react";

interface SceneProps {
  params: SceneParams;
}

function TerrainMesh({ params }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(80, 80, 100, 100);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const count = pos.count;
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const height =
        params.terrain *
        (Math.sin(x * 0.1 * (params.terrainScale ?? 1.5)) *
          Math.cos(z * 0.08 * (params.terrainScale ?? 1.5)) *
          (params.terrainHeight ?? 3) +
          Math.sin(x * 0.3 + z * 0.2) * (params.terrainHeight ?? 3) * 0.3 +
          Math.cos(x * 0.15 - z * 0.25) * (params.terrainHeight ?? 3) * 0.2);
      pos.setY(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, [params.terrain, params.terrainHeight, params.terrainScale]);

  const color1 = useMemo(
    () => new THREE.Color(params.col1 || "#1a0a2e"),
    [params.col1]
  );

  useFrame(({ clock }) => {
    if (meshRef.current && params.turbulence > 0.3) {
      meshRef.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.1 * params.turbulence) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color={color1}
        roughness={0.85}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function WaterPlane({ params }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const waterColor = useMemo(
    () => new THREE.Color(params.col2 || "#0d2137"),
    [params.col2]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const amp = params.waterAmplitude ?? 0.3;
    const freq = params.waterFrequency ?? 1.0;
    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(
        i,
        Math.sin(x * freq * 0.5 + t * 1.2) * amp * 0.5 +
          Math.cos(z * freq * 0.4 + t * 0.9) * amp * 0.5
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  if (params.water < 0.1) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[80, 80, 40, 40]} />
      <meshStandardMaterial
        color={waterColor}
        roughness={0.1}
        metalness={0.6}
        transparent
        opacity={0.85 * params.water}
      />
    </mesh>
  );
}

function TreeCluster({ params }: SceneProps) {
  const trees = useMemo(() => {
    if (params.trees < 0.1) return [];
    const count = Math.floor(params.trees * 40);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const r = 8 + Math.random() * 20;
      return {
        x: Math.cos(angle) * r + (Math.random() - 0.5) * 4,
        z: Math.sin(angle) * r + (Math.random() - 0.5) * 4,
        scale: 0.6 + Math.random() * 1.2,
      };
    });
  }, [params.trees]);

  const color = useMemo(
    () => new THREE.Color(params.col2 || "#1a3320"),
    [params.col2]
  );

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.8, 3, 6]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.8, 6]} />
            <meshStandardMaterial color="#2d1a0e" roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function BuildingCluster({ params }: SceneProps) {
  const buildings = useMemo(() => {
    if (params.buildings < 0.1) return [];
    const count = Math.floor(params.buildings * 20);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 5 + Math.random() * 18;
      const h = 3 + Math.random() * 12 * params.buildings;
      return {
        x: Math.cos(angle) * r + (Math.random() - 0.5) * 6,
        z: Math.sin(angle) * r + (Math.random() - 0.5) * 6,
        h,
        w: 1 + Math.random() * 2,
      };
    });
  }, [params.buildings]);

  const color = useMemo(
    () => new THREE.Color(params.col3 || "#1c1c2e"),
    [params.col3]
  );

  return (
    <>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.3}
            emissive={color}
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
    </>
  );
}

function ColumnRuins({ params }: SceneProps) {
  const columns = useMemo(() => {
    if (params.columns < 0.1) return [];
    const count = Math.floor(params.columns * 12);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 6 + Math.random() * 8;
      return {
        x: Math.cos(angle) * r + (Math.random() - 0.5) * 3,
        z: Math.sin(angle) * r + (Math.random() - 0.5) * 3,
        h: (params.columnHeight ?? 6) * (0.7 + Math.random() * 0.6),
        broken: Math.random() > 0.6,
      };
    });
  }, [params.columns, params.columnHeight]);

  const color = useMemo(() => new THREE.Color("#c8b89a"), []);

  return (
    <>
      {columns.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <cylinderGeometry
              args={[
                params.columnRadius ?? 0.3,
                (params.columnRadius ?? 0.3) * 1.1,
                c.broken ? c.h * 0.6 : c.h,
                12,
              ]}
            />
            <meshStandardMaterial color={color} roughness={0.95} metalness={0.05} />
          </mesh>
          {!c.broken && (
            <mesh position={[0, c.h + 0.2, 0]}>
              <boxGeometry
                args={[
                  (params.columnRadius ?? 0.3) * 3,
                  0.3,
                  (params.columnRadius ?? 0.3) * 3,
                ]}
              />
              <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function FireInstances({ params }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fires = useMemo(() => {
    if (params.fire < 0.1) return [];
    const count = Math.floor(params.fire * 8);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 2 + Math.random() * 10;
      return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    });
  }, [params.fire]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        Math.sin(clock.elapsedTime * 3) * 0.1 + (params.fireHeight ?? 2) * 0.5;
      meshRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 5) * 0.1;
    }
  });

  if (fires.length === 0) return null;

  return (
    <>
      {fires.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh
            ref={i === 0 ? meshRef : undefined}
            position={[0, (params.fireHeight ?? 2) * 0.5, 0]}
          >
            <coneGeometry
              args={[params.fireRadius ?? 0.5, params.fireHeight ?? 2, 8]}
            />
            <meshStandardMaterial
              color="#ff4500"
              emissive="#ff6600"
              emissiveIntensity={2}
              transparent
              opacity={0.85}
            />
          </mesh>
          <pointLight
            position={[0, 1, 0]}
            color="#ff4500"
            intensity={params.fire * 8}
            distance={8}
            decay={2}
          />
        </group>
      ))}
    </>
  );
}

function FloatingSpheres({ params }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spheres = useMemo(() => {
    if (params.spheres < 0.1) return [];
    const count = Math.floor(params.spheres * 12);
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 30,
      y: (params.sphereY ?? 4) + Math.random() * 6,
      z: (Math.random() - 0.5) * 30,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
    }));
  }, [params.spheres, params.sphereY]);

  const color = useMemo(
    () => new THREE.Color(params.col3 || "#8888ff"),
    [params.col3]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      if (i < spheres.length) {
        child.position.y =
          spheres[i].y +
          Math.sin(clock.elapsedTime * spheres[i].speed + spheres[i].phase) *
            0.8;
      }
    });
  });

  if (spheres.length === 0) return null;

  return (
    <group ref={groupRef}>
      {spheres.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[params.sphereRadius ?? 0.8, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneLighting({ params }: SceneProps) {
  const skyCol = useMemo(
    () => new THREE.Color(params.skyColor || "#060818"),
    [params.skyColor]
  );

  const timeOfDay = params.timeOfDay ?? 0;
  const sunIntensity =
    timeOfDay < 0.25
      ? timeOfDay * 4
      : timeOfDay < 0.5
      ? 1.0
      : timeOfDay < 0.75
      ? (1 - timeOfDay) * 4
      : 0;

  const sunColor =
    timeOfDay < 0.25 || timeOfDay > 0.75
      ? "#ff6633"
      : timeOfDay < 0.5
      ? "#fff5e0"
      : "#ffaa44";

  return (
    <>
      <ambientLight intensity={0.08 + sunIntensity * 0.3} color={skyCol} />
      <directionalLight
        position={[
          Math.cos(timeOfDay * Math.PI * 2) * 30,
          Math.abs(Math.sin(timeOfDay * Math.PI * 2)) * 20 + 5,
          20,
        ]}
        intensity={sunIntensity * 2 + 0.1}
        color={sunColor}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      {(timeOfDay < 0.2 || timeOfDay > 0.8) && (
        <directionalLight
          position={[-20, 15, -10]}
          intensity={0.15}
          color="#4466aa"
        />
      )}
    </>
  );
}

function SceneContent({ params }: SceneProps) {
  const fogColor = useMemo(
    () => new THREE.Color(params.fogColor || "#0d1b2a"),
    [params.fogColor]
  );

  return (
    <>
      <fog attach="fog" args={[fogColor, 10, 70]} />
      <SceneLighting params={params} />
      <TerrainMesh params={params} />
      <WaterPlane params={params} />
      <TreeCluster params={params} />
      <BuildingCluster params={params} />
      <ColumnRuins params={params} />
      <FireInstances params={params} />
      <FloatingSpheres params={params} />
      {params.stars > 0.3 && (
        <Stars
          radius={80}
          depth={50}
          count={Math.floor(params.stars * 5000)}
          factor={4}
          saturation={0.5}
          fade
          speed={params.turbulence * 0.5 + 0.1}
        />
      )}
    </>
  );
}

function GradientFallback({ params }: SceneProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 60%, ${params.col2 || "#16213e"} 0%, ${params.col1 || "#1a0a2e"} 40%, ${params.skyColor || "#060818"} 100%)`,
      }}
    />
  );
}

interface SceneCanvasProps {
  params: SceneParams;
  isTransitioning: boolean;
}

export function SceneCanvas({ params, isTransitioning }: SceneCanvasProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const style: React.CSSProperties = {
    opacity: isTransitioning ? 0.4 : 1,
    transition: "opacity 0.6s ease",
  };

  if (webglSupported === false) {
    return (
      <div className="absolute inset-0" style={style}>
        <GradientFallback params={params} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={style}>
      <Canvas
        camera={{ position: [0, 5, 18], fov: 60, near: 0.1, far: 200 }}
        shadows="soft"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: params.skyColor || "#060818" }}
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
