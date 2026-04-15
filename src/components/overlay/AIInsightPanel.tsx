import { useState, useEffect, useRef, useCallback } from 'react';
import { WhaleEvent } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface AIInsightPanelProps {
  whaleEvents: WhaleEvent[];
  momentum: number;
  volatility: number;
  symbol?: string;
}

// Fallback templates when LLM is unavailable
const FALLBACK_INSIGHTS = [
  'Whale accumulation detected during bullish momentum — high probability continuation.',
  'Aggressive short positioning from whales — bearish pressure building.',
  'Market activity within normal parameters — monitoring whale signals.',
  'Multiple high-conviction whale entries detected — strong directional bias.',
];

export function AIInsightPanel({ whaleEvents, momentum, volatility, symbol = 'SOL' }: AIInsightPanelProps) {
  const [insight, setInsight] = useState('Initializing whale detection engine...');
  const [opacity, setOpacity] = useState(0);
  const [isLLM, setIsLLM] = useState(false);
  const lastCallRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const backoffRef = useRef(45000); // starts at 45s, grows on 429

  const fetchLLMInsight = useCallback(async () => {
    if (Date.now() - lastCallRef.current < backoffRef.current) return null;
    lastCallRef.current = Date.now();

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const recent = whaleEvents.slice(-15).map(e => ({
        trade: { side: e.trade.side, sizeUsd: e.trade.sizeUsd, isLiquidation: e.trade.isLiquidation },
        score: e.score,
        label: e.label,
      }));

      const { data, error } = await supabase.functions.invoke('whale-insights', {
        body: { whaleEvents: recent, momentum, volatility, symbol },
      });

      if (error) {
        // Check for rate limit
        const errMsg = typeof error === 'object' && error.message ? error.message : String(error);
        if (errMsg.includes('429') || errMsg.includes('Rate limit')) {
          backoffRef.current = Math.min(backoffRef.current * 2, 300000); // max 5min
          return null;
        }
        throw error;
      }
      if (data?.insight) {
        setIsLLM(true);
        backoffRef.current = 45000; // reset on success
        return data.insight;
      }
      return null;
    } catch (err) {
      console.warn('LLM insight failed, using fallback:', err);
      return null;
    }
  }, [whaleEvents, momentum, volatility, symbol]);

  const getFallbackInsight = useCallback(() => {
    return FALLBACK_INSIGHTS[Math.floor(Math.random() * FALLBACK_INSIGHTS.length)];
  }, []);

  useEffect(() => {
    // Initial insight with LLM after delay
    const initTimeout = setTimeout(async () => {
      const llm = await fetchLLMInsight();
      setInsight(llm || getFallbackInsight());
      setOpacity(1);
    }, 3000);

    // Periodic updates every 30s
    const interval = setInterval(async () => {
      setOpacity(0);
      setTimeout(async () => {
        const llm = await fetchLLMInsight();
        setInsight(llm || getFallbackInsight());
        setOpacity(1);
      }, 800);
    }, 60000);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchLLMInsight, getFallbackInsight]);

  return (
    <div data-tour="ai-panel" className="fixed right-6 bottom-24 z-10 max-w-xs pointer-events-none">
      <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-2 text-glow-amber">
        AI Intelligence
      </div>
      <div
        className="glass-surface rounded-lg px-4 py-3 transition-opacity duration-700"
        style={{
          opacity,
          borderLeft: '2px solid hsl(45, 100%, 55%)',
          boxShadow: '0 0 20px hsl(45, 100%, 55%, 0.1)',
        }}
      >
        <p className="text-sm text-foreground leading-relaxed font-light">
          {insight}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1 h-1 rounded-full bg-accent whale-pulse" />
          <span className="text-[9px] font-mono text-muted-foreground">
            {isLLM ? 'LLM Analysis' : 'Live Analysis'}
          </span>
        </div>
      </div>
    </div>
  );
}
