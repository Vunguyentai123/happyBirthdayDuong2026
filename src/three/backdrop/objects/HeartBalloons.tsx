import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeHeartBalloonGeometries } from '../geometry/balloons'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 13
const COLORS = ['#FF5C8A', '#FF7FA8', '#F0426B', '#FF9EC2', '#D93A6A']
const LAYOUT = { zMin: -24, zMax: -7, sMin: 0.52, sMax: 0.88, edgeBias: 0.75 }

// Bóng bay hình tim bóng loáng, có nút thắt và dây cong.
export function HeartBalloons({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const bodyRef = useRef<THREE.InstancedMesh>(null!)
  const knotRef = useRef<THREE.InstancedMesh>(null!)
  const stringRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeHeartBalloonGeometries(), [])

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.1,
        metalness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 0.6,
        sheenColor: new THREE.Color('#FFD1E1'),
        iridescence: 0.25,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [120, 380],
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
        sd.x + Math.sin(t * 0.3 + sd.ph) * 0.75,
        sd.y + Math.sin(t * 0.55 + sd.ph) * 0.9,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.4 + sd.ph) * 0.16,
        sd.rot + t * 0.16 * speed,
        Math.sin(t * 0.45 + sd.ph) * 0.12,
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
