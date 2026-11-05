import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { wrap } from '../config'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 16
const COLORS = ['#FFE08A', '#FFC9D4', '#FFD7A8', '#F7E3B0', '#FFB8D0']
const LAYOUT = { zMin: -22, zMax: -7, sMin: 1.0, sMax: 1.85, edgeBias: 0.7 }

// Nhẫn kim loại mảnh, xoay chậm để bắt sáng.
export function Rings({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => new THREE.TorusGeometry(0.15, 0.022, 10, 36), [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.14,
        metalness: 0.82,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color('#F5C518'),
        emissiveIntensity: 0.07,
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
      const yMin = 1 - sd.h * 0.82
      const span = sd.h * 1.64

      dummy.position.set(
        sd.x + Math.sin(t * 0.4 + sd.ph) * 0.6,
        yMin + wrap(sd.y - yMin + t * sd.sp * speed * 0.35, span),
        sd.z,
      )
      dummy.rotation.set(
        sd.rot + t * 0.38 * speed,
        t * 0.28 * speed * sd.sp + sd.ph,
        sd.rot * 0.5 + t * 0.22 * speed,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
