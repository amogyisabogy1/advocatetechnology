import { useRef, useEffect } from "react";
import type { Poem } from "@/lib/presets";

interface PoetryOverlayProps {
  mode: "browse" | "live";
  currentPoem: Poem | null;
  currentLineIndex: number;
  liveLines: string[];
  liveInput: string;
  onLiveInputChange: (v: string) => void;
  onLiveInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export function PoetryOverlay({
  mode,
  currentPoem,
  currentLineIndex,
  liveLines,
  liveInput,
  onLiveInputChange,
  onLiveInputKeyDown,
  isLoading,
}: PoetryOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "live" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  if (mode === "browse" && currentPoem) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-16 px-8">
        {/* Bottom poem display */}
        <div className="glass rounded-2xl p-6 max-w-2xl mx-auto w-full pointer-events-none">
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              {currentPoem.author}
            </p>
            <p className="text-sm font-literary text-muted-foreground mt-0.5">
              {currentPoem.title}
            </p>
          </div>

          <div className="space-y-1.5">
            {currentPoem.lines.map((line, i) => (
              <p
                key={i}
                className={`font-literary text-center transition-all duration-500 ${
                  i === currentLineIndex
                    ? "text-xl text-gradient-gold line-glow opacity-100"
                    : i < currentLineIndex
                    ? "text-sm text-foreground/40"
                    : "text-sm text-foreground/20"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "live") {
    return (
      <div className="absolute inset-0 flex flex-col justify-end pb-16 px-8">
        {/* Previous live lines */}
        <div className="max-w-2xl mx-auto w-full mb-6 space-y-2 pointer-events-none">
          {liveLines.slice(-4).map((line, i, arr) => (
            <p
              key={i}
              className={`font-literary text-center transition-all duration-500 fade-up ${
                i === arr.length - 1
                  ? "text-lg text-foreground/70"
                  : "text-sm text-foreground/30"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Input area */}
        <div className="glass rounded-2xl p-5 max-w-2xl mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center mb-3">
            Live Editor — Press Enter to Generate Scene
          </p>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={liveInput}
              onChange={(e) => onLiveInputChange(e.target.value)}
              onKeyDown={onLiveInputKeyDown}
              placeholder="Write a line of poetry..."
              className="w-full bg-transparent font-literary text-xl text-foreground placeholder:text-foreground/20 border-none outline-none text-center"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            ↵ Enter to compose scene
          </p>
        </div>
      </div>
    );
  }

  return null;
}
