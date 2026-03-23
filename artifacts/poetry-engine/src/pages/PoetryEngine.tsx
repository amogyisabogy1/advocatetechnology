import { useState, useEffect, useCallback, useRef } from "react";
import { useComposeScene } from "@workspace/api-client-react";
import type { SceneParams } from "@workspace/api-client-react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { CuratedSceneCanvas } from "@/components/three/CuratedSceneCanvas";
import { CURATED_POEMS } from "@/lib/curatedPoems";

// Tyger line 0 scene — blazes in the background during input
const TYGER_BG_SCENE = CURATED_POEMS.find((p) => p.id === "tyger")!.lines[0].scene;

const DEFAULT_POEM = `Tyger Tyger, burning bright,
In the forests of the night;
What immortal hand or eye,
Could frame thy fearful symmetry?

In what distant deeps or skies,
Burnt the fire of thine eyes?
On what wings dare he aspire?
What the hand, dare seize the fire?`;

type View = "input" | "visualize";

export function PoetryEngine() {
  const [view, setView] = useState<View>("input");
  const [poemText, setPoemText] = useState(DEFAULT_POEM);
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(TYGER_BG_SCENE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingLine, setLoadingLine] = useState<number | null>(null);
  const [sceneCache, setSceneCache] = useState<Record<number, SceneParams>>({});
  const abortRef = useRef<AbortController | null>(null);

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
          data: {
            line: poemLines[idx],
            context: poemLines.slice(0, idx),
          },
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
    setSceneParams(TYGER_BG_SCENE);
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
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToLine(lineIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToLine(lineIndex - 1);
      } else if (e.key === "Escape") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, lineIndex, lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === "input") {
    return (
      <InputView
        poemText={poemText}
        onPoemTextChange={setPoemText}
        onVisualize={handleVisualize}
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
// Full-screen Tyger scene behind the input — the 3D world is live immediately

interface InputViewProps {
  poemText: string;
  onPoemTextChange: (v: string) => void;
  onVisualize: () => void;
}

function InputView({ poemText, onPoemTextChange, onVisualize }: InputViewProps) {
  const lineCount = poemText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* The Tyger blazes behind everything */}
      <CuratedSceneCanvas
        params={TYGER_BG_SCENE}
        isTransitioning={false}
        customScene="tiger"
      />

      {/* Dark vignette to make text readable */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Centered input card */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "rgba(4,5,15,0.72)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "32px 32px 24px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          }}
        >
          {/* Tiny label */}
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,140,30,0.7)",
              marginBottom: 14,
            }}
          >
            Poetry Visualization Engine
          </p>

          {/* Textarea */}
          <textarea
            value={poemText}
            onChange={(e) => onPoemTextChange(e.target.value)}
            rows={10}
            spellCheck={false}
            style={{
              width: "100%",
              resize: "none",
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "Georgia, serif",
              fontSize: 16,
              lineHeight: 1.85,
              color: "rgba(255,255,255,0.88)",
              caretColor: "#ff8c1a",
              display: "block",
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onVisualize();
              }
            }}
          />

          {/* Bottom row */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.04em",
              }}
            >
              {lineCount > 0
                ? `${lineCount} line${lineCount !== 1 ? "s" : ""}`
                : "paste or type your poem"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                ⌘↵
              </span>
              <button
                onClick={onVisualize}
                disabled={lineCount === 0}
                style={{
                  padding: "9px 22px",
                  borderRadius: 10,
                  background:
                    lineCount === 0
                      ? "rgba(212,120,20,0.25)"
                      : "linear-gradient(135deg, #e8900a 0%, #c86808 100%)",
                  color: lineCount === 0 ? "rgba(255,255,255,0.25)" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  border: "none",
                  cursor: lineCount === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  boxShadow:
                    lineCount > 0
                      ? "0 4px 18px rgba(232,144,10,0.4)"
                      : "none",
                }}
              >
                Visualize →
              </button>
            </div>
          </div>
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

function VisualizeView({
  lines,
  lineIndex,
  sceneParams,
  isTransitioning,
  loadingLine,
  onGoToLine,
  onBack,
}: VisualizeViewProps) {
  const isLoading = loadingLine !== null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* 3D scene */}
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
            <span className="text-xs text-muted-foreground font-sans">
              {lineIndex + 1} / {lines.length}
            </span>
          </div>
        </div>
      </div>

      {/* Left / Right arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-10 pointer-events-none">
        <button
          onClick={() => onGoToLine(lineIndex - 1)}
          disabled={lineIndex === 0}
          className="pointer-events-auto glass-lighter rounded-full w-11 h-11 flex items-center justify-center
            text-xl text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
        >
          ‹
        </button>
        <button
          onClick={() => onGoToLine(lineIndex + 1)}
          disabled={lineIndex === lines.length - 1}
          className="pointer-events-auto glass-lighter rounded-full w-11 h-11 flex items-center justify-center
            text-xl text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
        >
          ›
        </button>
      </div>

      {/* Bottom: poem lines */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8">
        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {lines.map((line, i) => (
              <button
                key={i}
                onClick={() => onGoToLine(i)}
                className={`w-full text-left font-literary transition-all duration-400 rounded px-1 py-0.5 ${
                  i === lineIndex
                    ? "text-lg text-gradient-gold line-glow"
                    : i < lineIndex
                    ? "text-sm text-foreground/35 hover:text-foreground/60"
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
