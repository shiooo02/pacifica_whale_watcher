import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MarketWaveProps {
  momentum: number;
  volatility: number;
  priceHistory: number[];
}

const SEGMENTS = 128;
const WIDTH = 16;

export function MarketWave({ momentum, volatility, priceHistory }: MarketWaveProps) {
  const lineRef = useRef<THREE.Line | null>(null);
  const glowRef = useRef<THREE.Line | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Lerped values for smooth transitions
  const lerpedMomentum = useRef(0);
  const lerpedVolatility = useRef(0.5);
  const lerpedPriceOffsets = useRef(new Float32Array(SEGMENTS).fill(0));
  const lerpedColor = useRef(new THREE.Color('#ffaa00'));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SEGMENTS * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const glowGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SEGMENTS * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(40 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9, toneMapped: false }), []);
  const glowMaterial = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.2, toneMapped: false }), []);
  const pointMaterial = useMemo(() => new THREE.PointsMaterial({ size: 0.08, transparent: true, opacity: 0.6, toneMapped: false, sizeAttenuation: true }), []);

  const lineObj = useMemo(() => new THREE.Line(geometry, lineMaterial), [geometry, lineMaterial]);
  const glowObj = useMemo(() => new THREE.Line(glowGeometry, glowMaterial), [glowGeometry, glowMaterial]);
  const pointsObj = useMemo(() => new THREE.Points(particleGeo, pointMaterial), [particleGeo, pointMaterial]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const positions = geometry.attributes.position.array as Float32Array;
    const glowPositions = glowGeometry.attributes.position.array as Float32Array;
    const pPositions = particleGeo.attributes.position.array as Float32Array;

    // Lerp momentum & volatility slowly for smooth transitions between tokens
    const lerpSpeed = 0.012;
    lerpedMomentum.current += (momentum - lerpedMomentum.current) * lerpSpeed;
    lerpedVolatility.current += (volatility - lerpedVolatility.current) * lerpSpeed;

    const m = lerpedMomentum.current;
    const v = lerpedVolatility.current;

    const targetColor = new THREE.Color(m > 0.2 ? '#00d4ff' : m < -0.2 ? '#ff3399' : '#ffaa00');
    lerpedColor.current.lerp(targetColor, 0.05);
    lineMaterial.color.copy(lerpedColor.current);
    glowMaterial.color.copy(lerpedColor.current);
    pointMaterial.color.copy(lerpedColor.current);

    // Compute price range for normalization
    let priceMin = Infinity, priceMax = -Infinity;
    for (let j = 0; j < priceHistory.length; j++) {
      if (priceHistory[j] < priceMin) priceMin = priceHistory[j];
      if (priceHistory[j] > priceMax) priceMax = priceHistory[j];
    }
    const priceRange = priceMax - priceMin || 1;

    for (let i = 0; i < SEGMENTS; i++) {
      const x = (i / SEGMENTS - 0.5) * WIDTH;
      const priceIdx = Math.floor((i / SEGMENTS) * priceHistory.length);
      const targetOffset = priceHistory.length > 0
        ? ((priceHistory[priceIdx] - priceMin) / priceRange - 0.5) * 3
        : 0;

      // Lerp price offsets for smooth crossfade
      lerpedPriceOffsets.current[i] += (targetOffset - lerpedPriceOffsets.current[i]) * 0.015;

      const wave1 = Math.sin(x * 0.8 + t * 0.7) * (0.5 + v * 1.5);
      const wave2 = Math.sin(x * 1.5 + t * 1.2) * 0.3 * v;
      const wave3 = Math.sin(x * 0.3 + t * 0.3) * 0.8;

      const y = wave1 + wave2 + wave3 + lerpedPriceOffsets.current[i];

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;

      glowPositions[i * 3] = x;
      glowPositions[i * 3 + 1] = y;
      glowPositions[i * 3 + 2] = 0;
    }
    geometry.attributes.position.needsUpdate = true;
    glowGeometry.attributes.position.needsUpdate = true;

    // Particles flowing along wave
    for (let i = 0; i < 40; i++) {
      const segIdx = Math.floor(((t * 0.3 + i * 0.025) % 1) * SEGMENTS) * 3;
      pPositions[i * 3] = positions[segIdx] || 0;
      pPositions[i * 3 + 1] = (positions[segIdx + 1] || 0) + (Math.random() - 0.5) * 0.3;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    particleGeo.attributes.position.needsUpdate = true;
  });

  return (
    <group position={[0, 0, -2]}>
      <primitive object={lineObj} />
      <primitive object={glowObj} />
      <primitive object={pointsObj} />
    </group>
  );
}
