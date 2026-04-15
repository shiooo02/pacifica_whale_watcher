import { useState, useEffect, useRef, useCallback } from 'react';
import { Trade, WhaleEvent } from '@/lib/types';
import { RingBuffer } from '@/lib/ringBuffer';
import { computeWhaleScore } from '@/lib/whaleDetection';

const WHALE_THRESHOLD = 40;
const PACIFICA_WS = 'wss://ws.pacifica.fi/ws';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 2000;

function parseSide(d: string): 'long' | 'short' {
  return d === 'open_long' || d === 'close_short' ? 'long' : 'short';
}

function isLiquidation(tc: string): boolean {
  return tc === 'market_liquidation' || tc === 'backstop_liquidation';
}

let liveBasePrices: Record<string, number> = {};

export function setLivePrice(symbol: string, price: number) {
  liveBasePrices[symbol] = price;
}

const FALLBACK_PRICES: Record<string, number> = {
  SOL: 82, BTC: 71000, ETH: 2500, SUI: 3.5, WIF: 0.5, JUP: 0.6, BONK: 0.000015, RENDER: 5.5,
};

function generateSimulatedTrade(symbol: string): Trade {
  const isWhale = Math.random() < 0.12;
  const isLiq = Math.random() < 0.04;
  const side = Math.random() > 0.48 ? 'long' : 'short';
  const base = liveBasePrices[symbol] || FALLBACK_PRICES[symbol] || 100;
  const price = base + (Math.random() - 0.5) * base * 0.002;
  const baseSize = isWhale ? 50000 + Math.random() * 450000 : 500 + Math.random() * 15000;

  return {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    price,
    size: baseSize / price,
    sizeUsd: baseSize,
    side,
    timestamp: Date.now(),
    isLiquidation: isLiq,
  };
}

export interface ConnectionInfo {
  latency: number | null;
  uptime: number | null;
  reconnectAttempts: number;
  lastError: string | null;
}

