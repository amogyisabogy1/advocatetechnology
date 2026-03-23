# Poetry Visualization Engine

A full-screen immersive web app where each poetry line generates a unique 3D world in real-time using Claude AI. Includes a curated gallery of 4 poems with hand-crafted hyper-specific 3D scenes, plus a freeform visualizer for any poem.

## Architecture

### Monorepo (pnpm workspaces)
- `artifacts/poetry-engine` — React + Vite frontend (port 24904, preview path `/`)
- `artifacts/api-server` — Express API server (port 8080, path `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react` — Generated React Query hooks + TypeScript types
- `lib/api-zod` — Generated Zod schemas

## Pages & Routing (wouter)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home` | Landing page — 4 curated poem cards with animated starfield |
| `/poem/:id` | `CuratedPoem` | Hard-coded hyper-specific 3D scenes per poem |
| `/visualize` | `PoetryEngine` | Freeform: paste any poem → AI generates scenes |

## Curated Poems

1. **William Blake — "The Tyger"** (1794) — Fire + actual 3D tiger rendered from primitives (Tiger.tsx), glowing amber eyes, breathing animation, 5000 rising ember particles
2. **Robert Frost — "The Road Not Taken"** (1916) — Golden autumn forest, falling leaf particles, amber sky shifting to dark undergrowth
3. **Pablo Neruda — "Tonight I Can Write"** (1924) — Deep cosmos, blue drift particles, purple spiraling rings, rose orbiting spheres for the love verse
4. **Walt Whitman — "O Captain! My Captain!"** (1865) — Ocean with animated ship silhouette, red rain particles for grief, celebration city for triumph

## 3D Engine

### SceneCanvas.tsx (generic, used by PoetryEngine)
- React Three Fiber with bloom post-processing (EffectComposer + Bloom)
- 12 scene types: void, ocean, forest, mountain, city, ruins, fire, cosmos, desert, field, cave, storm
- 9 particle motion modes: float, rain, rise, spiral, orbit, scatter, drift, pulse, still
- Elements: terrain, water, forest, buildings, ruins, fire, spheres, rings, aurora, stars
- ACES filmic tone mapping, PCFShadowMap

### CuratedSceneCanvas.tsx (extended, used by CuratedPoem)
- Identical to SceneCanvas but accepts `customScene` prop
- Custom scenes: `"tiger"` (Tiger.tsx), `"eye"` (giant glowing eye for Blake's "immortal hand or eye"), `"captain"` (ship for Whitman)

### Tiger.tsx
- Stylized 3D tiger from Three.js primitives only (no model files)
- Body, head, ears, legs, tail, stripes, glowing amber eyes (point lights), ground shadow
- Breathing animation, tail sway, slow head movement

## AI Backend

- `POST /api/compose-scene` → Claude `claude-sonnet-4-6`
- System prompt instructs rich saturated colors — no muddy palettes
- Returns `SceneParams`: full scene description including sky/fog/ground/light colors, all element intensities, particle settings, camera angle

## Design System
- Dark cinematic — deep blue-grey (#04050f base), never light mode
- Georgia serif for poem text, Inter sans for UI
- Amber/gold (#d4a017) primary accent
- Bloom makes all emissive elements glow cinematically
- Frosted glass via `backdrop-filter: blur` on overlays
