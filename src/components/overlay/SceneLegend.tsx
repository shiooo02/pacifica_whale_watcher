import { useState, useEffect } from 'react';

export function SceneLegend() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Auto-dismiss after 12s
  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 600);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-28 left-4 z-30 pointer-events-auto transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="glass-surface rounded-lg px-4 py-3 max-w-[220px] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-whale-cyan text-glow-cyan">
            Legend
          </span>
          <button
            onClick={() => { setFading(true); setTimeout(() => setVisible(false), 400); }}
            className="text-muted-foreground hover:text-foreground text-xs leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5">
          <LegendRow color="bg-cyan-400" label="Long / Bullish trade" />
          <LegendRow color="bg-pink-500" label="Short / Bearish trade" />
          <LegendRow color="bg-amber-400" label="Neutral momentum" />
        </div>

        <div className="border-t border-white/10 pt-2 space-y-1">
          <LegendItem icon="●" text="Orb size = trade value" />
          <LegendItem icon="〰" text="Wave = price momentum" />
          <LegendItem icon="▓" text="Terrain = orderbook depth" />
          <LegendItem icon="🔊" text="Sound = whale activity" />
        </div>

        <p className="text-[9px] text-muted-foreground/60 font-mono">
          Hover orbs for details · Auto-hides in 12s
        </p>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-lg`} />
      <span className="text-[10px] font-mono text-foreground/80">{label}</span>
    </div>
  );
}

function LegendItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-4 text-center text-muted-foreground">{icon}</span>
      <span className="text-[10px] font-mono text-foreground/70">{text}</span>
    </div>
  );
}
