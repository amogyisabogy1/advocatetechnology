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
  text: string;
  bgScene: SceneParams;
  bgCustom?: string;
}

const ADVOCATE_PRESETS: Preset[] = [
  {
    id: "weight",
    label: "Weight",
    author: "Indovina",
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
    author: "Kimball",
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
    author: "Wayland",
    text: `A winter windstorm
blows down the power lines. We
eat by candlelight.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "haiku")!.lines[0].scene,
  },
  {
    id: "alti",
    label: "Have You Not Learned",
    author: "Alti",
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

const DEFAULT_PRESET = ADVOCATE_PRESETS[0];

type View = "input" | "visualize";

export function PoetryEngine() {
  const [view, setView] = useState<View>("input");
  const [poemText, setPoemText] = useState(DEFAULT_PRESET.text);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(DEFAULT_PRESET.id);
  const [bgScene, setBgScene] = useState<SceneParams>(DEFAULT_PRESET.bgScene);
  const [bgCustom, setBgCustom] = useState<string | undefined>(DEFAULT_PRESET.bgCustom);
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(DEFAULT_PRESET.bgScene);
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

  const handleVisualize = (overrideText?: string, overridePresetId?: string | null) => {
    const text = overrideText ?? poemText;
    const presetId = overridePresetId !== undefined ? overridePresetId : selectedPreset;
    const parsed = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (parsed.length === 0) return;
    setLines(parsed);
    setLineIndex(0);

    // Pre-populate scene cache with curated scenes for advocate presets — no AI needed
    const curatedPoem = presetId ? CURATED_POEMS.find((p) => p.id === presetId) : null;
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

  const handleBack = () => {
    if (abortRef.current) abortRef.current.abort();
    setView("input");
    setSceneCache({});
    setSceneParams(bgScene);
  };

  const goToLine = (idx: number) => {
    if (idx < 0 || idx >= lines.length) return;
    setLineIndex(idx);
  };

  const selectPreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setPoemText(preset.text);
    setBgScene(preset.bgScene);
    setBgCustom(preset.bgCustom);
  };

  const handleEnterOwn = () => {
    setSelectedPreset(null);
    setPoemText("");
    setBgScene(DEFAULT_PRESET.bgScene);
    setBgCustom(undefined);
    setTimeout(() => textareaRef.current?.focus(), 50);
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

  if (view === "input") {
    return (
      <InputView
        poemText={poemText}
        onPoemTextChange={(v) => { setPoemText(v); setSelectedPreset(null); }}
        onVisualize={() => handleVisualize()}
        selectedPreset={selectedPreset}
        onSelectPreset={selectPreset}
        onEnterOwn={handleEnterOwn}
        bgScene={bgScene}
        bgCustom={bgCustom}
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

// ─── Input View ───────────────────────────────────────────────────────────────

interface InputViewProps {
  poemText: string;
  onPoemTextChange: (v: string) => void;
  onVisualize: () => void;
  selectedPreset: string | null;
  onSelectPreset: (p: Preset) => void;
  onEnterOwn: () => void;
  bgScene: SceneParams;
  bgCustom?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

function InputView({
  poemText, onPoemTextChange, onVisualize,
  selectedPreset, onSelectPreset, onEnterOwn,
  bgScene, bgCustom, textareaRef,
}: InputViewProps) {
  const lineCount = poemText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).length;
  const isCustom = selectedPreset === null;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Live 3D background */}
      <CuratedSceneCanvas params={bgScene} isTransitioning={false} customScene={bgCustom} />

      {/* Vignette */}
      <div className="absolute inset-0 z-10" style={{
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.68) 100%)",
      }} />

      {/* Layout */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 gap-3">

        {/* ── Main input card (shown only when a preset is selected or custom) ── */}
        {(selectedPreset || isCustom) && (
          <div style={{
            width: "100%", maxWidth: 560,
            background: "rgba(4,5,15,0.75)",
            backdropFilter: "blur(24px)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "26px 28px 20px",
            boxShadow: "0 28px 80px rgba(0,0,0,0.75)",
          }}>
            {/* Tiny label */}
            <p style={{
              fontFamily: "Inter, sans-serif", fontSize: 10,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(255,140,30,0.6)", marginBottom: 14,
            }}>
              Poetry Visualization Engine
            </p>

            {/* Poem text */}
            <textarea
              ref={textareaRef}
              value={poemText}
              onChange={(e) => onPoemTextChange(e.target.value)}
              rows={isCustom ? 8 : 9}
              spellCheck={false}
              placeholder={isCustom ? "Paste or type your poem here…" : undefined}
              style={{
                width: "100%", resize: "none",
                background: "transparent", border: "none", outline: "none",
                fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.85,
                color: "rgba(255,255,255,0.88)",
                caretColor: "#ff8c1a", display: "block",
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onVisualize(); }
              }}
            />

            {/* Bottom row */}
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                {lineCount > 0 ? `${lineCount} line${lineCount !== 1 ? "s" : ""}` : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.16)" }}>⌘↵</span>
                <button
                  onClick={onVisualize}
                  disabled={lineCount === 0}
                  style={{
                    padding: "8px 20px", borderRadius: 10,
                    background: lineCount === 0
                      ? "rgba(212,120,20,0.18)"
                      : "linear-gradient(135deg, #e8900a 0%, #c86808 100%)",
                    color: lineCount === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                    fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                    letterSpacing: "0.04em", border: "none",
                    cursor: lineCount === 0 ? "not-allowed" : "pointer",
                    boxShadow: lineCount > 0 ? "0 4px 16px rgba(232,144,10,0.4)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  Visualize →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Harvard Advocate section ── */}
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Section header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 10,
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 9.5,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(255,60,60,0.7)",
              whiteSpace: "nowrap",
            }}>
              Harvard Advocate · Fear Issue
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* 4 poem pills — equal width in one row */}
          <div style={{ display: "flex", gap: 6 }}>
            {ADVOCATE_PRESETS.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 12,
                    border: `1px solid ${isActive ? "rgba(255,60,60,0.6)" : "rgba(255,255,255,0.1)"}`,
                    background: isActive
                      ? "rgba(255,30,30,0.15)"
                      : "rgba(4,5,15,0.6)",
                    backdropFilter: "blur(12px)",
                    color: isActive ? "rgba(255,160,160,0.95)" : "rgba(255,255,255,0.45)",
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: isActive ? "0 0 18px rgba(255,40,40,0.18)" : "none",
                    textAlign: "center" as const,
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <span style={{
                    fontSize: 12.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                    width: "100%",
                    textAlign: "center",
                  }}>
                    {preset.label}
                  </span>
                  <span style={{
                    fontStyle: "normal",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9.5,
                    letterSpacing: "0.06em",
                    opacity: 0.55,
                  }}>
                    {preset.author}
                  </span>
                </button>
              );
            })}
          </div>

          {/* "Visualize your own poems!" — full width, below */}
          <button
            onClick={onEnterOwn}
            style={{
              marginTop: 6,
              width: "100%",
              padding: "11px 16px",
              borderRadius: 12,
              border: `1px solid ${isCustom ? "rgba(160,140,255,0.55)" : "rgba(255,255,255,0.1)"}`,
              background: isCustom
                ? "rgba(110,90,255,0.18)"
                : "rgba(4,5,15,0.5)",
              backdropFilter: "blur(12px)",
              color: isCustom ? "rgba(200,190,255,0.95)" : "rgba(255,255,255,0.4)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12.5, fontWeight: 500,
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: isCustom ? "0 0 20px rgba(130,110,255,0.2)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.7 }}>✎</span>
            Visualize your own poems
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
