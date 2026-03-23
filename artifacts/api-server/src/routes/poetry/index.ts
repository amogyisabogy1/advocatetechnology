import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a synesthetic poet-architect who translates poetry lines into vivid, saturated, COLORFUL 3D worlds.

CRITICAL AESTHETIC RULES:
- Colors must be RICH, SATURATED, and BEAUTIFUL — avoid muddy, desaturated, or too-dark palettes
- Use full-spectrum vivid hues: deep purples, electric blues, emerald greens, molten golds, crimson reds, hot pinks, cyan, magenta
- Sky colors should be dramatic — deep violet, midnight blue, rose-gold, electric teal, indigo — never plain black
- Ground colors should have character — deep jade, burgundy earth, volcanic obsidian, copper, cyan ice
- Particle colors must be vibrant and luminous — they glow in the scene
- Emissive elements (fire, spheres, rings) should be intensely colored
- Even dark/sad lines should have CHROMATIC RICHNESS — a beautiful sadness, not grey mud

For each line, perform deep semantic analysis:
1. IMAGERY: What physical things/places does it evoke? Be LITERAL
2. EMOTION: joy, grief, awe, violence, tenderness, wonder, dread, longing — translate to COLOR
3. MOTION: still, gentle, turbulent, swirling, falling, rising
4. LIGHT: dusk glow, moonlight, fire, starlight, noon blaze, candlelight
5. COLOR PALETTE: derive 3-4 vivid hues that match the imagery AND emotion

SCENE TYPES — pick what is most LITERAL to the line's imagery:
- void: psychological emptiness, abstraction → deep violet/indigo with luminous particles
- ocean: water, sea, tears, vastness → rich teal/sapphire/ultramarine
- forest: woods, trees, nature → deep emerald, jade, gold-green
- mountain: peaks, stone → slate blue, purple, snow-white highlights
- city: urban, buildings → electric blue windows, neon accents, dark steel
- ruins: ancient columns, memory → warm amber, honey gold, sandstone
- fire: flames, passion → crimson, orange, molten gold
- cosmos: stars, infinity → deep purple/indigo, electric blue, silver-white
- desert: sand, dryness → amber, burnt sienna, copper, rose dust
- field: grass, open plains → lime green, gold, sky blue
- cave: darkness, depth → teal-black, glowing cyan/green cracks
- storm: chaos, conflict → electric purple, steel grey, lightning white

PARTICLES are crucial — use them generously:
- mist/fog: drift, tiny, 0.02-0.04 size, pastel or cool hue
- rain: rain motion, silver/blue, small
- embers/sparks: rise, orange/gold, 0.03-0.06 size
- petals/leaves: float, warm pink/amber, 0.06-0.12 size
- stars falling: rain, silver-white, 0.02-0.04
- spirits/souls: orbit, luminous white/blue, 0.06-0.1
- cosmic dust: spiral, violet/teal, 0.02-0.05
- fireflies: float, warm yellow-green, 0.06-0.1

Output ONLY valid JSON, no markdown, no explanation.`;

router.post("/compose-scene", async (req, res) => {
  const { line, context } = req.body as { line: string; context?: string[] };

  if (!line) {
    res.status(400).json({ error: "line is required" });
    return;
  }

  const prevLines =
    context && context.length > 0
      ? `\nPrevious lines (context only):\n${context.slice(-3).map((l, i) => `  ${i + 1}. "${l}"`).join("\n")}\n`
      : "";

  const userPrompt = `${prevLines}
Current line: "${line}"

Analyze deeply. Output ONLY JSON:
{
  "sceneType": "forest"|"ocean"|"mountain"|"city"|"ruins"|"fire"|"cosmos"|"desert"|"field"|"cave"|"storm"|"void",
  "skyColor": "#hex — rich, dramatic, NOT plain black",
  "fogColor": "#hex — colored atmosphere",
  "fogDensity": 0.001-0.08,
  "groundColor": "#hex — vivid, characterful",
  "ambientColor": "#hex — warm or cool fill",
  "lightColor": "#hex — main light color, vivid",
  "lightIntensity": 0.5-4,
  "turbulence": 0-1,
  "timeOfDay": 0-1,
  "terrain": 0-1,
  "terrainHeight": 0.5-12,
  "terrainScale": 0.3-5,
  "water": 0-1,
  "waterColor": "#hex — vivid blue/teal/cyan",
  "waterOpacity": 0.1-1,
  "trees": 0-1,
  "treeColor": "#hex — rich green/jade/gold",
  "buildings": 0-1,
  "columns": 0-1,
  "fire": 0-1,
  "particles": 0-1,
  "particleColor": "#hex — luminous, vibrant",
  "particleSize": 0.01-0.8,
  "particleCount": 500-8000,
  "particleMotion": "still"|"float"|"rain"|"rise"|"spiral"|"orbit"|"scatter"|"drift"|"pulse",
  "particleSpread": 5-60,
  "spheres": 0-1,
  "sphereColor": "#hex — glowing vivid",
  "stars": 0-1,
  "rings": 0-1,
  "ringColor": "#hex — electric, luminous",
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
