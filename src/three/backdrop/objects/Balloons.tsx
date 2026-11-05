import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeRoundBalloonGeometries } from '../geometry/balloons'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 18
const COLORS = ['#FF8FB1', '#FFB3C8', '#A8E6CF', '#B9D7FF', '#D8C4FF', '#FFE0A3', '#FFC9DA']
const LAYOUT = { zMin: -24, zMax: -7, sMin: 0.78, sMax: 1.28, edgeBias: 0.75 }

// Bóng bay tròn nhiều màu, có nút thắt và dây.
export function Balloons({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const bodyRef = useRef<THREE.InstancedMesh>(null!)
  const knotRef = useRef<THREE.InstancedMesh>(null!)
  const stringRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeRoundBalloonGeometries(), [])

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.14,
        metalness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        sheen: 0.6,
        sheenColor: new THREE.Color('#FFFFFF'),
        iridescence: 0.35,
        iridescenceIOR: 1.25,
        iridescenceThicknessRange: [100, 400],
      }),
    [],
  )

  const stringMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#FFF8EE', roughness: 0.65 }),
    [],
  )

  useInstanceColors(bodyRef, COLORS, COUNT)
  useInstanceColors(knotRef, COLORS, COUNT)

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const knot = knotRef.current
    const string = stringRef.current
    if (!body) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    body.count = n
    if (knot) knot.count = n
    if (string) string.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      dummy.position.set(
        sd.x + Math.sin(t * 0.28 + sd.ph) * 0.8,
        sd.y + Math.sin(t * 0.45 + sd.ph) * 1.0,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.35 + sd.ph) * 0.12,
        sd.rot + t * 0.13 * speed,
        Math.sin(t * 0.4 + sd.ph) * 0.1,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()

      body.setMatrixAt(k, dummy.matrix)
      knot?.setMatrixAt(k, dummy.matrix)
      string?.setMatrixAt(k, dummy.matrix)
    }

    body.instanceMatrix.needsUpdate = true
    if (knot) knot.instanceMatrix.needsUpdate = true
    if (string) string.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={bodyRef}
        args={[geometry.body, bodyMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={knotRef}
        args={[geometry.knot, bodyMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={stringRef}
        args={[geometry.string, stringMaterial, COUNT]}
        frustumCulled={false}
      />
    </>
  )
}