export function useTradeStream(symbol: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    latency: null, uptime: null, reconnectAttempts: 0, lastError: null,
  });

  const bufferRef = useRef(new RingBuffer<Trade>(500));
  const whaleEventsRef = useRef<WhaleEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval>>();
  const symbolRef = useRef(symbol);
  const connectedAtRef = useRef<number | null>(null);
  const uptimeIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectAttemptsRef = useRef(0);
  const simIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const cleanedUpRef = useRef(false);
  const lastPingSentRef = useRef<number | null>(null);

  const processTrade = useCallback((trade: Trade) => {
    bufferRef.current.push(trade);
    const { score, label } = computeWhaleScore(trade, bufferRef.current, whaleEventsRef.current, 0);

    if (score >= WHALE_THRESHOLD) {
      const event: WhaleEvent = { id: `w-${trade.id}`, trade, score, label, timestamp: trade.timestamp, symbol: symbolRef.current };
      whaleEventsRef.current = [...whaleEventsRef.current.slice(-99), event];
      setWhaleEvents(prev => [...prev.slice(-99), event]);
    }
    setTrades(bufferRef.current.last(100));
  }, []);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = undefined;
    }
  }, []);

  const startSimulation = useCallback((sym: string) => {
    stopSimulation();
    setConnected(true);
    setSimulated(true);
    simIntervalRef.current = setInterval(() => processTrade(generateSimulatedTrade(sym)), 400 + Math.random() * 1200);
  }, [processTrade, stopSimulation]);

  useEffect(() => {
    symbolRef.current = symbol;
    bufferRef.current = new RingBuffer<Trade>(500);
    whaleEventsRef.current = [];
    cleanedUpRef.current = false;
    reconnectAttemptsRef.current = 0;
    connectedAtRef.current = null;
    setTrades([]);
    setWhaleEvents([]);
    setSimulated(false);
    setConnected(false);
    setConnectionInfo({ latency: null, uptime: null, reconnectAttempts: 0, lastError: null });

    function connectWs() {
      if (cleanedUpRef.current) return;

      stopSimulation();

      try {
        const ws = new WebSocket(PACIFICA_WS);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cleanedUpRef.current) { ws.close(); return; }
          console.log(`[Pacifica WS] Connected for ${symbol}`);
          reconnectAttemptsRef.current = 0;
          connectedAtRef.current = Date.now();
          stopSimulation();
          setConnected(true);
          setSimulated(false);
          setConnectionInfo(prev => ({ ...prev, reconnectAttempts: 0, lastError: null, uptime: 0 }));

          ws.send(JSON.stringify({ method: 'subscribe', params: { source: 'trades', symbol } }));

          pingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              lastPingSentRef.current = Date.now();
              ws.send(JSON.stringify({ method: 'ping' }));
            }
          }, 30000);

          uptimeIntervalRef.current = setInterval(() => {
            if (connectedAtRef.current) {
              setConnectionInfo(prev => ({ ...prev, uptime: Date.now() - connectedAtRef.current! }));
            }
          }, 1000);
        };

        ws.onclose = (ev) => {
          if (cleanedUpRef.current) return;
          console.log(`[Pacifica WS] Closed: code=${ev.code} reason=${ev.reason}`);
          connectedAtRef.current = null;
          clearInterval(pingRef.current);
          clearInterval(uptimeIntervalRef.current);
          setConnected(false);
          setConnectionInfo(prev => ({ ...prev, uptime: null, lastError: `Closed (code ${ev.code})` }));

          // Try reconnecting up to MAX attempts
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = RECONNECT_BASE_DELAY * Math.pow(1.5, reconnectAttemptsRef.current - 1);
            console.log(`[Pacifica WS] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            setConnectionInfo(prev => ({ ...prev, reconnectAttempts: reconnectAttemptsRef.current }));
            reconnectTimeoutRef.current = setTimeout(connectWs, delay);
          } else {
            console.log(`[Pacifica WS] Max reconnect attempts reached, falling back to simulation`);
            setConnectionInfo(prev => ({ ...prev, lastError: 'Max reconnect attempts — using simulation' }));
            startSimulation(symbolRef.current);
          }
        };

        ws.onerror = () => {
          console.log(`[Pacifica WS] Error for ${symbol}`);
          ws.close();
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            // Measure latency from pong
            if (msg.method === 'pong' && lastPingSentRef.current) {
              const latency = Date.now() - lastPingSentRef.current;
              setConnectionInfo(prev => ({ ...prev, latency }));
              lastPingSentRef.current = null;
              return;
            }

            if (msg.channel === 'trades' && Array.isArray(msg.data)) {
              const currentSym = symbolRef.current;
              msg.data.forEach((d: any) => {
                const tradeSymbol = d.s || d.symbol || msg.symbol;
                if (tradeSymbol && tradeSymbol.toUpperCase() !== currentSym.toUpperCase() &&
                    !tradeSymbol.toUpperCase().startsWith(currentSym.toUpperCase())) {
                  return;
                }

                const price = parseFloat(d.p);
                const amount = parseFloat(d.a);

                const expectedBase = liveBasePrices[currentSym] || FALLBACK_PRICES[currentSym] || 100;
                if (expectedBase > 0 && (price < expectedBase * 0.5 || price > expectedBase * 2)) {
                  return;
                }

                processTrade({
                  id: `t-${d.h || Date.now()}`,
                  price, size: amount, sizeUsd: amount * price,
                  side: parseSide(d.d),
                  timestamp: d.t || Date.now(),
                  isLiquidation: isLiquidation(d.tc || 'normal'),
                });
              });
            }
          } catch { /* ignore */ }
        };
      } catch {
        startSimulation(symbol);
      }

      // Fallback: if not connected after 4s on first attempt, start simulation alongside
      if (reconnectAttemptsRef.current === 0) {
        setTimeout(() => {
          if (!cleanedUpRef.current && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
            console.log(`[Pacifica WS] Initial connection timeout, starting simulation`);
            startSimulation(symbolRef.current);
          }
        }, 4000);
      }
    }

    connectWs();

    return () => {
      cleanedUpRef.current = true;
      stopSimulation();
      clearInterval(pingRef.current);
      clearInterval(uptimeIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [symbol, processTrade, startSimulation, stopSimulation]);

  return { trades, whaleEvents, connected, simulated, connectionInfo };
}
