import { WhaleEvent } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';

interface WhalePulseFeedProps {
  whaleEvents: WhaleEvent[];
}

export function WhalePulseFeed({ whaleEvents }: WhalePulseFeedProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show last 20 events, newest first
  const visible = [...whaleEvents].slice(-20).reverse();

  // Refresh opacity every 5s so items fade smoothly over time
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      data-tour="whale-feed"
      className="fixed left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col max-h-[55vh] w-[260px]"
    >
      <div className="text-xs font-mono tracking-[0.2em] uppercase text-muted-foreground mb-2 text-glow-cyan pointer-events-none">
        Whale Pulse Feed
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 pointer-events-auto scrollbar-thin"
        style={{
          maxHeight: 'calc(55vh - 28px)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
        }}
      >
        <div className="flex flex-col gap-2 pb-2">
          {visible.map((event) => {
            const isCyan = event.trade.side === 'long';
            const intensity = event.score / 100;
            const age = (Date.now() - event.timestamp) / 1000;
            const fadeOpacity = Math.max(0.2, 1 - age / 180);
            const isHovered = hoveredId === event.id;
            const accentColor = isCyan ? 'hsl(190, 100%, 50%)' : 'hsl(320, 100%, 60%)';
            const sym = event.symbol || '?';

            return (
              <div
                key={event.id}
                className="glass-surface rounded-lg px-3 py-2 pointer-events-auto cursor-default transition-all duration-300"
                style={{
                  opacity: fadeOpacity,
                  borderLeft: `2px solid ${accentColor}`,
                  boxShadow: isHovered
                    ? `0 0 ${20 * intensity}px ${isCyan ? 'hsl(190, 100%, 50%, 0.5)' : 'hsl(320, 100%, 60%, 0.5)'}`
                    : `0 0 ${8 * intensity}px ${isCyan ? 'hsl(190, 100%, 50%, 0.2)' : 'hsl(320, 100%, 60%, 0.2)'}`,
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  animation: age < 3 ? 'slideInLeft 0.4s ease-out' : undefined,
                }}
                onMouseEnter={() => setHoveredId(event.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div
                    className="w-2 h-2 rounded-full whale-pulse flex-shrink-0"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${isCyan ? 'hsl(190, 100%, 50%, 0.8)' : 'hsl(320, 100%, 60%, 0.8)'}`,
                    }}
                  />
                  <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/5 text-muted-foreground font-bold">
                    {sym}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    ${(event.trade.sizeUsd / 1000).toFixed(0)}K
                  </span>
                  <span className="text-xs font-semibold" style={{ color: accentColor }}>
                    {event.trade.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {event.label} · Score {event.score}
                </div>

                {/* Expanded details on hover */}
                {isHovered && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 space-y-0.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="text-foreground">${event.trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-muted-foreground">Size</span>
                      <span className="text-foreground">${event.trade.sizeUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-muted-foreground">Size (qty)</span>
                      <span className="text-foreground">{event.trade.size.toFixed(4)}</span>
                    </div>
                    {event.trade.isLiquidation && (
                      <div className="text-[9px] font-mono text-destructive">⚡ LIQUIDATION</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="text-[10px] text-muted-foreground font-mono text-center py-4 opacity-50">
              Scanning for whale activity...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
