export interface Trade {
  id: string;
  price: number;
  size: number;
  sizeUsd: number;
  side: 'long' | 'short';
  timestamp: number;
  isLiquidation: boolean;
}

export interface WhaleEvent {
  id: string;
  trade: Trade;
  score: number;
  label: string;
  timestamp: number;
  symbol: string;
}

export interface PriceData {
  price: number;
  timestamp: number;
  change24h: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
}

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface OrderbookLevel {
  price: number;
  amount: number;
  orders: number;
}

export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
  symbol: string;
}

export interface MarketState {
  price: PriceData | null;
  trades: Trade[];
  whaleEvents: WhaleEvent[];
  candles: CandleData[];
  volatility: number;
  momentum: number; // -1 to 1
  openInterest: number;
  orderbook: OrderbookData | null;
}
