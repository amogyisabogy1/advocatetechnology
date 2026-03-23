import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a 3D scene compositor for a poetry visualization engine. For each poetry line, you design a unique visual scene by setting parameters that control a raymarched SDF renderer.

Available scene elements (set weight 0.0-1.0):
- terrain: FBM noise-displaced ground (terrainHeight: 0.5-6.0, terrainScale: 0.03-0.15)
- water: animated wave surface (waterAmplitude: 0.1-0.6, waterFrequency: 0.5-2.0)
- trees: repeated trunk+canopy SDFs
- buildings: repeated box SDFs with window cutouts
- columns: stone pillars (columnHeight: 1-6, columnRadius: 0.1-0.5)
- fire: noise-displaced volumetric fire (fireRadius: 0.3-2.0, fireHeight: 1-5)
- spheres: abstract orb objects (sphereRadius: 0.3-2.0, sphereY: 0.5-4.0)
- stars: star intensity multiplier

Global controls:
- turbulence: noise displacement amount (0-1)
- col1: "#hex" primary ground/material color
- col2: "#hex" secondary/height-based color
- col3: "#hex" accent/highlight color
- skyColor: "#hex"
- fogColor: "#hex"
- fogDensity: 0.01-0.08
- timeOfDay: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=sunset

Rules:
- Be LITERAL and SPECIFIC to the imagery
- "Two roads diverged in a yellow wood" → terrain:0.3, trees:1, col3:"#d4a020", timeOfDay:0.4
- "Tyger burning bright" → fire:1, trees:0.5, col3:"#ff6020", timeOfDay:0.08
- Each line should feel visually DISTINCT from the previous
- Blend multiple elements for rich scenes (forest+stars for "forests of the night")
- For dark/night scenes use very dark skyColor and fogColor
- For hopeful/dawn scenes use warm oranges and pinks
- For ocean/water scenes maximize water, minimize terrain

Return ONLY valid JSON with all required fields.`;

router.post("/compose-scene", async (req, res) => {
  const { line, context = [] } = req.body as { line: string; context?: string[] };

  if (!line) {
    res.status(400).json({ error: "line is required" });
    return;
  }

  const contextStr = context.length > 0
    ? `\nPrevious lines for context:\n${context.join("\n")}\n`
    : "";

  const userPrompt = `${contextStr}
Current line to visualize: "${line}"

Return a JSON object with these exact fields:
{
  "terrain": 0-1,
  "terrainHeight": 0.5-6,
  "terrainScale": 0.03-0.15,
  "water": 0-1,
  "waterAmplitude": 0.1-0.6,
  "waterFrequency": 0.5-2.0,
  "trees": 0-1,
  "buildings": 0-1,
  "columns": 0-1,
  "columnHeight": 1-6,
  "columnRadius": 0.1-0.5,
  "fire": 0-1,
  "fireRadius": 0.3-2.0,
  "fireHeight": 1-5,
  "spheres": 0-1,
  "sphereRadius": 0.3-2.0,
  "sphereY": 0.5-4.0,
  "stars": 0-1,
  "turbulence": 0-1,
  "col1": "#hex",
  "col2": "#hex",
  "col3": "#hex",
  "skyColor": "#hex",
  "fogColor": "#hex",
  "fogDensity": 0.01-0.08,
  "timeOfDay": 0-1
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const params = JSON.parse(jsonMatch[0]);
    res.json(params);
  } catch (err) {
    req.log.error({ err }, "Failed to compose scene");
    res.status(500).json({ error: "Failed to compose scene" });
  }
});

export default router;
