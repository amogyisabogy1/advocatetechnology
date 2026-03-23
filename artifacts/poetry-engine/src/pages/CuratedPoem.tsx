import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { CURATED_POEMS } from "@/lib/curatedPoems";
import { CuratedSceneCanvas } from "@/components/three/CuratedSceneCanvas";
import { DEFAULT_SCENE } from "@/lib/defaultScene";
import type { SceneParams } from "@workspace/api-client-react";

interface CuratedPoemProps {
  id: string;
}

export function CuratedPoem({ id }: CuratedPoemProps) {
  const poem = CURATED_POEMS.find((p) => p.id === id);
  const [lineIndex, setLineIndex] = useState(0);
  const [sceneParams, setSceneParams] = useState<SceneParams>(DEFAULT_SCENE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const goToLine = useCallback((idx: number) => {
    if (!poem) return;
    const clamped = Math.max(0, Math.min(idx, poem.lines.length - 1));
    setIsTransitioning(true);
    setTimeout(() => {
      setLineIndex(clamped);
      setSceneParams(poem.lines[clamped].scene);
      setIsTransitioning(false);
    }, 320);
  }, [poem]);

  useEffect(() => {
    if (!poem) return;
    setSceneParams(poem.lines[0].scene);
    setLineIndex(0);
    setHasStarted(true);
  }, [poem]);

  useEffect(() => {
    if (!poem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goToLine(lineIndex + 1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goToLine(lineIndex - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [poem, lineIndex, goToLine]);

  if (!poem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#04050f" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif", fontSize: 18 }}>Poem not found.</p>
        <Link href="/" style={{ color: "#d4a017", marginTop: 16, fontFamily: "Inter, sans-serif", textDecoration: "none" }}>← Back home</Link>
      </div>
    );
  }

  const currentLine = poem.lines[lineIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#04050f" }}>
      {/* 3D Scene */}
      {hasStarted && (
        <CuratedSceneCanvas
          params={sceneParams}
          isTransitioning={isTransitioning}
          customScene={currentLine.customScene}
        />
      )}

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
        zIndex: 20,
      }}>
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "Inter, sans-serif", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
        >
          ← All poems
        </Link>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>
            {poem.title}
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: poem.themeColor, fontFamily: "Inter, sans-serif", marginTop: 2 }}>
            {poem.author}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", letterSpacing: "0.05em" }}>
          {lineIndex + 1} / {poem.lines.length}
        </div>
      </div>

      {/* Current line display */}
      <div style={{
        position: "absolute", bottom: 160, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        zIndex: 20, padding: "0 40px", pointerEvents: "none",
      }}>
        <div style={{
          textAlign: "center",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(16px)",
          borderRadius: 12, padding: "16px 32px",
          border: `1px solid ${poem.themeColor}33`,
          maxWidth: 700,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1rem, 2.5vw, 1.45rem)", color: "#fff", lineHeight: 1.6, fontStyle: "italic", letterSpacing: "0.01em", margin: 0 }}>
            {currentLine.text}
          </p>
        </div>
      </div>

      {/* Bottom line navigation */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)",
        paddingBottom: 22, paddingTop: 40, zIndex: 20,
      }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", padding: "0 20px" }}>
          {poem.lines.map((line, i) => {
            const isActive = i === lineIndex;
            return (
              <button
                key={i}
                onClick={() => goToLine(i)}
                style={{
                  background: isActive ? poem.themeColor : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isActive ? poem.themeColor : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, padding: "6px 14px",
                  color: isActive ? "#000" : "rgba(255,255,255,0.45)",
                  fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12,
                  cursor: "pointer", transition: "all 0.2s ease",
                  maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  boxShadow: isActive ? `0 0 14px ${poem.themeColor}55` : "none",
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; } }}
              >
                {line.text}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}>
          {lineIndex > 0 && (
            <button onClick={() => goToLine(lineIndex - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", transition: "color 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              ← prev
            </button>
          )}
          <span style={{ opacity: 0.3 }}>arrow keys to navigate</span>
          {lineIndex < poem.lines.length - 1 && (
            <button onClick={() => goToLine(lineIndex + 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", transition: "color 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
