# 🐋 Pacifica Whale Watcher

**Real-time whale activity intelligence platform for Pacifica DEX — visualized as an immersive WebGL experience.**

> Built for the Pacifica Hackathon 2025

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Three.js%20%2B%20Supabase-blue)
![Data](https://img.shields.io/badge/data-Pacifica%20WebSocket%20%2B%20REST-orange)

---

## 🎯 What Is This?

Pacifica Whale Watcher transforms raw trading data from the Pacifica perpetual DEX into a **real-time, immersive 3D visualization** of whale activity. Instead of a traditional dashboard with charts and tables, traders experience market dynamics as a living, breathing deep-ocean environment — where whale trades materialize as glowing orbs, market momentum flows as energy waves, and liquidity depth morphs the terrain beneath.

**This is not a dashboard. This is a trading sixth sense.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Three.js  │  │ Overlays │  │ Spatial Audio│  │
│  │ WebGL     │  │ (React)  │  │ (Web Audio)  │  │
│  │ Scene     │  │          │  │              │  │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│  ┌─────┴──────────────┴───────────────┴───────┐  │
│  │         Data Layer (Custom Hooks)          │  │
│  │  useTradeStream · usePriceStream           │  │
│  │  useCandleStream · useOrderbookStream      │  │
│  │  useFundingHistory                         │  │
│  └─────────────────┬──────────────────────────┘  │
└────────────────────┼─────────────────────────────┘
                     │
        ┌────────────┴────────────────┐
        │    Pacifica WebSocket API   │
        │   wss://ws.pacifica.fi/ws   │
        │                             │
        │  Channels:                  │
        │  · trades (real-time)       │
        │  · prices (global stream)   │
        │  · candle (1m OHLCV)        │
        │  · book (orderbook L2)      │
        └────────────┬────────────────┘
                     │
        ┌────────────┴────────────────┐
        │    Pacifica REST API        │
        │  api.pacifica.fi/api/v1     │
        │                             │
        │  · /funding_rate/history    │
        └─────────────────────────────┘
                     │
        ┌────────────┴────────────────┐
        │    AI Insights (Edge Fn)    │
        │  Gemini LLM via Lovable AI  │
        │  Gateway — generates whale  │
        │  behavior interpretations   │
        └─────────────────────────────┘
```

---

## ✨ Key Features

### 🌊 Immersive 3D Visualization
- **Whale Orbs** — Each significant trade spawns a physics-based glowing orb. Size = trade value, color = direction (cyan = long, magenta = short). Orbs drift with gravity/inertia and react to your cursor with magnetic attraction.
- **Market Wave** — A flowing energy waveform that morphs based on real price action, volatility, and momentum. Color shifts from cyan (bullish) through amber (neutral) to magenta (bearish).
- **Liquidity Depth Field** — A 3D terrain that reshapes in real-time based on orderbook bid/ask volume. See where the liquidity walls are, literally.
- **Ambient Particles** — Volumetric deep-ocean atmosphere with drifting particles for cinematic depth.
- **Bloom & Fog** — UnrealBloomPass post-processing with volumetric fog for that deep-sea aesthetic.

### 📊 Real-Time Market Intelligence
- **Live Price Tracking** — Sub-second price updates with 24h change percentage
- **Funding Rate Sparkline** — 48-point historical funding rate chart fetched from Pacifica REST API
- **Open Interest & 24h Volume** — Key market health metrics displayed as compact pills
- **Volatility & Momentum Gauges** — Computed from rolling 1-minute candle data

### 🐋 Whale Detection Engine
- **Scoring Algorithm (0–100)** — Analyzes trade size, clustering patterns, directional consistency, liquidation events, and trend alignment
- **Smart Labels** — Classifies whale behavior: "Aggressive Long", "Stealth Accumulation", "Short Squeeze Setup", "Distribution Phase", "Liquidation Cascade"
- **Whale Pulse Feed** — Live scrolling feed of detected whale events with score and size
- **Temporal Intensity Timeline** — Visual heatmap showing whale activity intensity over the last 5 minutes

### 🤖 AI-Powered Insights
- **LLM Analysis** — Gemini-powered interpretation of whale patterns, generating "insider-style" market reads
- **Contextual Awareness** — AI receives current momentum, volatility, and recent whale events for grounded analysis
- **Rate Limit Resilience** — Exponential backoff (45s → 5min) to handle API rate limits gracefully

### 🔊 Spatial Audio
- **Procedural Sound Design** — No audio files — all sounds generated in real-time via Web Audio API
- **Whale Sonar Pings** — Each whale event triggers a spatial sonar ping, pitch-mapped to trade size
- **Shockwave Rumbles** — High-score whale events (>70) produce a deep bass rumble
- **Momentum Shift Tones** — Tonal changes when market momentum crosses directional thresholds

### 🔄 Multi-Token Support
- **8 Markets** — SOL, BTC, ETH, SUI, WIF, JUP, BONK, RENDER
- **Smooth Transitions** — Lerped crossfades for all visuals when switching tokens (no jarring resets)
- **Shared WebSocket** — Single persistent connection for price data across all symbols

### 📱 Responsive Design
- Mobile-optimized overlay layout with stacking metric pills
- Touch-friendly symbol selector

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **3D Engine** | Three.js, React Three Fiber, React Three Postprocessing |
| **Styling** | Tailwind CSS v3, Custom CSS design tokens |
| **Data** | Pacifica WebSocket API, Pacifica REST API |
| **AI** | Google Gemini (via Lovable AI Gateway) |
| **Audio** | Web Audio API (procedural synthesis) |
| **Backend** | Supabase Edge Functions |
| **Charts** | Recharts (funding sparkline) |
| **State** | React Context, Custom hooks with ring buffers |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd pacifica-whale-watcher

# Install dependencies
npm install

# Start development server
npm run dev
```

The app connects to Pacifica's public WebSocket and REST APIs automatically — **no API keys required** for market data.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── scene/          # Three.js 3D components
│   │   ├── WhaleScene.tsx        # Main canvas + post-processing
│   │   ├── WhaleOrbs.tsx         # Instanced whale trade orbs
│   │   ├── MarketWave.tsx        # Animated price waveform
│   │   ├── LiquidityDepthField.tsx # Orderbook terrain
│   │   ├── AmbientParticles.tsx  # Atmospheric particles
│   │   └── CameraRig.tsx        # Smooth camera motion
│   └── overlay/        # 2D UI overlays
│       ├── MarketStats.tsx       # Price + metrics bar
│       ├── AIInsightPanel.tsx    # LLM analysis panel
│       ├── WhalePulseFeed.tsx    # Live whale event feed
│       ├── WhaleTimeline.tsx     # Temporal intensity bars
│       ├── SymbolSelector.tsx    # Token switcher
│       ├── FundingSparkline.tsx  # Funding rate chart
│       └── WhaleOrbTooltip.tsx   # Hover tooltip for orbs
├── hooks/              # Data stream hooks
│   ├── useTradeStream.ts         # WebSocket trade feed
│   ├── usePriceStream.ts        # Shared price connection
│   ├── useCandleStream.ts       # 1m candle stream
│   ├── useOrderbookStream.ts    # L2 orderbook stream
│   ├── useFundingHistory.ts     # REST funding history
│   └── useSpatialAudio.ts       # Audio engine hook
├── lib/                # Utilities
│   ├── whaleDetection.ts        # Scoring algorithm
│   ├── spatialAudio.ts          # Web Audio synthesis
│   ├── ringBuffer.ts            # Efficient rolling buffer
│   └── types.ts                 # TypeScript interfaces
├── contexts/
│   └── SymbolContext.tsx         # Global symbol state
└── pages/
    └── Index.tsx                 # Main app page
```

---

## 🎨 Design Philosophy

> "What if Bloomberg Terminal was designed by James Cameron?"

Traditional trading tools show data. Whale Watcher lets you **feel** it. Every visual element maps to real market data — nothing is decorative. The deep-ocean metaphor isn't just aesthetic; it creates an intuitive spatial model where:

- **Depth** = time (newer events surface, older ones sink)
- **Size** = capital (bigger orbs = bigger trades)
- **Color** = direction (cyan = bullish pressure, magenta = bearish pressure)
- **Motion** = momentum (wave speed and amplitude reflect market energy)
- **Terrain** = liquidity (see where the buy/sell walls literally are)

---

## 🏆 Hackathon Submission

**Track:** Pacifica Hackathon 2025

**What makes this unique:**
1. **First immersive WebGL whale watcher** for Pacifica — no one else is doing 3D
2. **Full Pacifica API integration** — WebSocket (trades, prices, candles, orderbook) + REST (funding history)
3. **AI-augmented analysis** — Not just showing data, but interpreting whale behavior
4. **Procedural audio** — Market data you can hear, not just see
5. **Zero API keys needed** — Works instantly with Pacifica's public endpoints

---

## 📄 License

MIT

---

<p align="center">
  <strong>Built with 🐋 for the Pacifica ecosystem</strong>
</p>
