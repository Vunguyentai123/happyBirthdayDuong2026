import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette } from './config'
import { makeDreamEnvTexture } from './textures'

// Môi trường phản chiếu + sương mù + đèn màu. Tất cả đều chuyển màu mượt theo
// palette của màn hiện tại.
export function Atmosphere({ palette }: { palette: Palette }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  const pointA = useRef<THREE.PointLight>(null!)
  const pointB = useRef<THREE.PointLight>(null!)
  const rim = useRef<THREE.DirectionalLight>(null!)
  const target = useMemo(() => new THREE.Color(), [])

  const fog = useMemo(
    () => new THREE.Fog(new THREE.Color(palette.mid), 22, 58),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Môi trường pastel cho các vật liệu bóng / iridescent.
  useEffect(() => {
    const src = makeDreamEnvTexture()
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromEquirectangular(src)
    pmrem.dispose()
    src.dispose()

    const prevEnv = scene.environment
    const prevIntensity = scene.environmentIntensity
    scene.environment = rt.texture
    scene.environmentIntensity = 0.75

    return () => {
      if (scene.environment === rt.texture) {
        scene.environment = prevEnv
        scene.environmentIntensity = prevIntensity
      }
      rt.dispose()
    }
  }, [gl, scene])

  useEffect(() => {
    const prev = scene.fog
    scene.fog = fog
    return () => {
      if (scene.fog === fog) scene.fog = prev
    }
  }, [scene, fog])

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.06)
    const blend = 1 - Math.exp(-2.4 * step)

    pointA.current?.color.lerp(target.set(palette.accent), blend)
    pointB.current?.color.lerp(target.set(palette.accent2), blend)
    rim.current?.color.lerp(target.set(palette.accent2), blend)
    fog.color.lerp(target.set(palette.mid), blend)
  })

  return (
    <>
      <pointLight
        ref={pointA}
        position={[-8, 5, 2]}
        color={palette.accent}
        intensity={24}
        distance={42}
        decay={2}
      />
      <pointLight
        ref={pointB}
        position={[8, -2, 4]}
        color={palette.accent2}
        intensity={20}
        distance={42}
        decay={2}
      />
      <directionalLight
        ref={rim}
        position={[-6, 9, -12]}
        intensity={0.55}
        color={palette.accent2}
      />
    </>
  )
}
