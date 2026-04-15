import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WhaleEvent } from '@/lib/types';

interface WhaleOrbsProps {
  whaleEvents: WhaleEvent[];
}

interface OrbData {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  targetScale: number;
  currentScale: number;
  color: THREE.Color;
  birth: number;
  score: number;
  opacity: number;
  trade: WhaleEvent['trade'];
  label: string;
}

const MAX_ORBS = 60;
const CYAN = new THREE.Color(0x00d4ff);
const MAGENTA = new THREE.Color(0xff3399);
const PROXIMITY_THRESHOLD = 2.5;

export function WhaleOrbs({ whaleEvents }: WhaleOrbsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const orbsRef = useRef<OrbData[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastProcessed = useRef(0);
  const mouseWorld = useRef(new THREE.Vector3());
  const { camera, size } = useThree();

  const ringRef = useRef<THREE.Mesh>(null);
  const ringData = useRef({ active: false, scale: 0, opacity: 0, pos: new THREE.Vector3() });

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseNDC = useRef(new THREE.Vector2(9999, 9999));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.current.x = (e.clientX / size.width) * 2 - 1;
      mouseNDC.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [size]);

  // Detect symbol change
  useEffect(() => {
    if (whaleEvents.length < lastProcessed.current) {
      orbsRef.current.forEach(orb => {
        orb.opacity = Math.min(orb.opacity, 0.3);
        orb.targetScale *= 0.3;
      });
      lastProcessed.current = 0;
      return;
    }
    if (whaleEvents.length <= lastProcessed.current) return;
    const newEvents = whaleEvents.slice(lastProcessed.current);
    lastProcessed.current = whaleEvents.length;

    newEvents.forEach(event => {
      // Scale based on trade size — smaller overall, proportional to USD value
      const sizeK = event.trade.sizeUsd / 1000;
      const scaleFactor = Math.min(1.2, Math.max(0.15, sizeK / 200));

      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 6;
      const z = (Math.random() - 0.5) * 4;

      const orb: OrbData = {
        id: event.id,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005
        ),
        targetScale: 0.08 + scaleFactor * 0.25,
        currentScale: 0,
        color: event.trade.side === 'long' ? CYAN.clone() : MAGENTA.clone(),
        birth: Date.now(),
        score: event.score,
        opacity: 1,
        trade: event.trade,
        label: event.label,
      };

      orbsRef.current.push(orb);

      if (event.score > 70) {
        ringData.current = { active: true, scale: 0.3, opacity: 1, pos: orb.pos.clone() };
      }
    });

    if (orbsRef.current.length > MAX_ORBS) {
      orbsRef.current = orbsRef.current.slice(-MAX_ORBS);
    }
  }, [whaleEvents]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const now = Date.now();

    raycaster.setFromCamera(mouseNDC.current, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.ray.intersectPlane(plane, mouseWorld.current);

    const orbs = orbsRef.current;
    let closestOrb: OrbData | null = null;
    let closestDist = PROXIMITY_THRESHOLD;

    for (let i = 0; i < MAX_ORBS; i++) {
      if (i < orbs.length) {
        const orb = orbs[i];
        const age = (now - orb.birth) / 1000;

        orb.currentScale += (orb.targetScale - orb.currentScale) * 0.08;
        orb.opacity = age > 12 ? Math.max(0, 1 - (age - 12) / 3) : 1;

        orb.pos.add(orb.vel);
        orb.pos.y += Math.sin(t + i * 0.5) * 0.003;

        const distToMouse = orb.pos.distanceTo(mouseWorld.current);
        if (distToMouse < closestDist) {
          closestDist = distToMouse;
          closestOrb = orb;
        }

        if (distToMouse < PROXIMITY_THRESHOLD && distToMouse > 0.3) {
          const pull = mouseWorld.current.clone().sub(orb.pos).normalize().multiplyScalar(0.0015 / distToMouse);
          orb.vel.add(pull);
        }

        for (let j = i + 1; j < orbs.length; j++) {
          const diff = orb.pos.clone().sub(orbs[j].pos);
          const dist = diff.length();
          if (dist < 2 && dist > 0.01) {
            const force = diff.normalize().multiplyScalar(0.003 / dist);
            orb.vel.add(force);
            orbs[j].vel.sub(force);
          }
        }

        orb.vel.multiplyScalar(0.995);
        if (Math.abs(orb.pos.x) > 8) orb.vel.x *= -0.8;
        if (Math.abs(orb.pos.y) > 4) orb.vel.y *= -0.8;

        dummy.position.copy(orb.pos);
        const proximityBoost = distToMouse < PROXIMITY_THRESHOLD ? 1 + (1 - distToMouse / PROXIMITY_THRESHOLD) * 0.4 : 1;
        const pulse = 1 + Math.sin(t * 2 + orb.score * 0.1) * 0.1;
        dummy.scale.setScalar(orb.currentScale * pulse * proximityBoost);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);

        if (distToMouse < PROXIMITY_THRESHOLD) {
          const boost = 1 + (1 - distToMouse / PROXIMITY_THRESHOLD) * 0.5;
          const boosted = orb.color.clone().multiplyScalar(boost);
          meshRef.current!.setColorAt(i, boosted);
        } else {
          meshRef.current!.setColorAt(i, orb.color);
        }
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Always dispatch hover event — no caching, always find closest
    if (closestOrb && closestDist < PROXIMITY_THRESHOLD) {
      const projected = closestOrb.pos.clone().project(camera);
      const sx = (projected.x * 0.5 + 0.5) * size.width;
      const sy = (-projected.y * 0.5 + 0.5) * size.height;
      const whaleEvent = whaleEvents.find(e => e.id === closestOrb!.id);
      if (whaleEvent) {
        window.dispatchEvent(new CustomEvent('whale-orb-hover', {
          detail: { x: sx, y: sy, event: whaleEvent },
        }));
      } else {
        // Orb exists but event gone — still show from orb data
        window.dispatchEvent(new CustomEvent('whale-orb-hover', {
          detail: {
            x: sx, y: sy,
            event: { id: closestOrb.id, score: closestOrb.score, label: closestOrb.label, trade: closestOrb.trade, timestamp: closestOrb.birth } as WhaleEvent,
          },
        }));
      }
    } else {
      window.dispatchEvent(new CustomEvent('whale-orb-hover', { detail: null }));
    }

    // Shockwave ring
    if (ringRef.current) {
      if (ringData.current.active) {
        ringData.current.scale += 0.15;
        ringData.current.opacity *= 0.94;
        ringRef.current.position.copy(ringData.current.pos);
        ringRef.current.scale.setScalar(ringData.current.scale);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = ringData.current.opacity;
        ringRef.current.visible = true;
        if (ringData.current.opacity < 0.01) {
          ringData.current.active = false;
          ringRef.current.visible = false;
        }
      } else {
        ringRef.current.visible = false;
      }
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_ORBS]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial transparent opacity={0.8} toneMapped={false} />
      </instancedMesh>
      <mesh ref={ringRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </>
  );
}
