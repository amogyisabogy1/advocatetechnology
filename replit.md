# Poetry Visualization Engine

A full-screen immersive web app where each poetry line generates a unique 3D world in real-time using Claude AI.

## Architecture

### Monorepo (pnpm workspaces)
- `artifacts/poetry-engine` — React + Vite frontend (port 24904, preview path `/`)
- `artifacts/api-server` — Express API server (port 8080, path `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react` — Generated React Query hooks + TypeScript types
- `lib/api-zod` — Generated Zod schemas

### Key Features
- **Browse Mode**: Select from 6 preset poems (Frost, Neruda, Rumi, Dickinson, Rilke, Blake). Lines auto-advance every 7 seconds.
- **Live Editor Mode**: Type any poetry line, press Enter — Claude AI generates a unique 3D scene.
- **3D Engine**: React Three Fiber with terrain, water, trees, buildings, columns, fire, floating spheres, and starfield.
- **AI Backend**: POST `/api/compose-scene` → Claude `claude-sonnet-4-6` → SceneParams JSON.
- **Cinematic UI**: Dark mode, frosted glass overlays, literary Georgia serif typography, gradient gold text.

### API Endpoints
- `GET /api/healthz` — Health check
- `POST /api/compose-scene` — Body: `{ line: string, context?: string[] }` → Returns `SceneParams`

### SceneParams Fields
terrain, terrainHeight, terrainScale, water, waterAmplitude, waterFrequency, trees, buildings, columns, columnHeight, columnRadius, fire, fireRadius, fireHeight, spheres, sphereRadius, sphereY, stars, turbulence, col1, col2, col3, skyColor, fogColor, fogDensity, timeOfDay

### AI Integration
Uses Replit AI Integrations for Anthropic — no user API key needed.
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY` set via Replit integrations.
- Model: `claude-sonnet-4-6`

### Frontend Components
- `src/pages/PoetryEngine.tsx` — Main page with mode switching, state management
- `src/components/three/SceneCanvas.tsx` — Three.js canvas with all 3D scene objects
- `src/components/ui-poetry/PoetryOverlay.tsx` — Poem text + live input overlay
- `src/components/ui-poetry/PoemBrowser.tsx` — Modal for selecting preset poems
- `src/lib/presets.ts` — 6 preset poems
- `src/lib/defaultScene.ts` — Default scene parameters

### Design
- Always dark — cinematic experience, never light mode
- Color: near-black blue-grey background, gold/amber primary, violet accent
- Typography: Georgia serif for poem text, Inter sans for UI
- Frosted glass panels via `.glass` and `.glass-lighter` CSS classes

## Development
```bash
pnpm --filter @workspace/api-spec run codegen  # Regenerate API types
```

Workflows auto-start via Replit. Both workflows must be running for full functionality.
