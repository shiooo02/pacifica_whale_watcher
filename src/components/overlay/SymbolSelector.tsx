import { useState, useRef, useEffect } from 'react';
import { useSymbol, PacificaSymbol } from '@/contexts/SymbolContext';

export function SymbolSelector() {
  const { symbol, setSymbol, availableSymbols } = useSymbol();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<PacificaSymbol | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} data-tour="symbol-selector" className="fixed top-6 right-6 z-10">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="glass-surface rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
        style={{
          borderColor: open ? 'hsl(190, 100%, 50%)' : undefined,
          boxShadow: open ? '0 0 20px hsl(190, 100%, 50%, 0.2)' : undefined,
        }}
      >
        <div className="w-2 h-2 rounded-full whale-pulse" style={{
          backgroundColor: 'hsl(190, 100%, 50%)',
          boxShadow: '0 0 6px hsl(190, 100%, 50%, 0.8)',
        }} />
        <span className="font-mono text-sm font-bold tracking-wider text-foreground">
          {symbol}
        </span>
        <svg
          className="w-3 h-3 text-muted-foreground transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 glass-surface rounded-lg overflow-hidden"
          style={{
            minWidth: '140px',
            boxShadow: '0 10px 40px hsl(230, 25%, 5%, 0.8), 0 0 30px hsl(190, 100%, 50%, 0.1)',
          }}
        >
          <div className="px-3 py-1.5 border-b border-border">
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
              Markets
            </span>
          </div>
          {availableSymbols.map((s) => {
            const isActive = s === symbol;
            const isHov = s === hovered;
            return (
              <button
                key={s}
                onClick={() => { setSymbol(s); setOpen(false); }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                className="w-full px-3 py-2 flex items-center gap-2 transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: isActive
                    ? 'hsl(190, 100%, 50%, 0.1)'
                    : isHov
                    ? 'hsl(230, 20%, 15%, 0.8)'
                    : 'transparent',
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? 'hsl(190, 100%, 50%)' : 'hsl(230, 20%, 30%)',
                    boxShadow: isActive ? '0 0 6px hsl(190, 100%, 50%, 0.8)' : 'none',
                    transform: isHov && !isActive ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
                <span
                  className="font-mono text-xs tracking-wider"
                  style={{
                    color: isActive ? 'hsl(190, 100%, 50%)' : 'hsl(210, 15%, 55%)',
                  }}
                >
                  {s}
                </span>
                {isActive && (
                  <span className="ml-auto text-[8px] font-mono text-muted-foreground uppercase">
                    live
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
