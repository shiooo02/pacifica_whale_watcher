import { PriceData } from '@/lib/types';
import { FundingSparkline } from './FundingSparkline';
import { FundingPoint } from '@/hooks/useFundingHistory';
import { ConnectionInfo } from '@/hooks/useTradeStream';
import { useState } from 'react';

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatUptime(ms: number | null): string {
  if (ms === null) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

interface MarketStatsProps {
  price: PriceData;
  volatility: number;
  momentum: number;
  whaleCount: number;
  connected: boolean;
  simulated: boolean;
  connectionInfo: ConnectionInfo;
  fundingHistory: FundingPoint[];
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export function MarketStats({
  price, volatility, momentum, whaleCount, connected, simulated, connectionInfo, fundingHistory,
  audioEnabled, onToggleAudio,
}: MarketStatsProps) {
  const isPositive = price.change24h >= 0;
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColor = connected
    ? simulated ? 'hsl(45, 100%, 55%)' : 'hsl(160, 100%, 45%)'
    : 'hsl(0, 90%, 55%)';
  const statusLabel = connected ? (simulated ? 'Sim' : 'Live') : 'Off';

  return (
    <div data-tour="market-stats" className="fixed top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-[95vw] max-w-[1200px]">
      {/* Row 1: Logo + Price + Connection */}
      <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <h1 className="text-sm md:text-lg font-bold tracking-[0.15em] uppercase text-foreground text-flicker">
            Pacifica
          </h1>
          <span className="text-[8px] md:text-[10px] font-mono tracking-[0.3em] text-muted-foreground">
            WHALE WATCHER
          </span>
        </div>

        {/* Price */}
        <div className="glass-surface rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-center">
          <div className="text-lg md:text-2xl font-mono font-bold text-flicker" style={{
            color: isPositive ? 'hsl(190, 100%, 50%)' : 'hsl(320, 100%, 60%)',
          }}>
            ${price.price.toFixed(2)}
          </div>
          <div className="text-[9px] md:text-[10px] font-mono" style={{
            color: isPositive ? 'hsl(160, 100%, 45%)' : 'hsl(0, 90%, 55%)',
          }}>
            {isPositive ? '+' : ''}{price.change24h.toFixed(2)}%
          </div>
        </div>

        {/* Connection + Audio */}
        <div className="flex items-center gap-3">
          <div
            className="relative flex items-center gap-1.5 pointer-events-auto cursor-default"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 6px ${statusColor.replace(')', ', 0.8)')}`,
              }}
            />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">
              {statusLabel}
            </span>
            {simulated && connected && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{
                backgroundColor: 'hsla(45, 100%, 55%, 0.15)',
                color: 'hsl(45, 100%, 55%)',
              }}>
                Fallback
              </span>
            )}

            {/* Connection Info Tooltip */}
            {showTooltip && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 glass-surface rounded-lg px-3 py-2.5 min-w-[200px] z-50"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-1.5 uppercase">
                  Connection Details
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Status</span>
                    <span style={{ color: statusColor }}>
                      {connected ? (simulated ? 'Simulated (Fallback)' : 'Live (Pacifica WS)') : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="text-foreground">
                      {connectionInfo.latency !== null ? `${connectionInfo.latency}ms` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="text-foreground">{formatUptime(connectionInfo.uptime)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Reconnects</span>
                    <span className="text-foreground">{connectionInfo.reconnectAttempts}</span>
                  </div>
                  {connectionInfo.lastError && (
                    <div className="text-[9px] font-mono mt-1 pt-1 border-t border-white/10" style={{ color: 'hsl(0, 90%, 55%)' }}>
                      {connectionInfo.lastError}
                    </div>
                  )}
                </div>
                {/* Arrow */}
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 glass-surface"
                />
              </div>
            )}
          </div>
          <button
            onClick={onToggleAudio}
            className="pointer-events-auto glass-surface rounded-md px-2 py-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            title={audioEnabled ? 'Mute spatial audio' : 'Enable spatial audio'}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Row 2: Metrics */}
      <div className="flex justify-center gap-2 md:gap-3 mt-2 flex-wrap">
        <MetricPill label="VOL" value={`${(volatility * 100).toFixed(0)}%`} />
        <MetricPill
          label="MOM"
          value={momentum > 0 ? `+${momentum.toFixed(2)}` : momentum.toFixed(2)}
          color={momentum > 0.2 ? 'hsl(190, 100%, 50%)' : momentum < -0.2 ? 'hsl(320, 100%, 60%)' : undefined}
        />
        <MetricPill label="WHALES" value={String(whaleCount)} color="hsl(45, 100%, 55%)" />
        <div className="glass-surface rounded-md px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1.5">
          <div className="text-center">
            <div className="text-[8px] md:text-[9px] font-mono tracking-widest text-muted-foreground">FUNDING</div>
            <div className="text-xs md:text-sm font-mono font-semibold" style={{
              color: price.fundingRate > 0 ? 'hsl(160, 100%, 45%)' : price.fundingRate < 0 ? 'hsl(0, 90%, 55%)' : 'hsl(210, 40%, 92%)',
            }}>
              {`${(price.fundingRate * 100).toFixed(4)}%`}
            </div>
          </div>
          <FundingSparkline data={fundingHistory} width={60} height={20} />
        </div>
        <MetricPill label="OI" value={formatCompact(price.openInterest)} color="hsl(270, 80%, 65%)" />
        <MetricPill label="24H VOL" value={formatCompact(price.volume24h)} color="hsl(200, 80%, 60%)" />
      </div>
    </div>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass-surface rounded-md px-2 md:px-3 py-1 md:py-1.5 text-center">
      <div className="text-[8px] md:text-[9px] font-mono tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xs md:text-sm font-mono font-semibold" style={{ color: color || 'hsl(210, 40%, 92%)' }}>
        {value}
      </div>
    </div>
  );
}
