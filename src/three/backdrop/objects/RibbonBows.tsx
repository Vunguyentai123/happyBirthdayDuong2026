import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeBowGeometry } from '../geometry/bow'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 14
const COLORS = ['#FF5C8A', '#FF8FB1', '#F0426B', '#FFB8D0', '#D8C4FF', '#F5C518']
const LAYOUT = { zMin: -20, zMax: -6, sMin: 0.72, sMax: 1.2, edgeBias: 0.7 }

// Nơ ribbon bay lơ lửng, luôn quay gần về camera để nhìn rõ 2 vòng và đuôi nơ.
export function RibbonBows({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeBowGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.16,
        metalness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        sheen: 0.7,
        sheenColor: new THREE.Color('#FFD1E1'),
        sheenRoughness: 0.3,
        iridescence: 0.25,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [100, 340],
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
        sd.x + Math.sin(t * 0.38 + sd.ph) * 0.5,
        sd.y + Math.sin(t * 0.62 + sd.ph) * 0.55,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.4 + sd.ph) * 0.12,
        Math.sin(t * 0.32 * speed + sd.ph) * 0.42,
        Math.sin(t * 0.48 + sd.ph) * 0.1,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(k, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
