import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeEnvelopeGeometries } from '../geometry/envelope'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 10
const COLORS = ['#FFF7EC', '#FFE3EC', '#E8F7FF', '#F3EDFF', '#FFF0D8']
const LAYOUT = { zMin: -19, zMax: -6, sMin: 0.95, sMax: 1.65, edgeBias: 0.7 }

// Thiệp tình yêu có nắp gấp và con dấu tim vàng. Nắp luôn hướng gần về camera
// để nhìn rõ chi tiết.
export function LoveLetters({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const bodyRef = useRef<THREE.InstancedMesh>(null!)
  const flapRef = useRef<THREE.InstancedMesh>(null!)
  const sealRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(() => makeEnvelopeGeometries(), [])

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.7,
        metalness: 0.01,
        sheen: 0.4,
        sheenColor: new THREE.Color('#FFFFFF'),
        sheenRoughness: 0.6,
      }),
    [],
  )

  const flapMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFD9E4',
        roughness: 0.68,
        metalness: 0.01,
        sheen: 0.35,
        sheenColor: new THREE.Color('#FFFFFF'),
        sheenRoughness: 0.6,
      }),
    [],
  )

  const sealMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#F2B544',
        roughness: 0.2,
        metalness: 0.82,
        clearcoat: 0.7,
        clearcoatRoughness: 0.16,
        emissive: new THREE.Color('#F5C518'),
        emissiveIntensity: 0.1,
      }),
    [],
  )

  useInstanceColors(bodyRef, COLORS, COUNT)

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const flap = flapRef.current
    const seal = sealRef.current
    if (!body) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    body.count = n
    if (flap) flap.count = n
    if (seal) seal.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      dummy.position.set(
        sd.x + Math.sin(t * 0.32 + sd.ph) * 0.6,
        sd.y + Math.sin(t * 0.5 + sd.ph) * 0.65,
        sd.z,
      )
      dummy.rotation.set(
        Math.sin(t * 0.4 + sd.ph) * 0.12,
        Math.sin(t * 0.28 * speed + sd.ph) * 0.5,
        Math.sin(t * 0.45 + sd.ph) * 0.08,
      )
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()

      body.setMatrixAt(k, dummy.matrix)
      flap?.setMatrixAt(k, dummy.matrix)
      seal?.setMatrixAt(k, dummy.matrix)
    }

    body.instanceMatrix.needsUpdate = true
    if (flap) flap.instanceMatrix.needsUpdate = true
    if (seal) seal.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={bodyRef} args={[geometry.body, bodyMaterial, COUNT]} frustumCulled={false} />
      <instancedMesh ref={flapRef} args={[geometry.flap, flapMaterial, COUNT]} frustumCulled={false} />
      <instancedMesh ref={sealRef} args={[geometry.seal, sealMaterial, COUNT]} frustumCulled={false} />
    </>
  )
}
