import { useState, useEffect, useRef } from 'react';
import { PriceData } from '@/lib/types';

const PACIFICA_WS = 'wss://ws.pacifica.fi/ws';

const BASE_PRICES: Record<string, number> = {
  SOL: 82, BTC: 71000, ETH: 2500, SUI: 3.5, WIF: 0.5, JUP: 0.6, BONK: 0.000015, RENDER: 5.5,
};

// Single shared WS connection for prices (global stream)
let sharedWs: WebSocket | null = null;
let sharedPingInterval: ReturnType<typeof setInterval> | undefined;
let listeners = new Set<(data: any[]) => void>();
let wsConnected = false;
let connectionAttempted = false;

function ensurePricesConnection() {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    const ws = new WebSocket(PACIFICA_WS);
    sharedWs = ws;

    ws.onopen = () => {
      wsConnected = true;
      ws.send(JSON.stringify({ method: 'subscribe', params: { source: 'prices' } }));
      sharedPingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ method: 'ping' }));
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === 'prices' && Array.isArray(msg.data)) {
          listeners.forEach(fn => fn(msg.data));
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      wsConnected = false;
      connectionAttempted = false;
      clearInterval(sharedPingInterval);
      sharedWs = null;
    };
    ws.onerror = () => ws.close();
  } catch {
    connectionAttempted = false;
  }
}

export function usePriceStream(symbol: string) {
  const [price, setPrice] = useState<PriceData>({ price: 0, timestamp: Date.now(), change24h: 0, fundingRate: 0, openInterest: 0, volume24h: 0 });
  const symbolRef = useRef(symbol);
  const priceRef = useRef(BASE_PRICES[symbol] || 100);
  const simRef = useRef<ReturnType<typeof setInterval>>();
  const hasRealData = useRef(false);

  // Update ref when symbol changes, reset price immediately
  useEffect(() => {
    symbolRef.current = symbol;
    hasRealData.current = false;
    priceRef.current = BASE_PRICES[symbol] || 100;
    setPrice({ price: priceRef.current, timestamp: Date.now(), change24h: 0, fundingRate: 0, openInterest: 0, volume24h: 0 });
  }, [symbol]);

  useEffect(() => {
    // Listener for real WS data
    const onPrices = (data: any[]) => {
      const sym = symbolRef.current;
      const d = data.find((x: any) => x.symbol === sym);
      if (d) {
        hasRealData.current = true;
        const mark = parseFloat(d.mark);
        const yesterday = parseFloat(d.yesterday_price);
        setPrice({
          price: mark,
          timestamp: d.timestamp || Date.now(),
          change24h: yesterday > 0 ? ((mark - yesterday) / yesterday) * 100 : 0,
          fundingRate: parseFloat(d.funding || '0'),
          openInterest: parseFloat(d.open_interest || '0'),
          volume24h: parseFloat(d.volume_24h || '0'),
        });
      }
    };

    listeners.add(onPrices);
    ensurePricesConnection();

    // Fallback simulation if no WS data after 3s
    const timeout = setTimeout(() => {
      if (!hasRealData.current) {
        simRef.current = setInterval(() => {
          if (hasRealData.current) {
            clearInterval(simRef.current);
            return;
          }
          const sym = symbolRef.current;
          const base = BASE_PRICES[sym] || 100;
          const drift = (Math.random() - 0.495) * priceRef.current * 0.003;
          priceRef.current += drift;
          setPrice({
            price: priceRef.current,
            timestamp: Date.now(),
            change24h: ((priceRef.current - base) / base) * 100,
            fundingRate: 0.0000125,
            openInterest: 0,
            volume24h: 0,
          });
        }, 500);
      }
    }, 3000);

    return () => {
      listeners.delete(onPrices);
      clearTimeout(timeout);
      clearInterval(simRef.current);
    };
  }, []); // Only mount once - symbol changes handled via ref

  return price;
}
