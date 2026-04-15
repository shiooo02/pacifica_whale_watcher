import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AmbientParticles } from './AmbientParticles';
import { WhaleOrbs } from './WhaleOrbs';
import { MarketWave } from './MarketWave';
import { LiquidityDepthField } from './LiquidityDepthField';
import { CameraRig } from './CameraRig';
import { WhaleEvent, OrderbookData } from '@/lib/types';

interface WhaleSceneProps {
  whaleEvents: WhaleEvent[];
  momentum: number;
  volatility: number;
  priceHistory: number[];
  orderbook: OrderbookData | null;
}

export function WhaleScene({ whaleEvents, momentum, volatility, priceHistory, orderbook }: WhaleSceneProps) {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'linear-gradient(180deg, #080c1a 0%, #0d0520 50%, #0a0a18 100%)' }}
      >
        <color attach="background" args={['#080c1a']} />
        <fog attach="fog" args={['#080c1a', 15, 35]} />

        <CameraRig />
        <AmbientParticles />
        <WhaleOrbs whaleEvents={whaleEvents} />
        <MarketWave momentum={momentum} volatility={volatility} priceHistory={priceHistory} />
        <LiquidityDepthField orderbook={orderbook} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
