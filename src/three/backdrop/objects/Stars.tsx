import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeStarGeometry } from '../geometry/star'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 38
const COLORS = ['#F5C518', '#FFD964', '#EAB308', '#FFF0B0', '#F0A840']
const LAYOUT = { zMin: -26, zMax: -8, sMin: 0.24, sMax: 0.62, edgeBias: 0.5 }

// Sao vàng kim loại, nhấp nháy nhẹ và luôn quay mặt gần về phía camera.
export function Stars({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeStarGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.18,
        metalness: 0.68,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
        emissive: new THREE.Color('#F5C518'),
        emissiveIntensity: 0.16,
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
        sd.x + Math.sin(t * 0.3 + sd.ph) * 0.6,
        sd.y + Math.sin(t * 0.55 + sd.ph) * 0.8,
        sd.z,
      )
      dummy.rotation.set(
        sd.rot * 0.1 + Math.sin(t * 0.4 + sd.ph) * 0.28,
        sd.rot * 0.08 + Math.sin(t * 0.48 * speed + sd.ph) * 0.6,
        sd.rot * 0.1 + Math.sin(t * 0.42 + sd.ph) * 0.32,
      )

      const twinkle = 0.82 + 0.18 * Math.sin(t * 2.2 + sd.ph * 3)
      dummy.scale.setScalar(sd.s * twinkle)
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
