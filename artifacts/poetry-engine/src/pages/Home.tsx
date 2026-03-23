import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { CURATED_POEMS } from "@/lib/curatedPoems";

const PARTICLE_COUNT = 80;

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08,
      opacity: Math.random() * 0.6 + 0.2,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      opacitySpeed: Math.random() * 0.005 + 0.002,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir * p.opacitySpeed;
        if (p.opacity > 0.85 || p.opacity < 0.1) p.opacityDir *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,190,255,${p.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const POEM_ICONS: Record<string, string> = {
  tyger: "🐯",
  frost: "🍂",
  neruda: "✨",
  whitman: "⚓",
};

const headerLinkStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "9px 20px", borderRadius: 8,
  border: "1px solid rgba(212,160,23,0.4)",
  background: "rgba(212,160,23,0.08)",
  color: "#d4a017",
  fontSize: 13, fontFamily: "Inter, sans-serif", letterSpacing: "0.04em",
  cursor: "pointer", textDecoration: "none",
  transition: "all 0.2s ease",
};

const ctaLinkStyle: React.CSSProperties = {
  padding: "14px 36px", borderRadius: 10,
  background: "linear-gradient(135deg, #d4a017 0%, #b87820 100%)",
  color: "#000", fontFamily: "Inter, sans-serif",
  fontSize: 14, fontWeight: 600, letterSpacing: "0.05em",
  textDecoration: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(212,160,23,0.35)",
  transition: "all 0.2s ease",
};

export function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #04050f 0%, #080518 40%, #060520 100%)" }}>
      <StarField />

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,60,220,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "50%", right: "8%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,100,200,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "35%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,80,30,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div style={{ width: 3, height: 24, background: "#d4a017", borderRadius: 2 }} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
              Poetry Visualization Engine
            </span>
          </div>
          <Link
            href="/visualize"
            style={headerLinkStyle}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.18)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,23,0.7)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(212,160,23,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,160,23,0.4)";
            }}
          >
            Visualize your own poem →
          </Link>
        </header>

        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-8 pb-14 px-6">
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#d4a017", marginBottom: 18, fontFamily: "Inter, sans-serif" }}>
            Four poems. Four worlds.
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 400, lineHeight: 1.15, color: "#fff", marginBottom: 18, maxWidth: 680 }}>
            Every line becomes<br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>a living world.</span>
          </h1>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.38)", maxWidth: 480, lineHeight: 1.7, fontStyle: "italic" }}>
            Hand-crafted 3D scenes for each verse — from Blake's fire-eyed tiger
            to Neruda's trembling cosmos.
          </p>
        </div>

        {/* Poem Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 22, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "0 32px 60px" }}>
          {CURATED_POEMS.map((poem) => (
            <PoemCard key={poem.id} poem={poem} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-col items-center pb-16 px-6 mt-auto">
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.15))", marginBottom: 24 }} />
          <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 16, fontStyle: "italic" }}>
            Have your own poem?
          </p>
          <Link
            href="/visualize"
            style={ctaLinkStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(212,160,23,0.55)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(212,160,23,0.35)"; }}
          >
            Visualize your own poem →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PoemCard({ poem }: { poem: (typeof CURATED_POEMS)[number] }) {
  return (
    <Link
      href={`/poem/${poem.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.035)",
        backdropFilter: "blur(12px)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-5px)";
        el.style.boxShadow = `0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px ${poem.themeColor}44`;
        el.style.borderColor = poem.themeColor + "55";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {/* Color preview bar */}
      <div style={{ height: 110, background: `linear-gradient(135deg, ${poem.accentColor}55 0%, ${poem.themeColor}33 50%, transparent 100%)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${poem.themeColor}40 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 48, filter: `drop-shadow(0 0 12px ${poem.themeColor}88)` }}>
          {POEM_ICONS[poem.id]}
        </div>
        <div style={{ position: "absolute", top: 12, right: 14, fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
          {poem.year}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 22px 22px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: poem.themeColor, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
          {poem.author}
        </div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: 400, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
          {poem.title}
        </h2>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, fontStyle: "italic", marginBottom: 16 }}>
          {poem.description}
        </p>

        {/* Line previews */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
          {poem.lines.slice(0, 3).map((line, i) => (
            <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.7, paddingLeft: 8, borderLeft: i === 0 ? `2px solid ${poem.themeColor}66` : "2px solid transparent" }}>
              {line.text}
            </div>
          ))}
          {poem.lines.length > 3 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4, paddingLeft: 8, fontFamily: "Inter, sans-serif" }}>
              +{poem.lines.length - 3} more lines
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: 12, color: poem.themeColor, fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}>
          Enter the world →
        </div>
      </div>
    </Link>
  );
}
