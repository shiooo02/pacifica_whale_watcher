import { useMemo, useRef, useEffect } from 'react';
import { WhaleScene } from '@/components/scene/WhaleScene';
import { setLivePrice } from '@/hooks/useTradeStream';
import { WhalePulseFeed } from '@/components/overlay/WhalePulseFeed';
import { WhaleTimeline } from '@/components/overlay/WhaleTimeline';
import { MarketStats } from '@/components/overlay/MarketStats';
import { AIInsightPanel } from '@/components/overlay/AIInsightPanel';
import { SymbolSelector } from '@/components/overlay/SymbolSelector';
import { WhaleOrbTooltip } from '@/components/overlay/WhaleOrbTooltip';
import { SceneLegend } from '@/components/overlay/SceneLegend';
import { OnboardingTutorial } from '@/components/overlay/OnboardingTutorial';
import { WhaleReplayPanel } from '@/components/overlay/WhaleReplayPanel';
import { useTradeStream } from '@/hooks/useTradeStream';
import { usePriceStream } from '@/hooks/usePriceStream';
import { useCandleStream } from '@/hooks/useCandleStream';
import { useOrderbookStream } from '@/hooks/useOrderbookStream';
import { useFundingHistory } from '@/hooks/useFundingHistory';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';
import { useWhaleHistory } from '@/hooks/useWhaleHistory';
import { useSymbol } from '@/contexts/SymbolContext';

const Index = () => {
  const { symbol } = useSymbol();
  const { trades, whaleEvents, connected, simulated, connectionInfo } = useTradeStream(symbol);
  const price = usePriceStream(symbol);
  const { volatility, momentum } = useCandleStream(symbol);
  const orderbook = useOrderbookStream(symbol);
  const fundingHistory = useFundingHistory(symbol);
  const { audioEnabled, toggleAudio } = useSpatialAudio({ whaleEvents, momentum });

  // Whale history & replay
  const replay = useWhaleHistory(whaleEvents);
  const displayEvents = replay.replayEvents;

  // Feed real price to simulation fallback
  useEffect(() => {
    if (price.price > 0) setLivePrice(symbol, price.price);
  }, [price.price, symbol]);

  // Keep a stable price history buffer that doesn't empty-flash on symbol change
  const stablePriceHistory = useRef<number[]>([]);
  const prevSymbol = useRef(symbol);

  const rawPrices = useMemo(() => trades.map(t => t.price), [trades]);

  useEffect(() => {
    if (prevSymbol.current !== symbol) {
      prevSymbol.current = symbol;
    }
    if (rawPrices.length > 0) {
      stablePriceHistory.current = rawPrices;
    }
  }, [rawPrices, symbol]);

  const priceHistory = stablePriceHistory.current.length > 0
    ? stablePriceHistory.current
    : rawPrices;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <WhaleScene
        whaleEvents={displayEvents}
        momentum={momentum}
        volatility={volatility}
        priceHistory={priceHistory}
        orderbook={orderbook}
      />

      <MarketStats
        price={price}
        volatility={volatility}
        momentum={momentum}
        whaleCount={displayEvents.length}
        connected={connected}
        simulated={simulated}
        connectionInfo={connectionInfo}
        fundingHistory={fundingHistory}
        audioEnabled={audioEnabled}
        onToggleAudio={toggleAudio}
      />

      <SymbolSelector />

      <WhalePulseFeed whaleEvents={displayEvents} />
      <WhaleTimeline whaleEvents={displayEvents} />

      <AIInsightPanel
        whaleEvents={displayEvents}
        momentum={momentum}
        volatility={volatility}
        symbol={symbol}
      />

      <WhaleOrbTooltip whaleEvents={displayEvents} />
      <SceneLegend />
      <OnboardingTutorial />

      <WhaleReplayPanel
        isReplaying={replay.isReplaying}
        replayCursor={replay.replayCursor}
        setReplayCursor={replay.setReplayCursor}
        cursorTime={replay.cursorTime}
        speed={replay.speed}
        setSpeed={replay.setSpeed}
        playActive={replay.playActive}
        togglePlay={replay.togglePlay}
        startReplay={replay.startReplay}
        stopReplay={replay.stopReplay}
        totalEvents={replay.totalEvents}
        visibleEvents={replay.replayEvents.length}
        timeRange={replay.timeRange}
      />

      <div
        className="fixed inset-0 z-20 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
};

export default Index;
