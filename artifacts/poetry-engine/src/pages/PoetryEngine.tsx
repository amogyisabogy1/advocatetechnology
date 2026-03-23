import { useState, useEffect, useRef, useCallback } from "react";
import { useComposeScene } from "@workspace/api-client-react";
import type { SceneParams } from "@workspace/api-client-react";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { PoetryOverlay } from "@/components/ui-poetry/PoetryOverlay";
import { PoemBrowser } from "@/components/ui-poetry/PoemBrowser";
import { DEFAULT_SCENE } from "@/lib/defaultScene";
import { PRESET_POEMS, type Poem } from "@/lib/presets";

type Mode = "browse" | "live";

export function PoetryEngine() {
  const [mode, setMode] = useState<Mode>("browse");
  const [sceneParams, setSceneParams] = useState<SceneParams>(DEFAULT_SCENE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  // Browse mode state
  const [currentPoem, setCurrentPoem] = useState<Poem>(PRESET_POEMS[0]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Live mode state
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const [liveInput, setLiveInput] = useState("");

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef<string[]>([]);

  const { mutateAsync: composeScene, isPending: isLoading } = useComposeScene();

  const applyScene = useCallback(
    async (line: string, context: string[]) => {
      setIsTransitioning(true);
      try {
        const params = await composeScene({
          data: { line, context },
        });
        setSceneParams(params);
      } catch (err) {
        console.error("Scene composition failed:", err);
      } finally {
        setTimeout(() => setIsTransitioning(false), 600);
      }
    },
    [composeScene]
  );

  // Auto-advance browse mode
  useEffect(() => {
    if (mode !== "browse" || !currentPoem) return;

    const line = currentPoem.lines[currentLineIndex];
    const context = currentPoem.lines.slice(0, currentLineIndex);
    applyScene(line, context);

    autoAdvanceRef.current = setTimeout(() => {
      setCurrentLineIndex((i) =>
        i < currentPoem.lines.length - 1 ? i + 1 : 0
      );
    }, 7000);

    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [mode, currentPoem, currentLineIndex, applyScene]);

  const handlePoemSelect = (poem: Poem) => {
    setCurrentPoem(poem);
    setCurrentLineIndex(0);
  };

  const handleLiveKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !liveInput.trim() || isLoading) return;
    const line = liveInput.trim();
    setLiveInput("");
    setLiveLines((prev) => [...prev, line]);
    contextRef.current = [...contextRef.current, line];
    await applyScene(line, contextRef.current.slice(0, -1));
  };

  const switchMode = (newMode: Mode) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setMode(newMode);
    if (newMode === "browse") {
      setCurrentLineIndex(0);
    } else {
      setLiveLines([]);
      contextRef.current = [];
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* 3D Canvas — always visible behind everything */}
      <SceneCanvas params={sceneParams} isTransitioning={isTransitioning} />

      {/* Top navigation bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <span className="font-literary text-foreground/80 text-sm tracking-wide">
            Poetry Visualization Engine
          </span>
        </div>

        {/* Mode switcher */}
        <div className="glass rounded-xl p-1 flex gap-1">
          {(["browse", "live"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs uppercase tracking-[0.15em] transition-all font-sans ${
                mode === m
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "browse" ? "Browse" : "Live Editor"}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {mode === "browse" && (
            <button
              onClick={() => setShowBrowser(true)}
              className="glass-lighter rounded-xl px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-sans"
            >
              Change Poem ↗
            </button>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 glass-lighter rounded-xl px-3 py-2">
              <div className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Composing scene…</span>
            </div>
          )}
        </div>
      </div>

      {/* Browse mode: line nav arrows */}
      {mode === "browse" && currentPoem && (
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-10 pointer-events-none">
          <button
            onClick={() => {
              if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
              setCurrentLineIndex((i) => Math.max(0, i - 1));
            }}
            disabled={currentLineIndex === 0}
            className="pointer-events-auto glass-lighter rounded-full w-10 h-10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
          >
            ‹
          </button>
          <button
            onClick={() => {
              if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
              setCurrentLineIndex((i) =>
                Math.min(currentPoem.lines.length - 1, i + 1)
              );
            }}
            disabled={currentLineIndex === currentPoem.lines.length - 1}
            className="pointer-events-auto glass-lighter rounded-full w-10 h-10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors disabled:opacity-20"
          >
            ›
          </button>
        </div>
      )}

      {/* Poetry overlay (lines / input) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto absolute inset-0">
          <PoetryOverlay
            mode={mode}
            currentPoem={currentPoem}
            currentLineIndex={currentLineIndex}
            liveLines={liveLines}
            liveInput={liveInput}
            onLiveInputChange={setLiveInput}
            onLiveInputKeyDown={handleLiveKeyDown}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Poem browser modal */}
      {showBrowser && (
        <div className="absolute inset-0 z-50">
          <PoemBrowser
            selectedPoem={currentPoem}
            onSelect={handlePoemSelect}
            onClose={() => setShowBrowser(false)}
          />
        </div>
      )}
    </div>
  );
}
