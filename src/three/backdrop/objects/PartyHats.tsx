import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makePartyHatTexture } from '../../textures'
import { makePartyHatGeometries } from '../geometry/hat'
import { useSeeds } from '../layout'

const COUNT = 9
const LAYOUT = { zMin: -20, zMax: -7, sMin: 0.9, sMax: 1.45, edgeBias: 0.7 }

// Mũ sinh nhật có sọc, vành và pom-pom trắng.
export function PartyHats({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const coneRef = useRef<THREE.InstancedMesh>(null!)
  const trimRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makePartyHatGeometries(), [])
  const hatTexture = useMemo(() => makePartyHatTexture(), [])

  const coneMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: hatTexture,
        roughness: 0.5,
        metalness: 0.02,
        sheen: 0.5,
        sheenColor: new THREE.Color('#FFFFFF'),
        side: THREE.DoubleSide,
      }),
    [hatTexture],
  )

  const trimMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFF2F6',
        roughness: 0.35,
        metalness: 0.02,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25,
      }),
    [],
  )

  useEffect(() => () => hatTexture.dispose(), [hatTexture])

  useFrame(({ clock }) => {
    const cone = coneRef.current
    const trim = trimRef.current
    if (!cone) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    cone.count = n
    if (trim) trim.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      dummy.position.set(
        sd.x + Math.sin(t * 0.3 + sd.ph) * 0.45,
        sd.y + Math.sin(t * 0.55 + sd.ph) * 0.5,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.42 + sd.ph) * 0.13,
        sd.rot + t * 0.2 * speed,
        Math.sin(t * 0.5 + sd.ph) * 0.14,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()

      cone.setMatrixAt(k, dummy.matrix)
      trim?.setMatrixAt(k, dummy.matrix)
    }

    cone.instanceMatrix.needsUpdate = true
    if (trim) trim.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={coneRef}
        args={[geometry.cone, coneMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={trimRef}
        args={[geometry.trim, trimMaterial, COUNT]}
        frustumCulled={false}
      />
    </>
  )
}
