import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { makeGiftWrapTexture, makeShadowTexture } from './textures'
import { Confetti3D } from './Confetti3D'

// Hộp quà 3D: bấm để mở (cả mesh lẫn nút DOM đều gọi store).
// Nắp bật lên bằng animation, ánh sáng tỏa ra (sprite phát sáng).
//
// Hộp tự canh vừa khung .gift-stage (đo bằng DOM) để không bao giờ chui xuống
// dưới tấm lời thoại — cùng cách làm với bánh sinh nhật.
// Biên hộp hơi rộng hơn thân hộp thật: hộp xoay nhẹ nên góc gần nhất lấn ra
// ngoài mặt trước, nếu đo đúng mặt phẳng thì hộp sẽ tràn khỏi khung.
const BOX = { minX: -1.02, maxX: 1.02, minY: 0, maxY: 1.55, minZ: -1.02, maxZ: 1.02 }
const STAGE_PAD = 6

export function GiftScene3D({ quality = 1 }: { quality?: number }) {
  const open = useSceneStore((s) => s.giftOpen)
  const setGiftOpen = useSceneStore((s) => s.setGiftOpen)
  const lid = useRef<THREE.Group>(null!)
  const box = useRef<THREE.Group>(null!)
  const { camera, size } = useThree()
  const [stage, setStage] = useState<{ top: number; height: number } | null>(null)

  const wrapTex = useMemo(() => makeGiftWrapTexture(), [])

  const mats = useMemo(
    () => ({
      box: new THREE.MeshStandardMaterial({ map: wrapTex, color: '#FF6E9B', roughness: 0.6 }),
      ribbon: new THREE.MeshStandardMaterial({ color: '#FFCF3D', roughness: 0.45 }),
      lid: new THREE.MeshStandardMaterial({ map: wrapTex, color: '#FF5583', roughness: 0.6 }),
    }),
    [wrapTex],
  )

  const shadow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      shadow.map?.dispose()
      shadow.dispose()
      wrapTex.dispose()
    }
  }, [shadow, wrapTex])

  // Đo khung sân khấu khi hộp còn đóng. Lúc mở, khung thu nhỏ lại để nhường chỗ
  // cho tấm thiệp nên giữ nguyên tỉ lệ đã canh trước đó.
  useEffect(() => {
    if (open) return
    let frame = 0
    const timers: number[] = []
    const measure = () => {
      const node = document.querySelector('.gift-stage')
      if (!node) return
      const r = node.getBoundingClientRect()
      if (r.height < 60) return
      setStage((prev) => {
        if (prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.height - r.height) < 1) return prev
        return { top: r.top, height: r.height }
      })
    }
    measure()
    frame = requestAnimationFrame(measure)
    timers.push(window.setTimeout(measure, 260), window.setTimeout(measure, 700))
    const observer = new ResizeObserver(measure)
    const node = document.querySelector('.gift-stage')
    if (node) observer.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      timers.forEach(clearTimeout)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [open])

  const stageTop = stage?.top ?? size.height * 0.3
  const stageHeight = stage?.height ?? size.height * 0.4
  const usableHeight = Math.max(140, stageHeight - STAGE_PAD * 2)
  const widthCap = Math.min(size.width * 0.78, 400)

  const probe = useMemo(() => new THREE.Vector3(), [])
  const project = (fit: number, x: number, y: number, z: number, groupY: number) => {
    probe.set(x * fit, groupY + y * fit, z * fit)
    probe.project(camera)
    return {
      x: (probe.x * 0.5 + 0.5) * size.width,
      y: (-probe.y * 0.5 + 0.5) * size.height,
    }
  }

  camera.updateMatrixWorld()
  const bounds = (fit: number, groupY: number) => {
    const top = project(fit, 0, BOX.maxY, 0, groupY).y
    const bottom = project(fit, 0, BOX.minY, BOX.maxZ, groupY).y
    const left = project(fit, BOX.minX, (BOX.minY + BOX.maxY) / 2, BOX.maxZ, groupY).x
    const right = project(fit, BOX.maxX, (BOX.minY + BOX.maxY) / 2, BOX.maxZ, groupY).x
    return { top, bottom, height: Math.abs(bottom - top), width: Math.abs(right - left) }
  }

  const unit = bounds(1, 0)
  const fit = THREE.MathUtils.clamp(
    Math.min(usableHeight / Math.max(1, unit.height), widthCap / Math.max(1, unit.width)),
    0.42,
    1.2,
  )

  const stageCenter = stageTop + stageHeight / 2
  const low = -1.5
  const high = -0.3
  const lowMid = (() => {
    const b = bounds(fit, low)
    return (b.top + b.bottom) / 2
  })()
  const highMid = (() => {
    const b = bounds(fit, high)
    return (b.top + b.bottom) / 2
  })()
  const slope = (highMid - lowMid) / (high - low)
  const safeSlope = Math.abs(slope) < 1e-5 ? -1 : slope
  let baseY = low + (stageCenter - lowMid) / safeSlope
  for (let i = 0; i < 2; i++) {
    const b = bounds(fit, baseY)
    const midY = (b.top + b.bottom) / 2
    baseY += (stageCenter - midY) / safeSlope
  }
  baseY = THREE.MathUtils.clamp(baseY, -1.9, 0.2)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (box.current) box.current.rotation.y = Math.sin(t * 0.4) * 0.25
    if (lid.current) {
      // Nắp bật lên rồi thu nhỏ dần: tấm thiệp hiện ra che hộp nên nắp không
      // được bay lên tận tiêu đề.
      const targetY = open ? 0.85 : 0
      const targetR = open ? -0.55 : 0
      const targetS = open ? 0.001 : 1
      lid.current.position.y += (targetY - lid.current.position.y) * 0.1
      lid.current.rotation.z += (targetR - lid.current.rotation.z) * 0.1
      const s = lid.current.scale.x + (targetS - lid.current.scale.x) * 0.14
      lid.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={box} position={[0, baseY, 0]} scale={fit}>
      {/* bóng tiếp xúc mềm dưới hộp */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={shadow}>
        <planeGeometry args={[3.1, 3.1]} />
      </mesh>

      <mesh material={mats.box} position={[0, 0.575, 0]} onClick={() => setGiftOpen(true)}>
        <boxGeometry args={[1.5, 1.15, 1.5]} />
      </mesh>
      {/* nơ dọc/ngang */}
      <mesh material={mats.ribbon} position={[0, 0.59, 0]}>
        <boxGeometry args={[1.56, 1.17, 0.28]} />
      </mesh>
      <mesh material={mats.ribbon} position={[0, 0.59, 0]}>
        <boxGeometry args={[0.28, 1.17, 1.56]} />
      </mesh>

      <group ref={lid} position={[0, 0, 0]}>
        <mesh material={mats.lid} position={[0, 1.27, 0]} onClick={() => setGiftOpen(true)}>
          <boxGeometry args={[1.68, 0.24, 1.68]} />
        </mesh>
        {/* nơ trên nắp: hai vòng ruy băng + nút thắt */}
        <group position={[0, 1.41, 0]}>
          <mesh material={mats.ribbon} position={[-0.24, 0.06, 0]} rotation={[0.3, 0.35, 0.85]}>
            <torusGeometry args={[0.17, 0.062, 8, 18]} />
          </mesh>
          <mesh material={mats.ribbon} position={[0.24, 0.06, 0]} rotation={[0.3, -0.35, -0.85]}>
            <torusGeometry args={[0.17, 0.062, 8, 18]} />
          </mesh>
          <mesh material={mats.lid} position={[0, 0, 0]} scale={[1, 0.9, 1]}>
            <sphereGeometry args={[0.1, 14, 12]} />
          </mesh>
        </group>
      </group>

      {/* ánh sáng tỏa ra */}
      <pointLight position={[0, 2, 1]} intensity={open ? 6 : 1.2} color="#FFE9A8" />
      <Confetti3D burst={open} quality={quality} />
    </group>
  )
}
