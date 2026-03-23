import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a synesthetic poet-architect who translates poetry lines into immersive 3D worlds.

For each line, perform deep semantic analysis:
1. IMAGERY: What physical things/places does it evoke? (woods, roads, fire, ocean, night sky, etc.)
2. EMOTION: What feeling does it carry? (grief, wonder, dread, joy, longing, awe, violence, tenderness)
3. MOTION: Is it still, gentle, turbulent, chaotic, melancholic?
4. LIGHT: Dark, luminous, hazy, blazing, twilight?
5. COLOR PALETTE: What colors live in this line?
6. SCALE: Intimate/small or vast/epic?
7. TIME: Day, night, dawn, dusk, timeless?

Then map to scene parameters. Be SPECIFIC and LITERAL — if the line mentions fire, use fire. If it mentions roads through woods, use forest + terrain. If it mentions stars, use cosmos. Do NOT default to generic scenes.

SCENE TYPES:
- void: emptiness, nothingness, existential, abstract, psychological
- ocean: water, sea, waves, tears, vastness, grief, longing
- forest: woods, trees, nature, growth, mystery, green
- mountain: peaks, altitude, grandeur, isolation, stone
- city: buildings, urban, civilization, noise, crowds
- ruins: ancient columns, decay, memory, lost time
- fire: flames, passion, destruction, warmth, violence
- cosmos: stars, space, infinity, wonder, night
- desert: sand, emptiness, heat, loneliness, silence
- field: grass, open plains, freedom, simplicity
- cave: darkness, enclosure, depth, underground, secrets
- storm: chaos, wind, lightning, turbulence, conflict

PARTICLES are KEY — use them generously to add atmosphere:
- Mist/fog: particleMotion=drift, size=0.03, count=3000, soft colors
- Rain: particleMotion=rain, size=0.02, count=4000
- Snow/petals: particleMotion=float, size=0.06, count=2000
- Embers: particleMotion=rise, size=0.04, count=1500, orange/red
- Dust: particleMotion=scatter, size=0.02, count=2500
- Spirits/souls: particleMotion=orbit, size=0.08, count=800, white/blue
- Stars falling: particleMotion=rain, size=0.03, count=1000, silver
- Rising light: particleMotion=rise, size=0.05, count=2000
- Spinning/vortex: particleMotion=spiral, count=3000

CRITICAL RULES:
- Make each line DISTINCT from the others — vary sceneType aggressively
- If a line is abstract/psychological, use void or cosmos with heavy particles
- If a line has strong physical imagery, be LITERAL about it
- Colors must match the emotional/visual quality exactly
- turbulence > 0.5 only for violent, chaotic, or stormy lines
- timeOfDay: be precise — if the line says "night", use 0 or 1
- cameraAngle: low for awe/grandeur, high for loneliness, closeup for intimacy, wide for vast spaces

Output ONLY valid JSON, no markdown, no explanation.`;

router.post("/compose-scene", async (req, res) => {
  const { line, context } = req.body as { line: string; context?: string[] };

  if (!line) {
    res.status(400).json({ error: "line is required" });
    return;
  }

  const prevLines =
    context && context.length > 0
      ? `\nPrevious lines (for context, but focus on the CURRENT line):\n${context
          .slice(-3)
          .map((l, i) => `  ${i + 1}. "${l}"`)
          .join("\n")}\n`
      : "";

  const userPrompt = `${prevLines}
Current line to visualize: "${line}"

Analyze this line deeply and compose a unique 3D scene. Output ONLY JSON matching this exact schema:
{
  "sceneType": "forest"|"ocean"|"mountain"|"city"|"ruins"|"fire"|"cosmos"|"desert"|"field"|"cave"|"storm"|"void",
  "skyColor": "#hex",
  "fogColor": "#hex",
  "fogDensity": 0.001-0.08,
  "groundColor": "#hex",
  "ambientColor": "#hex",
  "lightColor": "#hex",
  "lightIntensity": 0-4,
  "turbulence": 0-1,
  "timeOfDay": 0-1,
  "terrain": 0-1,
  "terrainHeight": 0.5-12,
  "terrainScale": 0.3-5,
  "water": 0-1,
  "waterColor": "#hex",
  "waterOpacity": 0.1-1,
  "trees": 0-1,
  "treeColor": "#hex",
  "buildings": 0-1,
  "columns": 0-1,
  "fire": 0-1,
  "particles": 0-1,
  "particleColor": "#hex",
  "particleSize": 0.01-0.8,
  "particleCount": 100-8000,
  "particleMotion": "still"|"float"|"rain"|"rise"|"spiral"|"orbit"|"scatter"|"drift"|"pulse",
  "particleSpread": 5-60,
  "spheres": 0-1,
  "sphereColor": "#hex",
  "stars": 0-1,
  "rings": 0-1,
  "ringColor": "#hex",
  "cameraAngle": "horizon"|"high"|"low"|"closeup"|"wide"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      res.status(500).json({ error: "No text response from AI" });
      return;
    }

    let rawText = textContent.text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    const params = JSON.parse(rawText);
    res.json(params);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("compose-scene error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
