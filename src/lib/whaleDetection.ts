import { Trade, WhaleEvent } from './types';
import { RingBuffer } from './ringBuffer';

const LABELS = {
  aggressiveLong: 'Aggressive Whale Long',
  aggressiveShort: 'Aggressive Whale Short',
  stealthAccum: 'Stealth Accumulation',
  shortSqueeze: 'Short Squeeze Setup',
  distribution: 'Whale Distribution',
  liquidationCascade: 'Liquidation Cascade',
} as const;

export function computeWhaleScore(
  trade: Trade,
  recentTrades: RingBuffer<Trade>,
  recentWhaleEvents: WhaleEvent[],
  candleDirection: number // 1 = bullish, -1 = bearish, 0 = neutral
): { score: number; label: string } {
  const avgSize = recentTrades.average(t => t.sizeUsd) || trade.sizeUsd;
  const sizeRatio = trade.sizeUsd / avgSize;

  // 1. Size score (30%)
  const sizeScore = Math.min(100, (sizeRatio - 1) * 25);

  // 2. Clustering (20%) — large trades in last 60s
  const now = Date.now();
  const recentLarge = recentTrades.toArray().filter(
    t => now - t.timestamp < 60000 && t.sizeUsd > avgSize * 1.5
  );
  const clusterScore = Math.min(100, recentLarge.length * 15);

  // 3. Direction consistency (15%)
  const last10 = recentTrades.last(10);
  const sameDir = last10.filter(t => t.side === trade.side).length;
  const dirScore = (sameDir / Math.max(1, last10.length)) * 100;

  // 4. Liquidation (20%)
  const liqScore = trade.isLiquidation ? 100 : 0;

  // 5. Trend alignment (15%)
  const aligned = (trade.side === 'long' && candleDirection > 0) ||
    (trade.side === 'short' && candleDirection < 0);
  const trendScore = aligned ? 80 : (candleDirection === 0 ? 50 : 20);

  const score = Math.round(
    sizeScore * 0.30 +
    clusterScore * 0.20 +
    dirScore * 0.15 +
    liqScore * 0.20 +
    trendScore * 0.15
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine label
  let label: string = trade.side === 'long' ? LABELS.aggressiveLong : LABELS.aggressiveShort;

  if (trade.isLiquidation) {
    label = LABELS.liquidationCascade;
  } else if (sizeRatio < 3 && clusterScore > 40) {
    label = trade.side === 'long' ? LABELS.stealthAccum : LABELS.distribution;
  } else if (trade.side === 'long' && recentLarge.filter(t => t.side === 'short').length > 3) {
    label = LABELS.shortSqueeze;
  }

  return { score: clampedScore, label };
}
