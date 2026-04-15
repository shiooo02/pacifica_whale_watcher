import { useState, useEffect, useRef } from 'react';
import { CandleData } from '@/lib/types';

const PACIFICA_WS = 'wss://ws.pacifica.fi/ws';

export function useCandleStream(symbol: string) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [volatility, setVolatility] = useState(0.5);
  const [momentum, setMomentum] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const currentCandle = useRef<CandleData | null>(null);

  useEffect(() => {
    setCandles([]);
    // Don't hard-reset volatility/momentum — let them lerp naturally via new candle data

    let simInterval: ReturnType<typeof setInterval>;

    try {
      const ws = new WebSocket(PACIFICA_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ method: 'subscribe', params: { source: 'candle', symbol, interval: '1m' } }));
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ method: 'ping' }));
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.channel === 'candle' && msg.data) {
            const d = msg.data;
            const candle: CandleData = {
              open: parseFloat(d.o), close: parseFloat(d.c),
              high: parseFloat(d.h), low: parseFloat(d.l),
              volume: parseFloat(d.v), timestamp: d.t,
            };
            setCandles(prev => {
              const updated = prev.length > 0 && prev[prev.length - 1].timestamp === candle.timestamp
                ? [...prev.slice(0, -1), candle] : [...prev.slice(-59), candle];
              computeMetrics(updated);
              return updated;
            });
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => startSimulation();
      ws.onerror = () => ws.close();
    } catch { startSimulation(); }

    function computeMetrics(data: CandleData[]) {
      if (data.length < 3) return;
      const recent = data.slice(-10);
      const ranges = recent.map(c => (c.high - c.low) / c.open);
      setVolatility(Math.min(1, (ranges.reduce((a, b) => a + b, 0) / ranges.length) * 50));
      const dir = recent[recent.length - 1].close - recent[0].open;
      setMomentum(Math.max(-1, Math.min(1, dir / 5)));
    }

    function startSimulation() {
      const basePrices: Record<string, number> = {
        SOL: 148, BTC: 105000, ETH: 3800, SUI: 3.5, WIF: 1.2, JUP: 0.9, BONK: 0.00002, RENDER: 8.5,
      };
      const base = basePrices[symbol] || 100;

      simInterval = setInterval(() => {
        const now = Date.now();
        const basePrice = base + Math.sin(now / 30000) * base * 0.05;
        if (!currentCandle.current || now - currentCandle.current.timestamp > 60000) {
          if (currentCandle.current) setCandles(prev => { const u = [...prev.slice(-59), currentCandle.current!]; computeMetrics(u); return u; });
          currentCandle.current = { open: basePrice, high: basePrice, low: basePrice, close: basePrice, volume: Math.random() * 500000, timestamp: now };
        } else {
          const noise = (Math.random() - 0.5) * base * 0.01;
          const newPrice = basePrice + noise;
          currentCandle.current = { ...currentCandle.current, high: Math.max(currentCandle.current.high, newPrice), low: Math.min(currentCandle.current.low, newPrice), close: newPrice, volume: currentCandle.current.volume + Math.random() * 5000 };
        }
      }, 2000);
    }

    const timeout = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) startSimulation();
    }, 3000);

    return () => { clearTimeout(timeout); clearInterval(simInterval); clearInterval(pingRef.current); wsRef.current?.close(); };
  }, [symbol]);

  return { candles, volatility, momentum };
}
