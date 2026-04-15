import { useEffect, useRef, useState, useCallback } from 'react';
import { WhaleEvent } from '@/lib/types';
import { playWhaleSound, playShockwave, playMomentumShift, setAudioEnabled } from '@/lib/spatialAudio';

interface UseSpatialAudioProps {
  whaleEvents: WhaleEvent[];
  momentum: number;
}

export function useSpatialAudio({ whaleEvents, momentum }: UseSpatialAudioProps) {
  const [enabled, setEnabled] = useState(false);
  const processedIds = useRef(new Set<string>());
  const prevMomentum = useRef(momentum);

  // Play sounds for new whale events
  useEffect(() => {
    if (!enabled) return;

    for (const event of whaleEvents) {
      if (processedIds.current.has(event.id)) continue;
      processedIds.current.add(event.id);

      playWhaleSound(event.score, event.trade.side);

      if (event.score > 70) {
        playShockwave(event.score);
      }
    }

    // Keep set size manageable
    if (processedIds.current.size > 200) {
      const arr = Array.from(processedIds.current);
      processedIds.current = new Set(arr.slice(-100));
    }
  }, [whaleEvents, enabled]);

  // Momentum shift sounds
  useEffect(() => {
    if (!enabled) return;
    if (Math.abs(momentum - prevMomentum.current) > 0.15) {
      playMomentumShift(momentum);
    }
    prevMomentum.current = momentum;
  }, [momentum, enabled]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      setAudioEnabled(next);
      return next;
    });
  }, []);

  return { audioEnabled: enabled, toggleAudio: toggle };
}
