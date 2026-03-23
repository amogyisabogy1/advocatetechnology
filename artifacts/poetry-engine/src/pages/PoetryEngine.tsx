import { useState, useEffect, useCallback, useRef } from "react";
import { useComposeScene } from "@workspace/api-client-react";
import type { SceneParams } from "@workspace/api-client-react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { CuratedSceneCanvas } from "@/components/three/CuratedSceneCanvas";
import { CURATED_POEMS } from "@/lib/curatedPoems";

// ─── Preset Poems ─────────────────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  author: string;
  text: string;
  bgScene: SceneParams;
  bgCustom?: string;
}

const PRESETS: Preset[] = [
  {
    id: "tyger",
    label: "The Tyger",
    author: "Blake",
    text: `Tyger Tyger, burning bright,
In the forests of the night;
What immortal hand or eye,
Could frame thy fearful symmetry?

In what distant deeps or skies,
Burnt the fire of thine eyes?
On what wings dare he aspire?
What the hand, dare seize the fire?`,
    bgScene: CURATED_POEMS.find((p) => p.id === "tyger")!.lines[0].scene,
    bgCustom: "tiger",
  },
  {
    id: "frost",
    label: "The Road Not Taken",
    author: "Frost",
    text: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "frost")!.lines[0].scene,
  },
  {
    id: "neruda",
    label: "Tonight I Can Write",
    author: "Neruda",
    text: `Tonight I can write the saddest lines.
Write, for example, 'The night is starry,
and the stars shiver, blue, in the distance.'
The night wind revolves in the sky and sings.
I loved her, and sometimes she loved me too.
Tonight I can write the saddest lines.`,
    bgScene: CURATED_POEMS.find((p) => p.id === "neruda")!.lines[0].scene,
  },
  {
    id: "whitman",
    label: "O Captain!",
    author: "Whitman",
    text: `O Captain! my Captain! our fearful trip is done,
The ship has weather'd every rack, the prize we sought is won,
The port is near, the bells I hear, the people all exulting,
But O heart! heart! heart!
O the bleeding drops of red,
Where on the deck my Captain lies,`,
    bgScene: CURATED_POEMS.find((p) => p.id === "whitman")!.lines[0].scene,
    bgCustom: "captain",
  },
];

type View = "input" | "visualize";

export function PoetryEngine() {
  const [view, setView] = useState<View>("input");
  const [poemText, setPoemText] = useState(PRESETS[0].text);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("tyger");
  const [bgScene, setBgScene] = useState<SceneParams>(PRESETS[0].bgScene);
  const [bgCustom, setBgCustom] = useState<string | undefined>(PRESETS[0].bgCustom);
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(PRESETS[0].bgScene);
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

  const handleVisualize = () => {
    const parsed = poemText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (parsed.length === 0) return;
    setLines(parsed);
    setLineIndex(0);
    setSceneCache({});
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
    setBgScene(PRESETS[0].bgScene);
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
        onVisualize={handleVisualize}
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
  poemText,
  onPoemTextChange,
  onVisualize,
  selectedPreset,
  onSelectPreset,
  onEnterOwn,
  bgScene,
  bgCustom,
  textareaRef,
}: InputViewProps) {
  const lineCount = poemText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).length;
  const isCustom = selectedPreset === null;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Live 3D background */}
      <CuratedSceneCanvas params={bgScene} isTransitioning={false} customScene={bgCustom} />

      {/* Vignette */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)" }}
      />

      {/* Layout: card + preset bar */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 gap-4">

        {/* Input card */}
        <div style={{
          width: "100%", maxWidth: 560,
          background: "rgba(4,5,15,0.72)",
          backdropFilter: "blur(20px)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 28px 20px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}>
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 10,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,140,30,0.65)", marginBottom: 14,
          }}>
            Poetry Visualization Engine
          </p>

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
              fontFamily: "Georgia, serif", fontSize: 15,
              lineHeight: 1.85,
              color: isCustom && !poemText ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.88)",
              caretColor: "#ff8c1a", display: "block",
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onVisualize(); }
            }}
          />

          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>
              {lineCount > 0 ? `${lineCount} line${lineCount !== 1 ? "s" : ""}` : ""}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.16)" }}>⌘↵</span>
              <button
                onClick={onVisualize}
                disabled={lineCount === 0}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  background: lineCount === 0 ? "rgba(212,120,20,0.2)" : "linear-gradient(135deg, #e8900a 0%, #c86808 100%)",
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

        {/* Preset / Enter-own bar */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 6, flexWrap: "wrap", justifyContent: "center",
          maxWidth: 620,
        }}>
          {/* 4 preset pills */}
          {PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                style={{
                  padding: "7px 16px", borderRadius: 20,
                  border: `1px solid ${isActive ? "rgba(255,140,30,0.7)" : "rgba(255,255,255,0.12)"}`,
                  background: isActive ? "rgba(255,140,30,0.18)" : "rgba(4,5,15,0.55)",
                  backdropFilter: "blur(10px)",
                  color: isActive ? "#ff8c1a" : "rgba(255,255,255,0.45)",
                  fontFamily: "Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 0 12px rgba(255,140,30,0.22)" : "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                  }
                }}
              >
                {preset.label}
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.55, fontStyle: "normal", fontFamily: "Inter, sans-serif" }}>
                  {preset.author}
                </span>
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />

          {/* Enter your own */}
          <button
            onClick={onEnterOwn}
            style={{
              padding: "7px 16px", borderRadius: 20,
              border: `1px solid ${isCustom ? "rgba(180,180,255,0.55)" : "rgba(255,255,255,0.18)"}`,
              background: isCustom ? "rgba(120,100,255,0.18)" : "rgba(4,5,15,0.55)",
              backdropFilter: "blur(10px)",
              color: isCustom ? "rgba(200,190,255,0.9)" : "rgba(255,255,255,0.55)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12, fontWeight: 500,
              letterSpacing: "0.03em",
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: isCustom ? "0 0 12px rgba(140,120,255,0.2)" : "none",
              display: "flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              if (!isCustom) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(180,180,255,0.45)";
                (e.currentTarget as HTMLElement).style.color = "rgba(200,190,255,0.75)";
              }
            }}
            onMouseLeave={e => {
              if (!isCustom) {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>✎</span>
            Enter your own
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
}

function VisualizeView({ lines, lineIndex, sceneParams, isTransitioning, loadingLine, onGoToLine, onBack }: VisualizeViewProps) {
  const isLoading = loadingLine !== null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <SceneCanvas params={sceneParams} isTransitioning={isTransitioning} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={onBack}
          className="glass-lighter rounded-xl px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-sans flex items-center gap-2"
        >
          ← Edit poem
        </button>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-primary/40 border-t-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Composing…</span>
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
            Click a line · Arrow keys to navigate · Esc to edit
          </p>
        </div>
      </div>
    </div>
  );
}
