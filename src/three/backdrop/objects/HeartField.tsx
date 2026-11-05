import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { wrap } from '../config'
import { makeHeartGeometry } from '../geometry/heart'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 32
const COLORS = ['#F4739F', '#F8A8C4', '#EF5D92', '#FFC9DA', '#FF9EC2']
const LAYOUT = { zMin: -24, zMax: -6, sMin: 0.2, sMax: 0.46, edgeBias: 0.55 }

// Tim hồng bay lên, xoay nhẹ và lớn dần/nhỏ dần theo nhịp.
export function HeartField({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeHeartGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.24,
        metalness: 0.04,
        clearcoat: 0.9,
        clearcoatRoughness: 0.18,
        sheen: 0.5,
        sheenColor: new THREE.Color('#FFD1E1'),
        sheenRoughness: 0.35,
        emissive: new THREE.Color('#FF5C93'),
        emissiveIntensity: 0.05,
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
      const y = yMin + wrap(sd.y - yMin + t * sd.sp * speed * 1.15, span)

      dummy.position.set(sd.x + Math.sin(t * 0.35 * speed + sd.ph) * 0.9, y, sd.z)
      dummy.rotation.set(
        Math.sin(t * 0.4 + sd.ph) * 0.4,
        sd.rot * 0.08 + Math.sin(t * 0.5 * speed + sd.ph) * 0.58,
        sd.rot * 0.08 + Math.sin(t * 0.45 + sd.ph * 1.3) * 0.32,
      )
      dummy.scale.setScalar(sd.s * (0.86 + 0.14 * Math.sin(t * 1.2 + sd.ph)))
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
