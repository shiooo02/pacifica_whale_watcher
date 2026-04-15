import { useState, useEffect, useRef, useCallback } from 'react';
import { OrderbookData, OrderbookLevel } from '@/lib/types';

const PACIFICA_WS = 'wss://ws.pacifica.fi/ws';

function parseOrderbookLevels(levels: Array<{ p: string; a: string; n: number }>): OrderbookLevel[] {
  return levels.map(l => ({ price: parseFloat(l.p), amount: parseFloat(l.a), orders: l.n }));
}

function generateSimulatedOrderbook(midPrice: number): OrderbookData {
  const bids: OrderbookLevel[] = [];
  const asks: OrderbookLevel[] = [];
  for (let i = 0; i < 10; i++) {
    const spread = (i + 1) * midPrice * 0.0003;
    bids.push({ price: midPrice - spread, amount: 10 + Math.random() * 200, orders: 1 + Math.floor(Math.random() * 5) });
    asks.push({ price: midPrice + spread, amount: 10 + Math.random() * 200, orders: 1 + Math.floor(Math.random() * 5) });
  }
  return { bids, asks, timestamp: Date.now(), symbol: '' };
}

export function useOrderbookStream(symbol: string) {
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval>>();
  const pingRef = useRef<ReturnType<typeof setInterval>>();

  const basePrices: Record<string, number> = {
    SOL: 148, BTC: 105000, ETH: 3800, SUI: 3.5, WIF: 1.2, JUP: 0.9, BONK: 0.00002, RENDER: 8.5,
  };
  const midPriceRef = useRef(basePrices[symbol] || 100);

  const startSimulation = useCallback(() => {
    midPriceRef.current = basePrices[symbol] || 100;
    simRef.current = setInterval(() => {
      midPriceRef.current += (Math.random() - 0.5) * midPriceRef.current * 0.002;
      setOrderbook(generateSimulatedOrderbook(midPriceRef.current));
    }, 250);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  useEffect(() => {
    setOrderbook(null);
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    try {
      const ws = new WebSocket(PACIFICA_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ method: 'subscribe', params: { source: 'book', symbol, agg_level: 1 } }));
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ method: 'ping' }));
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.channel === 'book' && msg.data?.l) {
            const [rawBids, rawAsks] = msg.data.l;
            setOrderbook({
              bids: parseOrderbookLevels(rawBids || []),
              asks: parseOrderbookLevels(rawAsks || []),
              timestamp: msg.data.t || Date.now(),
              symbol: msg.data.s || symbol,
            });
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => startSimulation();
      ws.onerror = () => ws.close();
    } catch { startSimulation(); }

    fallbackTimeout = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) startSimulation();
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
      clearInterval(simRef.current);
      clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, [symbol, startSimulation]);

  return orderbook;
}
