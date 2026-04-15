import { useState, useEffect, useRef, useCallback } from 'react';
import { WhaleEvent } from '@/lib/types';

interface WhaleOrbTooltipProps {
  whaleEvents: WhaleEvent[];
}

export function WhaleOrbTooltip({ whaleEvents }: WhaleOrbTooltipProps) {
  // This component listens for a custom event dispatched by the WhaleOrbs scene component
  const [info, setInfo] = useState<{
    x: number;
    y: number;
    event: WhaleEvent;
  } | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setInfo(e.detail);
    };
    window.addEventListener('whale-orb-hover' as any, handler);
    return () => window.removeEventListener('whale-orb-hover' as any, handler);
  }, []);

  if (!info) return null;

  const { event } = info;
  const isLong = event.trade.side === 'long';

  return (
    <div
      className="fixed z-30 pointer-events-none transition-opacity duration-200"
      style={{
        left: info.x + 16,
        top: info.y - 20,
        opacity: 1,
      }}
    >
      <div
        className="glass-surface rounded-lg px-3 py-2 min-w-[180px]"
        style={{
          borderLeft: `2px solid ${isLong ? 'hsl(190, 100%, 50%)' : 'hsl(320, 100%, 60%)'}`,
          boxShadow: `0 0 20px ${isLong ? 'hsl(190, 100%, 50%, 0.2)' : 'hsl(320, 100%, 60%, 0.2)'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isLong ? 'hsl(190, 100%, 50%)' : 'hsl(320, 100%, 60%)',
              boxShadow: `0 0 6px ${isLong ? 'hsl(190, 100%, 50%, 0.8)' : 'hsl(320, 100%, 60%, 0.8)'}`,
            }}
          />
          <span className="text-[10px] font-mono tracking-wider text-foreground font-bold">
            {event.label}
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-muted-foreground">Size</span>
            <span className="text-foreground">${(event.trade.sizeUsd / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-muted-foreground">Price</span>
            <span className="text-foreground">${event.trade.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-muted-foreground">Score</span>
            <span style={{ color: 'hsl(45, 100%, 55%)' }}>{event.score}</span>
          </div>
          {event.trade.isLiquidation && (
            <div className="text-[9px] font-mono text-destructive mt-1">⚡ LIQUIDATION</div>
          )}
        </div>
      </div>
    </div>
  );
}
