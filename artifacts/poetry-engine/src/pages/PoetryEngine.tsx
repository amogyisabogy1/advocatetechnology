import { useState, useEffect, useCallback, useRef } from "react";
import { useComposeScene } from "@workspace/api-client-react";
import type { SceneParams } from "@workspace/api-client-react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { DEFAULT_SCENE } from "@/lib/defaultScene";

type View = "input" | "visualize";

const PLACEHOLDER = `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth.`;

export function PoetryEngine() {
  const [view, setView] = useState<View>("input");
  const [poemText, setPoemText] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(DEFAULT_SCENE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingLine, setLoadingLine] = useState<number | null>(null);
  const [sceneCache, setSceneCache] = useState<Record<number, SceneParams>>({});
  const abortRef = useRef<AbortController | null>(null);

  const { mutateAsync: composeScene } = useComposeScene();

  const loadScene = useCallback(
    async (idx: number, poemLines: string[]) => {
      // Use cache if available
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
    setSceneParams(DEFAULT_SCENE);
  };

  const goToLine = (idx: number) => {
    if (idx < 0 || idx >= lines.length) return;
    setLineIndex(idx);
  };

  // Load scene whenever lineIndex changes in visualize view
  useEffect(() => {
    if (view !== "visualize" || lines.length === 0) return;
    loadScene(lineIndex, lines);
  }, [view, lineIndex, lines]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation
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

// ─── Input View ──────────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <span className="font-literary text-foreground/70 text-sm tracking-wide">
            Poetry Visualization Engine
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="w-full mb-8 text-center">
          <h1 className="font-literary text-3xl text-foreground mb-2">
            Paste your poem.
          </h1>
          <p className="text-muted-foreground text-sm">
            Each line will become its own 3D world.
          </p>
        </div>

        {/* Textarea */}
        <div className="w-full relative">
          <textarea
            value={poemText}
            onChange={(e) => onPoemTextChange(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            className="w-full resize-none rounded-2xl font-literary text-lg leading-relaxed
              bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/30
              px-6 py-5 outline-none focus:border-primary/40 transition-colors"
            style={{ lineHeight: "1.9" }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onVisualize();
              }
            }}
          />
        </div>

        {/* Footer row */}
        <div className="w-full mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/50">
            {lineCount > 0 ? `${lineCount} line${lineCount !== 1 ? "s" : ""}` : ""}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground/40 hidden sm:block">
              ⌘↵ to visualize
            </span>
            <button
              onClick={onVisualize}
              disabled={lineCount === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-sans
                bg-primary text-primary-foreground
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Visualize →
            </button>
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
      {/* 3D scene — full screen behind everything */}
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
          {/* All lines, scrollable if many */}
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

          {/* Nav hint */}
          <p className="text-xs text-muted-foreground/30 text-center mt-4 font-sans">
            Click a line · Arrow keys to navigate · Esc to edit
          </p>
        </div>
      </div>
    </div>
  );
}
