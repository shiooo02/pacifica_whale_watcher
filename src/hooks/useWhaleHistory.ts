import { useState, useCallback, useRef, useEffect } from 'react';
import { WhaleEvent } from '@/lib/types';


export function useWhaleHistory(liveEvents: WhaleEvent[]) {
  const allEventsRef = useRef<WhaleEvent[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayCursor, setReplayCursor] = useState(0); // 0-1 normalized position
  const [speed, setSpeed] = useState(1);
  const [playActive, setPlayActive] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval>>();

  // Accumulate all events ever seen
  useEffect(() => {
    if (liveEvents.length > 0) {
      const existing = new Set(allEventsRef.current.map(e => e.id));
      const newEvents = liveEvents.filter(e => !existing.has(e.id));
      if (newEvents.length > 0) {
        allEventsRef.current = [...allEventsRef.current, ...newEvents].slice(-500);
      }
    }
  }, [liveEvents]);

  const allEvents = allEventsRef.current;

  const timeRange = allEvents.length > 1
    ? { start: allEvents[0].timestamp, end: allEvents[allEvents.length - 1].timestamp }
    : { start: Date.now() - 300000, end: Date.now() };

  const cursorTime = timeRange.start + replayCursor * (timeRange.end - timeRange.start);

  // Events visible at current replay cursor (everything up to cursor time)
  const replayEvents = isReplaying
    ? allEvents.filter(e => e.timestamp <= cursorTime)
    : liveEvents;

  const startReplay = useCallback(() => {
    setIsReplaying(true);
    setReplayCursor(0);
    setPlayActive(true);
  }, []);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    setPlayActive(false);
    clearInterval(animRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    setPlayActive(p => !p);
  }, []);

  // Auto-advance cursor during playback
  useEffect(() => {
    clearInterval(animRef.current);
    if (isReplaying && playActive) {
      animRef.current = setInterval(() => {
        setReplayCursor(prev => {
          const next = prev + (0.002 * speed);
          if (next >= 1) {
            setPlayActive(false);
            return 1;
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(animRef.current);
  }, [isReplaying, playActive, speed]);

  return {
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
    replayEvents,
    allEvents,
    totalEvents: allEvents.length,
    timeRange,
  };
}
