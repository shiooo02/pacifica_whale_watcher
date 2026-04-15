import { WhaleEvent } from '@/lib/types';
import { useMemo } from 'react';

interface WhaleTimelineProps {
  whaleEvents: WhaleEvent[];
}

export function WhaleTimeline({ whaleEvents }: WhaleTimelineProps) {
  const segments = useMemo(() => {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 min window
    const bucketCount = 60;
    const bucketMs = windowMs / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const start = now - windowMs + i * bucketMs;
      const end = start + bucketMs;
      const events = whaleEvents.filter(e => e.timestamp >= start && e.timestamp < end);
      const intensity = events.reduce((sum, e) => sum + e.score, 0) / 100;
      const avgSide = events.length > 0
        ? events.filter(e => e.trade.side === 'long').length / events.length
        : 0.5;
      return { intensity: Math.min(1, intensity), avgSide, events };
    });

    return buckets;
  }, [whaleEvents]);

  return (
    <div data-tour="whale-timeline" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-2 text-center text-glow-cyan">
        Temporal Intensity
      </div>
      <div className="flex items-end gap-[2px] h-10">
        {segments.map((seg, i) => {
          const height = 4 + seg.intensity * 32;
          const hue = seg.avgSide > 0.6 ? 190 : seg.avgSide < 0.4 ? 320 : 45;
          const brightness = 40 + seg.intensity * 60;

          return (
            <div
              key={i}
              className="rounded-full transition-all duration-700"
              style={{
                width: 3 + seg.intensity * 3,
                height,
                backgroundColor: `hsl(${hue}, 100%, ${brightness}%)`,
                opacity: 0.3 + seg.intensity * 0.7,
                boxShadow: seg.intensity > 0.5
                  ? `0 0 ${seg.intensity * 12}px hsl(${hue}, 100%, 50%, 0.5)`
                  : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
