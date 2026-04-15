import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 600;

export function AmbientParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.001
      ),
      scale: 0.02 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      p.pos.add(p.vel);
      // Soft boundary wrap
      if (Math.abs(p.pos.x) > 20) p.vel.x *= -1;
      if (Math.abs(p.pos.y) > 10) p.vel.y *= -1;
      if (Math.abs(p.pos.z) > 15) p.vel.z *= -1;

      dummy.position.copy(p.pos);
      const breathe = 1 + Math.sin(t * 0.5 + p.phase) * 0.3;
      dummy.scale.setScalar(p.scale * breathe);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#1a4a6a" transparent opacity={0.3} />
    </instancedMesh>
  );
}
