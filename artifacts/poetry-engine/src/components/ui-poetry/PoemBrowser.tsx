import { PRESET_POEMS, type Poem } from "@/lib/presets";

interface PoemBrowserProps {
  selectedPoem: Poem | null;
  onSelect: (poem: Poem) => void;
  onClose: () => void;
}

export function PoemBrowser({ selectedPoem, onSelect, onClose }: PoemBrowserProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative glass rounded-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-literary text-xl text-foreground">Poem Library</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a poem to visualize
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-lighter flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {PRESET_POEMS.map((poem) => (
            <button
              key={poem.id}
              onClick={() => { onSelect(poem); onClose(); }}
              className={`w-full text-left rounded-xl p-4 transition-all border ${
                selectedPoem?.id === poem.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-transparent glass-lighter hover:border-white/10"
              }`}
            >
              <p className="font-literary text-foreground text-sm">{poem.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{poem.author}</p>
              <p className="text-xs text-foreground/40 mt-2 font-literary italic line-clamp-1">
                "{poem.lines[0]}"
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
