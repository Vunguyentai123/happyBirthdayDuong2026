import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 32
const COLORS = ['#FFFFFF', '#FFE3EE', '#DCEEFF', '#DFFFF4', '#F0E4FF']
const LAYOUT = { zMin: -24, zMax: -6, sMin: 0.7, sMax: 1.5, edgeBias: 0.6 }

// Ngọc trai iridescent bay lơ lửng như bong bóng nhỏ.
export function Pearls({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => new THREE.SphereGeometry(0.08, 14, 12), [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        sheen: 0.8,
        sheenColor: new THREE.Color('#FFD9E6'),
        sheenRoughness: 0.3,
        iridescence: 0.7,
        iridescenceIOR: 1.32,
        iridescenceThicknessRange: [140, 460],
      }),
    [],
  )

  useInstanceColors(meshRef, COLORS, COUNT)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    mesh.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      dummy.position.set(
        sd.x + Math.sin(t * 0.32 + sd.ph) * 0.7,
        sd.y + Math.sin(t * 0.6 + sd.ph * 1.4) * 0.9,
        sd.z,
      )
      dummy.rotation.set(t * 0.15 * speed + sd.ph, t * 0.2 * speed, 0)
      dummy.scale.setScalar(sd.s * (0.9 + 0.1 * Math.sin(t * 1.4 + sd.ph)))
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
