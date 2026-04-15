import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrderbookData } from '@/lib/types';

interface LiquidityDepthFieldProps {
  orderbook: OrderbookData | null;
}

const GRID_X = 40;
const GRID_Z = 20;
const FIELD_WIDTH = 16;
const FIELD_DEPTH = 4;
const BASE_Y = -3.5;

export function LiquidityDepthField({ orderbook }: LiquidityDepthFieldProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetHeights = useRef<Float32Array>(new Float32Array(GRID_X * GRID_Z));
  const currentHeights = useRef<Float32Array>(new Float32Array(GRID_X * GRID_Z));
  const mouseWorld = useRef(new THREE.Vector3());
  const mouseNDC = useRef(new THREE.Vector2());
  const { camera, size } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.current.x = (e.clientX / size.width) * 2 - 1;
      mouseNDC.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [size]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(FIELD_WIDTH, FIELD_DEPTH, GRID_X - 1, GRID_Z - 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, BASE_Y, 2);

    const colors = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.0;
      colors[i + 1] = 0.3;
      colors[i + 2] = 0.5;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const positions = geometry.attributes.position;
    const colors = geometry.attributes.color;

    // Get mouse world pos on the terrain plane
    raycaster.setFromCamera(mouseNDC.current, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BASE_Y);
    raycaster.ray.intersectPlane(plane, mouseWorld.current);

    const heights = targetHeights.current;
    const cur = currentHeights.current;

    if (orderbook) {
      const maxBidAmount = Math.max(...orderbook.bids.map(b => b.amount), 1);
      const maxAskAmount = Math.max(...orderbook.asks.map(a => a.amount), 1);

      for (let ix = 0; ix < GRID_X; ix++) {
        const normalizedX = ix / (GRID_X - 1);
        const isBid = normalizedX < 0.5;
        const levelIdx = isBid
          ? Math.floor((0.5 - normalizedX) * 2 * 10)
          : Math.floor((normalizedX - 0.5) * 2 * 10);
        const clampedIdx = Math.min(9, levelIdx);
        let amount = 0;
        let maxAmount = 1;

        if (isBid && orderbook.bids[clampedIdx]) {
          amount = orderbook.bids[clampedIdx].amount;
          maxAmount = maxBidAmount;
        } else if (!isBid && orderbook.asks[clampedIdx]) {
          amount = orderbook.asks[clampedIdx].amount;
          maxAmount = maxAskAmount;
        }

        const heightVal = (amount / maxAmount) * 1.8;
        for (let iz = 0; iz < GRID_Z; iz++) {
          const idx = iz * GRID_X + ix;
          const zWave = Math.sin(t * 0.8 + iz * 0.4 + ix * 0.1) * 0.08;
          heights[idx] = heightVal + zWave;
        }
      }
    } else {
      for (let ix = 0; ix < GRID_X; ix++) {
        for (let iz = 0; iz < GRID_Z; iz++) {
          const idx = iz * GRID_X + ix;
          heights[idx] = Math.sin(t * 0.5 + ix * 0.3) * 0.3 +
                         Math.cos(t * 0.3 + iz * 0.5) * 0.2 + 0.4;
        }
      }
    }

    for (let ix = 0; ix < GRID_X; ix++) {
      for (let iz = 0; iz < GRID_Z; iz++) {
        const idx = iz * GRID_X + ix;

        cur[idx] += (heights[idx] - cur[idx]) * 0.06;

        // Cursor proximity distortion — ripple effect
        const worldX = (ix / (GRID_X - 1) - 0.5) * FIELD_WIDTH;
        const worldZ = (iz / (GRID_Z - 1) - 0.5) * FIELD_DEPTH + 2;
        const dx = worldX - mouseWorld.current.x;
        const dz = worldZ - mouseWorld.current.z;
        const distToMouse = Math.sqrt(dx * dx + dz * dz);
        const mouseInfluence = distToMouse < 3 ? (1 - distToMouse / 3) * 0.6 : 0;
        const mouseRipple = mouseInfluence * Math.sin(t * 4 - distToMouse * 2) * 0.3;

        const y = BASE_Y + cur[idx] + mouseRipple;
        positions.setY(idx, y);

        const normalizedX = ix / (GRID_X - 1);
        const isBid = normalizedX < 0.5;
        const intensity = Math.min(1, (cur[idx] + mouseInfluence * 0.5) / 1.5);
        const pulse = 0.7 + Math.sin(t * 1.5 + ix * 0.2) * 0.3;

        // Brighten near cursor
        const cursorGlow = 1 + mouseInfluence * 1.5;

        if (isBid) {
          colors.setXYZ(idx,
            0.0 * intensity * pulse * cursorGlow,
            (0.6 * intensity * pulse + 0.05) * cursorGlow,
            (1.0 * intensity * pulse + 0.1) * cursorGlow
          );
        } else {
          colors.setXYZ(idx,
            (0.8 * intensity * pulse + 0.1) * cursorGlow,
            0.05 * intensity * pulse * cursorGlow,
            (0.5 * intensity * pulse + 0.1) * cursorGlow
          );
        }
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial vertexColors transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} wireframe />
      </mesh>
      <mesh position={[0, BASE_Y + 0.05, 2]}>
        <planeGeometry args={[0.02, FIELD_DEPTH]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}
