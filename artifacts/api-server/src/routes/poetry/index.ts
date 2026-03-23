import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const client = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a 3D scene composer that translates poetry lines into vivid visual parameters for a real-time 3D world.

Given a line of poetry and optional context from preceding lines, analyze the imagery, emotion, and sensory details, then output scene parameters as JSON.

Rules:
- terrain: 0-1. 1 = dramatic mountains/hills, 0 = flat plains or ocean
- terrainHeight: 1-8. How tall the terrain features are
- terrainScale: 0.5-4. Scale of terrain noise
- water: 0-1. 1 = ocean/lake dominates, 0 = desert/dry
- waterAmplitude: 0.1-2.0. Wave height
- waterFrequency: 0.5-3.0. Wave frequency
- trees: 0-1. 1 = dense forest, 0 = barren
- buildings: 0-1. 1 = urban cityscape, 0 = wilderness
- columns: 0-1. 1 = ancient ruins / temple columns
- columnHeight: 2-12. Column height
- columnRadius: 0.1-0.8. Column thickness
- fire: 0-1. 1 = fire/flames dominant, 0 = none
- fireRadius: 0.3-2.0. Fire size
- fireHeight: 1-5. Fire height
- spheres: 0-1. 1 = glowing orbs/celestial bodies
- sphereRadius: 0.2-2.0. Orb size
- sphereY: 0-8. Orb height
- stars: 0-1. 1 = starfield visible/night sky
- turbulence: 0-1. 1 = chaos/storm/violent, 0 = serene/still
- col1: hex color string. Primary scene color (ground/main elements)
- col2: hex color string. Secondary accent color
- col3: hex color string. Tertiary/highlight color
- skyColor: hex color string. Sky/horizon color
- fogColor: hex color string. Atmospheric fog color
- fogDensity: 0.001-0.05. Fog thickness
- timeOfDay: 0-1. 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk, 1=midnight

Respond ONLY with valid JSON, no markdown, no explanation.`;

router.post("/compose-scene", async (req, res) => {
  const { line, context } = req.body as { line: string; context?: string[] };

  if (!line) {
    res.status(400).json({ error: "line is required" });
    return;
  }

  const contextStr =
    context && context.length > 0
      ? `Previous lines for context:\n${context.map((l, i) => `${i + 1}. "${l}"`).join("\n")}\n\nCurrent line to visualize:`
      : "Poetry line to visualize:";

  const userPrompt = `${contextStr} "${line}"

Compose a 3D scene that captures the imagery, mood, and emotion of this line. Output ONLY JSON.`;

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
    // Strip markdown code fences if present
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
