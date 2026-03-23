import { useState, useEffect, useCallback, useRef } from "react";
import { useComposeScene } from "@workspace/api-client-react";
import type { SceneParams } from "@workspace/api-client-react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { CuratedSceneCanvas } from "@/components/three/CuratedSceneCanvas";
import { CURATED_POEMS } from "@/lib/curatedPoems";

// ─── Harvard Advocate Presets ─────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  author: string;
  fullAuthor: string;
  text: string;
  bgScene: SceneParams;
  bgCustom?: string;
}

// Weight first, as requested
const ADVOCATE_PRESETS: Preset[] = [
  {
    id: "weight",
    label: "Today I am weight.",
    author: "Indovina",
    fullAuthor: "Indovina",
    text: `Today I am weight. Today my tail quivers with the herd's, a burly
pack of cattails swirling. I am big-bellied, furry, untamable. I am
full of grass. Today I get to think about my next meal. Today I
daydream about the rut, strutting and curling my lip, grunting with
my tongue outstretched. Today I want to wallow in the mud with
all the other lip-curlers, licking pheromonal heat. Shuffle of
salivating verve. Scruff of soul. Today I hoist my bulging bulk. My
nose twitches with distant splays of sweat. Ears infused in
chemical cues. I am nature, never devil. Today I give my love
away.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "weight")!.lines[0].scene,
  },
  {
    id: "fish",
    label: "Warm for a fish",
    author: "Bradford Kimball",
    fullAuthor: "Bradford Kimball",
    text: `Warm for a fish,
The kingqueen of egglayers,
Innards sluicing round deckheight
Stain the waders of a bearded fisherman.
He slices clean the belly
With a curved tip razorknife gently,
Calls her gorgeous, kisses
Her whiskers whispers creekside
admiral admiral admiral admiral.
She expects that every man
Will do his slicing right.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "fish")!.lines[0].scene,
  },
  {
    id: "haiku",
    label: "Day Forty-Two",
    author: "Lindsey Wayland",
    fullAuthor: "Lindsey Wayland",
    text: `A winter windstorm
blows down the power lines. We
eat by candlelight.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "haiku")!.lines[0].scene,
  },
  {
    id: "alti",
    label: "Have You Not Learned I Shall Not Learn?",
    author: "Nicholas Alti",
    fullAuthor: "Nicholas Alti",
    text: `Soul or flare, or then a reckoning. Spare pasts
from gashes prior. Polyps of personage,
like tight-packed parcels, plucked apart until
raw as small carcass ready for forks.
In a butter time—pre-present, future eventual—
a pickaxe couldn't puncture them,
warlords would run away. Partial coordinates
given to an inescapable whorl
of vortices. Where portals pulse like swollen
spores. Starlight a soft no
among firm certainties. Spent parts compose.
Bereft reports galore.
A prion named Osiris. Three halves of actual
mysterious. Glee`,
    bgScene: CURATED_POEMS.find((p) => p.id === "alti")!.lines[0].scene,
  },
];

type View = "landing" | "custom-input" | "visualize";

export function PoetryEngine() {
  const [view, setView] = useState<View>("landing");
  const [poemText, setPoemText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(ADVOCATE_PRESETS[0].bgScene);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingLine, setLoadingLine] = useState<number | null>(null);
  const [sceneCache, setSceneCache] = useState<Record<number, SceneParams>>({});
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutateAsync: composeScene } = useComposeScene();

  const loadScene = useCallback(
    async (idx: number, poemLines: string[]) => {
      if (sceneCache[idx]) {
        setIsTransitioning(true);
        setTimeout(() => {
          setSceneParams(sceneCache[idx]);
          setIsTransitioning(false);
        }, 300);
        return;
      }
      setLoadingLine(idx);
      setIsTransitioning(true);
      try {
        const params = await composeScene({
          data: { line: poemLines[idx], context: poemLines.slice(0, idx) },
        });
        setSceneCache((prev) => ({ ...prev, [idx]: params }));
        setSceneParams(params);
      } catch (err) {
        console.error("Scene error:", err);
      } finally {
        setLoadingLine(null);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    },
    [composeScene, sceneCache]
  );

  // Visualize a preset — goes straight to the scene, no intermediate step
  const visualizePreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setPoemText(preset.text);
    const parsed = preset.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    setLines(parsed);
    setLineIndex(0);
    const curatedPoem = CURATED_POEMS.find((p) => p.id === preset.id);
    if (curatedPoem) {
      const cache: Record<number, SceneParams> = {};
      curatedPoem.lines.forEach((line, i) => { cache[i] = line.scene; });
      setSceneCache(cache);
      setSceneParams(curatedPoem.lines[0].scene);
    } else {
      setSceneCache({});
    }
    setView("visualize");
  };

  // Visualize custom input
  const visualizeCustom = () => {
    const parsed = poemText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (parsed.length === 0) return;
    setSelectedPreset(null);
    setLines(parsed);
    setLineIndex(0);
    setSceneCache({});
    setSceneParams(ADVOCATE_PRESETS[0].bgScene);
    setView("visualize");
  };

  const handleBack = () => {
    if (abortRef.current) abortRef.current.abort();
    setSceneCache({});
    setView("landing");
  };

  const goToLine = (idx: number) => {
    if (idx < 0 || idx >= lines.length) return;
    setLineIndex(idx);
  };

  useEffect(() => {
    if (view !== "visualize" || lines.length === 0) return;
    loadScene(lineIndex, lines);
  }, [view, lineIndex, lines]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view !== "visualize") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goToLine(lineIndex + 1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goToLine(lineIndex - 1); }
      else if (e.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, lineIndex, lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === "landing") {
    return (
      <LandingView
        onSelectPreset={visualizePreset}
        onEnterOwn={() => {
          setPoemText("");
          setView("custom-input");
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
      />
    );
  }

  if (view === "custom-input") {
    return (
      <CustomInputView
        poemText={poemText}
        onPoemTextChange={setPoemText}
        onVisualize={visualizeCustom}
        onBack={() => setView("landing")}
        textareaRef={textareaRef}
      />
    );
  }

  return (
    <VisualizeView
      lines={lines}
      lineIndex={lineIndex}
      sceneParams={sceneParams}
      isTransitioning={isTransitioning}
      loadingLine={loadingLine}
      onGoToLine={goToLine}
      onBack={handleBack}
      selectedPreset={selectedPreset}
    />
  );
}

// ─── Landing View — editorial magazine style ───────────────────────────────────

interface LandingViewProps {
  onSelectPreset: (p: Preset) => void;
  onEnterOwn: () => void;
}

function LandingView({ onSelectPreset, onEnterOwn }: LandingViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#080808",
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
    }}>
      {/* Content column */}
      <div style={{
        width: "100%", maxWidth: 520,
        padding: "72px 32px 60px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* ── FEAR heading ── */}
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(72px, 16vw, 128px)",
          fontWeight: "normal",
          letterSpacing: "0.08em",
          color: "#ffffff",
          margin: 0, lineHeight: 1,
          textAlign: "center",
        }}>
          FEAR
        </h1>

        {/* Short rule */}
        <div style={{
          width: 48, height: 1,
          background: "rgba(255,255,255,0.35)",
          margin: "22px 0 24px",
        }} />

        {/* Subtitle */}
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 15,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.38)",
          textAlign: "center",
          lineHeight: 1.75,
          margin: 0,
          marginBottom: 56,
        }}>
          Four poems. Four particle fields.<br />
          An interactive exhibition.
        </p>

        {/* ── Poem list ── */}
        <div style={{ width: "100%" }}>

          {/* Top divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

          {ADVOCATE_PRESETS.map((preset) => {
            const isHov = hovered === preset.id;
            return (
              <div key={preset.id}>
                <button
                  onClick={() => onSelectPreset(preset)}
                  onMouseEnter={() => setHovered(preset.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "22px 0",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 20,
                    transition: "opacity 0.18s ease",
                    opacity: hovered && !isHov ? 0.45 : 1,
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 20,
                    fontWeight: "normal",
                    color: isHov ? "#ffffff" : "rgba(255,255,255,0.88)",
                    letterSpacing: "0.01em",
                    lineHeight: 1.3,
                    flex: 1,
                    transition: "color 0.18s ease",
                  }}>
                    {preset.label}
                  </span>
                  <span style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 13,
                    color: isHov ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)",
                    letterSpacing: "0.03em",
                    whiteSpace: "nowrap",
                    transition: "color 0.18s ease",
                    flexShrink: 0,
                  }}>
                    {preset.fullAuthor}
                  </span>
                </button>
                {/* Divider after each row */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>
            );
          })}

          {/* Visualize your own poem — same row style, bottom */}
          <button
            onClick={onEnterOwn}
            onMouseEnter={() => setHovered("own")}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "22px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 20,
              fontWeight: "bold",
              color: hovered === "own" ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.5)",
              letterSpacing: "0.02em",
              transition: "color 0.18s ease, opacity 0.18s ease",
              opacity: hovered && hovered !== "own" ? 0.45 : 1,
              gap: 8,
            }}
          >
            Visualize your own poem →
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Custom Input View ────────────────────────────────────────────────────────

interface CustomInputViewProps {
  poemText: string;
  onPoemTextChange: (v: string) => void;
  onVisualize: () => void;
  onBack: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

function CustomInputView({ poemText, onPoemTextChange, onVisualize, onBack, textareaRef }: CustomInputViewProps) {
  const lineCount = poemText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#080808",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 28, left: 28,
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "Georgia, serif", fontSize: 14,
          color: "rgba(255,255,255,0.32)",
          letterSpacing: "0.02em",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.32)")}
      >
        ← Back
      </button>

      <div style={{
        width: "100%", maxWidth: 560,
        display: "flex", flexDirection: "column", gap: 0,
      }}>
        {/* Heading */}
        <p style={{
          fontFamily: "Georgia, serif",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
          marginBottom: 24,
          margin: 0, marginBottom: 24,
        }}>
          Your poem
        </p>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={poemText}
          onChange={(e) => onPoemTextChange(e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder="Paste or type your poem here…"
          style={{
            width: "100%", resize: "none",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            outline: "none",
            fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.9,
            color: "rgba(255,255,255,0.85)",
            caretColor: "#ffffff",
            padding: "0 0 20px 0",
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onVisualize(); }
          }}
        />

        {/* Bottom row */}
        <div style={{
          marginTop: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "Georgia, serif", fontSize: 13,
            color: "rgba(255,255,255,0.18)",
            fontStyle: "italic",
          }}>
            {lineCount > 0 ? `${lineCount} line${lineCount !== 1 ? "s" : ""}` : "one line per scene"}
          </span>
          <button
            onClick={onVisualize}
            disabled={lineCount === 0}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              cursor: lineCount === 0 ? "not-allowed" : "pointer",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 15,
              color: lineCount === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
              padding: "8px 22px",
              letterSpacing: "0.02em",
              transition: "all 0.15s ease",
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { if (lineCount > 0) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.color = lineCount === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          >
            Visualize →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Visualize View ───────────────────────────────────────────────────────────

interface VisualizeViewProps {
  lines: string[];
  lineIndex: number;
  sceneParams: SceneParams;
  isTransitioning: boolean;
  loadingLine: number | null;
  onGoToLine: (i: number) => void;
  onBack: () => void;
  selectedPreset: string | null;
}

function VisualizeView({
  lines, lineIndex, sceneParams, isTransitioning, loadingLine, onGoToLine, onBack, selectedPreset,
}: VisualizeViewProps) {
  const isLoading = loadingLine !== null;
  const curatedPoem = selectedPreset ? CURATED_POEMS.find((p) => p.id === selectedPreset) : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <SceneCanvas params={sceneParams} isTransitioning={isTransitioning} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={onBack}
          className="glass-lighter rounded-xl px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-sans flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-primary/40 border-t-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Composing…</span>
            </div>
          )}
          {curatedPoem && (
            <div className="glass rounded-xl px-3 py-1.5">
              <span className="text-xs font-sans" style={{ color: "rgba(255,100,100,0.7)", letterSpacing: "0.06em" }}>
                Harvard Advocate · Fear
              </span>
            </div>
          )}
          <div className="glass rounded-xl px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-sans">{lineIndex + 1} / {lines.length}</span>
          </div>
        </div>
      </div>

      {/* Arrow nav */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-10 pointer-events-none">
        <button
          onClick={() => onGoToLine(lineIndex - 1)}
          disabled={lineIndex === 0}
          className="pointer-events-auto glass-lighter rounded-full w-11 h-11 flex items-center justify-center text-xl text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
        >‹</button>
        <button
          onClick={() => onGoToLine(lineIndex + 1)}
          disabled={lineIndex === lines.length - 1}
          className="pointer-events-auto glass-lighter rounded-full w-11 h-11 flex items-center justify-center text-xl text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
        >›</button>
      </div>

      {/* Bottom poem lines */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8">
        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {lines.map((line, i) => (
              <button
                key={i}
                onClick={() => onGoToLine(i)}
                className={`w-full text-left font-literary transition-all duration-400 rounded px-1 py-0.5 ${
                  i === lineIndex ? "text-lg text-gradient-gold line-glow"
                  : i < lineIndex ? "text-sm text-foreground/35 hover:text-foreground/60"
                  : "text-sm text-foreground/20 hover:text-foreground/40"
                }`}
              >
                {line}
                {loadingLine === i && (
                  <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full border border-primary/40 border-t-primary animate-spin align-middle" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/30 text-center mt-4 font-sans">
            Click a line · Arrow keys to navigate · Esc to go back
          </p>
        </div>
      </div>
    </div>
  );
}
