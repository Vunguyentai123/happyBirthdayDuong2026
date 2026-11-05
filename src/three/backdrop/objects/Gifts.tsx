import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { makeBowGeometry } from '../geometry/bow'
import { makeGiftGeometries } from '../geometry/gift'
import { useInstanceColors } from '../instancing'
import { useSeeds } from '../layout'

const COUNT = 13
const COLORS = ['#F4739F', '#5FBFA3', '#7FB2F0', '#F0A840', '#B8A0F5', '#FF8FB1']
const LAYOUT = { zMin: -22, zMax: -8, sMin: 0.6, sMax: 1.08, edgeBias: 0.7 }

// Hộp quà có dải ruy băng vàng và nơ ribbon 3D trên nắp.
export function Gifts({ quality, speed }: { quality: number; speed: number }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const seeds = useSeeds(aspect, COUNT, LAYOUT)
  const bodyRef = useRef<THREE.InstancedMesh>(null!)
  const lidRef = useRef<THREE.InstancedMesh>(null!)
  const ribbonRef = useRef<THREE.InstancedMesh>(null!)
  const bowRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geometry = useMemo(
    () => ({ ...makeGiftGeometries(), bow: makeBowGeometry() }),
    [],
  )

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.3,
        metalness: 0.06,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
        sheen: 0.35,
        sheenColor: new THREE.Color('#FFFFFF'),
      }),
    [],
  )

  const lidMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFDF8',
        roughness: 0.25,
        metalness: 0.08,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
      }),
    [],
  )

  const ribbonMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#F5C518',
        roughness: 0.18,
        metalness: 0.78,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
        emissive: new THREE.Color('#F5C518'),
        emissiveIntensity: 0.08,
      }),
    [],
  )

  useInstanceColors(bodyRef, COLORS, COUNT)

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const lid = lidRef.current
    const ribbon = ribbonRef.current
    const bow = bowRef.current
    if (!body) return

    const t = clock.getElapsedTime()
    const n = Math.max(1, Math.floor(COUNT * quality))
    body.count = n
    if (lid) lid.count = n
    if (ribbon) ribbon.count = n
    if (bow) bow.count = n

    for (let k = 0; k < n; k++) {
      const sd = seeds[k]
      const rot = sd.rot + t * 0.24 * speed
      const tilt = Math.sin(t * 0.5 + sd.ph) * 0.07
      const gx = sd.x + Math.sin(t * 0.4 + sd.ph) * 0.7
      const gy = sd.y + Math.sin(t * 0.75 + sd.ph) * 0.5

      dummy.position.set(gx, gy, sd.z)
      dummy.rotation.set(tilt, rot, tilt * 0.6)
      dummy.scale.setScalar(sd.s)
      dummy.updateMatrix()
      body.setMatrixAt(k, dummy.matrix)
      ribbon?.setMatrixAt(k, dummy.matrix)

      if (lid) {
        dummy.position.set(gx, gy + 0.175 * sd.s, sd.z)
        dummy.updateMatrix()
        lid.setMatrixAt(k, dummy.matrix)
      }

      if (bow) {
        dummy.position.set(gx, gy + 0.27 * sd.s, sd.z)
        dummy.rotation.set(tilt - 0.22, rot, tilt * 0.6)
        dummy.scale.setScalar(sd.s * 0.8)
        dummy.updateMatrix()
        bow.setMatrixAt(k, dummy.matrix)
      }
    }

    body.instanceMatrix.needsUpdate = true
    if (lid) lid.instanceMatrix.needsUpdate = true
    if (ribbon) ribbon.instanceMatrix.needsUpdate = true
    if (bow) bow.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={bodyRef} args={[geometry.body, bodyMaterial, COUNT]} frustumCulled={false} />
      <instancedMesh ref={lidRef} args={[geometry.lid, lidMaterial, COUNT]} frustumCulled={false} />
      <instancedMesh
        ref={ribbonRef}
        args={[geometry.ribbon, ribbonMaterial, COUNT]}
        frustumCulled={false}
      />
      <instancedMesh ref={bowRef} args={[geometry.bow, ribbonMaterial, COUNT]} frustumCulled={false} />
    </>
  )
}
