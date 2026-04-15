import { useState, useEffect, useRef } from 'react';

const PACIFICA_API = 'https://api.pacifica.fi/api/v1';

export interface FundingPoint {
  rate: number;
  timestamp: number;
}

export function useFundingHistory(symbol: string, limit = 48) {
  const [history, setHistory] = useState<FundingPoint[]>([]);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchFunding() {
      try {
        const res = await fetch(
          `${PACIFICA_API}/funding_rate/history?symbol=${symbol}&limit=${limit}`,
          { signal: controller.signal, headers: { Accept: '*/*' } }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const points: FundingPoint[] = json.data
            .map((d: any) => ({
              rate: parseFloat(d.funding_rate),
              timestamp: d.created_at,
            }))
            .reverse(); // oldest first
          setHistory(points);
        }
      } catch {
        // silently fail
      }
    }

    fetchFunding();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFunding, 5 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [symbol, limit]);

  return history;
}
