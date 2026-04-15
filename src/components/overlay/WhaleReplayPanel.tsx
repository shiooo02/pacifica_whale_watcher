import { Play, Pause, RotateCcw, History, X } from 'lucide-react';

interface WhaleReplayPanelProps {
  isReplaying: boolean;
  replayCursor: number;
  setReplayCursor: (v: number) => void;
  cursorTime: number;
  speed: number;
  setSpeed: (s: number) => void;
  playActive: boolean;
  togglePlay: () => void;
  startReplay: () => void;
  stopReplay: () => void;
  totalEvents: number;
  visibleEvents: number;
  timeRange: { start: number; end: number };
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function WhaleReplayPanel({
  isReplaying,
  replayCursor,
  setReplayCursor,
  cursorTime,
  speed,
  setSpeed,
  playActive,
  togglePlay,
  startReplay,
  stopReplay,
  totalEvents,
  visibleEvents,
  timeRange,
}: WhaleReplayPanelProps) {
  if (!isReplaying) {
    return (
      <button
        onClick={startReplay}
        disabled={totalEvents < 2}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 glass-surface rounded-full px-4 py-2 flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed"
        title={totalEvents < 2 ? 'Need more whale events to replay' : 'Replay whale history'}
      >
        <History className="w-3.5 h-3.5" />
        <span>Replay ({totalEvents} events)</span>
      </button>
    );
  }

  const speeds = [1, 2, 5, 10];

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 glass-surface rounded-xl px-5 py-3 pointer-events-auto w-[460px] max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono tracking-wider uppercase text-cyan-400">
            Whale Replay
          </span>
        </div>
        <button
          onClick={stopReplay}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline scrubber */}
      <div className="relative mb-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={replayCursor}
          onChange={(e) => setReplayCursor(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(190, 100%, 50%) 0%, hsl(190, 100%, 50%) ${replayCursor * 100}%, rgba(255,255,255,0.1) ${replayCursor * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-2">
        <span>{formatTime(timeRange.start)}</span>
        <span className="text-foreground">{formatTime(cursorTime)}</span>
        <span>{formatTime(timeRange.end)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            {playActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset */}
          <button
            onClick={() => setReplayCursor(0)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="flex gap-1 ml-2">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  speed === s
                    ? 'bg-cyan-500/30 text-cyan-300'
                    : 'bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Event counter */}
        <span className="text-[10px] font-mono text-muted-foreground">
          {visibleEvents}/{totalEvents} events
        </span>
      </div>
    </div>
  );
}
