import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeCupcakeGeometries } from '../geometry/cupcake'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 11
const WRAPPER_COLORS = ['#FFB3C8', '#9ADBC4', '#C8B8FF', '#FFD98A', '#A9C8F0']
const FROSTING_COLORS = ['#FFF4E0', '#FFD9E8', '#E8FFF6', '#F3E8FF', '#FFF7D6']
const LAYOUT = { zMin: -20, zMax: -7, sMin: 0.95, sMax: 1.55, edgeBias: 0.7 }

// Cupcake: vỏ giấy pastel, kem xoắn, cherry đỏ.
export function Cupcakes({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const wrapperRef = useRef<THREE.InstancedMesh>(null!)
  const frostingRef = useRef<THREE.InstancedMesh>(null!)
  const cherryRef = useRef<THREE.InstancedMesh>(null!)
  const stemRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeCupcakeGeometries(), [])

  const wrapperMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.52,
        metalness: 0.02,
        flatShading: true,
      }),
    [],
  )

  const frostingMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.34,
        metalness: 0.01,
        clearcoat: 0.45,
        clearcoatRoughness: 0.3,
        sheen: 0.6,
        sheenColor: new THREE.Color('#FFFFFF'),
        sheenRoughness: 0.4,
      }),
    [],
  )

  const cherryMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#E63A5C',
        roughness: 0.16,
        metalness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    [],
  )

  const stemMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4FA96B', roughness: 0.6 }),
    [],
  )

  useInstanceColors(wrapperRef, WRAPPER_COLORS, COUNT)
  useInstanceColors(frostingRef, FROSTING_COLORS, COUNT)

  useFrame(({ clock }) => {
    const wrapper = wrapperRef.current
    const frosting = frostingRef.current
    const cherry = cherryRef.current
    const stem = stemRef.current
    if (!wrapper) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    wrapper.count = n
    if (frosting) frosting.count = n
    if (cherry) cherry.count = n
    if (stem) stem.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      dummy.position.set(
        sd.x + Math.sin(t * 0.35 + sd.ph) * 0.45,
        sd.y + Math.sin(t * 0.6 + sd.ph) * 0.45,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.45 + sd.ph) * 0.1,
        sd.rot + t * 0.28 * speed,
        Math.sin(t * 0.5 + sd.ph) * 0.12,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()

      wrapper.setMatrixAt(k, dummy.matrix)
      frosting?.setMatrixAt(k, dummy.matrix)
      cherry?.setMatrixAt(k, dummy.matrix)
      stem?.setMatrixAt(k, dummy.matrix)
    }

    wrapper.instanceMatrix.needsUpdate = true
    if (frosting) frosting.instanceMatrix.needsUpdate = true
    if (cherry) cherry.instanceMatrix.needsUpdate = true
    if (stem) stem.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh
        ref={wrapperRef}
        args={[geometry.wrapper, wrapperMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={frostingRef}
        args={[geometry.frosting, frostingMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={cherryRef}
        args={[geometry.cherry, cherryMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={stemRef}
        args={[geometry.stem, stemMaterial, COUNT]}
        frustumCulled={false}
      />
    </>
  )
}
