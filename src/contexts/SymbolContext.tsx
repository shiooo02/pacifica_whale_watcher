import { createContext, useContext, useState, ReactNode } from 'react';

const AVAILABLE_SYMBOLS = ['SOL', 'BTC', 'ETH', 'SUI', 'WIF', 'JUP', 'BONK', 'RENDER'] as const;

export type PacificaSymbol = typeof AVAILABLE_SYMBOLS[number];

interface SymbolContextValue {
  symbol: PacificaSymbol;
  setSymbol: (s: PacificaSymbol) => void;
  availableSymbols: readonly PacificaSymbol[];
}

const SymbolContext = createContext<SymbolContextValue>({
  symbol: 'SOL',
  setSymbol: () => {},
  availableSymbols: AVAILABLE_SYMBOLS,
});

export function SymbolProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<PacificaSymbol>('SOL');
  return (
    <SymbolContext.Provider value={{ symbol, setSymbol, availableSymbols: AVAILABLE_SYMBOLS }}>
      {children}
    </SymbolContext.Provider>
  );
}

export function useSymbol() {
  return useContext(SymbolContext);
}
