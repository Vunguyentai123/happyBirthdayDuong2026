import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { AvatarCake } from './AvatarCake'
import { Confetti3D } from './Confetti3D'
import { makeEnvTexture, makeShadowTexture } from './textures'

// Màn bánh: bánh Chiikawa (AvatarCake) + xoay 360° + nhún thở. Sau khi "thổi
// điều ước": nến tắt + confetti; bánh giữ nguyên mặt/nhân vật (không đổi sang
// bản cười nhắm mắt), không nảy, không đổi đèn và không tự quay.
//
// Xoay 360°: nghe pointer ở window (không phụ thuộc raycast trúng mesh, mà
// layer UI vốn che mất canvas) nên kéo ngang ở đâu cũng xoay được — trừ khi
// bắt đầu ngay trên nút bấm. Kéo dọc vẫn để trang cuộn bình thường.
// Bánh CHỈ xoay khi khách đang kéo: không tự quay, không trôi quán tính —
// thả tay là dừng đúng góc đang có. Chiều dọc vẫn "nhún thở" nhẹ
// (BREATHE — đặt 0 để đứng im hẳn).
// Bánh tự đo khoảng trống thật giữa lời nhắn và khay điều khiển để vừa cả
// bề ngang lẫn chiều cao (điện thoại hẹp / màn thấp vẫn không bị cắt).

const DRAG_GAIN = 0.012 // rad trên mỗi px kéo ngang
const BREATHE = 0.03 // biên độ nhún thở theo chiều dọc (0 = đứng im)

// Ước lượng ban đầu trước khi đo hộp bao thật của AvatarCake. Dùng để bố cục
// không bị nhảy quá nhiều trong frame đầu.
const CAKE_BOX = {
  minX: -1.7, maxX: 1.7,
  minY: 0, maxY: 4.9,
  minZ: -1.7, maxZ: 1.7,
}
const STAGE_PAD = 12

export function CakeScene3D({ quality = 1 }: { quality?: number }) {
  const wishBlown = useSceneStore((s) => s.wishBlown)
  const group = useRef<THREE.Group>(null!)
  const avatar = useRef<THREE.Group>(null!)
  const shadowMesh = useRef<THREE.Mesh>(null!)
  const spin = useRef({ rot: 0, dragging: false })
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const [cakeBox, setCakeBox] = useState(CAKE_BOX)
  const [stage, setStage] = useState<{ top: number; height: number } | null>(null)

  // Đo hộp bao THẬT của AvatarCake trong hệ toạ độ cục bộ. Nhờ vậy bánh được
  // canh giữa đúng khoảng trống giữa lời nhắn và khay điều khiển ở mọi màn.
  useLayoutEffect(() => {
    const g = group.current
    const a = avatar.current
    if (!g || !a) return
    const savedPosition = g.position.clone()
    const savedScale = g.scale.clone()
    const savedRotation = g.rotation.clone()
    g.position.set(0, 0, 0)
    g.rotation.set(0, 0, 0)
    g.scale.setScalar(1)
    g.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(a)
    g.position.copy(savedPosition)
    g.scale.copy(savedScale)
    g.rotation.copy(savedRotation)
    g.updateMatrixWorld(true)
    if (box.isEmpty()) return
    const height = box.max.y - box.min.y
    const width = box.max.x - box.min.x
    if (height < 2 || width < 2) return
    setCakeBox({
      minX: box.min.x, maxX: box.max.x,
      minY: box.min.y, maxY: box.max.y,
      minZ: box.min.z, maxZ: box.max.z,
    })
  }, [])

  // Theo dõi vùng sân khấu (giữa phần đầu và dock). Khi lời nhắn xuống dòng,
  // dock đổi chiều cao hoặc xoay màn hình, bánh tự canh lại thay vì đè lên giao diện.
  useEffect(() => {
    let frame = 0
    let timerA = 0
    let timerB = 0
    let poll = 0
    let polls = 0
    const el = document.querySelector('.candle-stage')
    const measure = () => {
      const node = el ?? document.querySelector('.candle-stage')
      if (!node) return
      const r = node.getBoundingClientRect()
      if (r.height < 80) return
      const height = Math.max(80, r.height)
      setStage((prev) => {
        if (prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.height - height) < 1) return prev
        return { top: r.top, height }
      })
    }
    const keepMeasuring = () => {
      measure()
      if (++polls < 20) poll = window.setTimeout(keepMeasuring, 140)
    }
    measure()
    frame = requestAnimationFrame(measure)
    timerA = window.setTimeout(measure, 320)
    timerB = window.setTimeout(measure, 760)
    poll = window.setTimeout(keepMeasuring, 140)
    const observer = new ResizeObserver(measure)
    if (el) observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timerA)
      clearTimeout(timerB)
      clearTimeout(poll)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [wishBlown, size.width, size.height])

  const stageTop = stage?.top ?? size.height * 0.22
  const stageHeight = stage?.height ?? size.height * 0.56
  const usableHeight = Math.max(190, stageHeight - STAGE_PAD * 2)
  const widthCapPx = Math.min(size.width * 0.9, 760)

  // Camera của cả trang hơi cúi xuống (lookAt gốc toạ độ), nên không thể quy
  // đổi screen -> world bằng một hệ số tuyến tính đơn giản. Chiếu đúng các
  // điểm biên của hộp bao qua camera: đỉnh cao nhất, mép trước của đĩa bánh
  // (z lớn nhất) và hai bên. Nhờ vậy đĩa không bao giờ chui xuống dưới dock.
  const probe = useMemo(() => new THREE.Vector3(), [])
  const projectPoint = (fitValue: number, localX: number, localY: number, localZ: number, groupY: number) => {
    probe.set(localX * fitValue, groupY + localY * fitValue, localZ * fitValue)
    probe.project(camera)
    return {
      x: (probe.x * 0.5 + 0.5) * size.width,
      y: (-probe.y * 0.5 + 0.5) * size.height,
    }
  }

  camera.updateMatrixWorld()
  const centerX = (cakeBox.minX + cakeBox.maxX) / 2
  const centerY = (cakeBox.minY + cakeBox.maxY) / 2
  const centerZ = (cakeBox.minZ + cakeBox.maxZ) / 2
  const screenBounds = (fitValue: number, groupY: number) => {
    const top = projectPoint(fitValue, centerX, cakeBox.maxY, centerZ, groupY).y
    const bottom = projectPoint(fitValue, centerX, cakeBox.minY, cakeBox.maxZ, groupY).y
    const left = projectPoint(fitValue, cakeBox.minX, centerY, centerZ, groupY).x
    const right = projectPoint(fitValue, cakeBox.maxX, centerY, centerZ, groupY).x
    return { top, bottom, left, right, height: Math.abs(bottom - top), width: Math.abs(right - left) }
  }

  const unitBounds = screenBounds(1, -1.3)
  const projectedHeightUnit = Math.max(1, unitBounds.height)
  const projectedWidthUnit = Math.max(1, unitBounds.width)
  const fitByHeight = usableHeight / projectedHeightUnit
  const fitByWidth = widthCapPx / projectedWidthUnit
  const fit = THREE.MathUtils.clamp(Math.min(fitByHeight, fitByWidth), 0.55, 1.05)

  const stageCenter = stageTop + stageHeight / 2
  // Chiếu trung điểm của silhouette ở hai cao độ rồi nội suy ra vị trí đặt
  // chân bánh. Lặp hai lần để trung điểm hình chiếu trùng tâm sân khấu.
  const low = -1.75
  const high = -0.6
  const lowMid = (() => {
    const b = screenBounds(fit, low)
    return (b.top + b.bottom) / 2
  })()
  const highMid = (() => {
    const b = screenBounds(fit, high)
    return (b.top + b.bottom) / 2
  })()
  const slope = (highMid - lowMid) / (high - low)
  const safeSlope = Math.abs(slope) < 1e-5 ? -1 : slope
  let baseY = low + (stageCenter - lowMid) / safeSlope
  for (let i = 0; i < 2; i++) {
    const b = screenBounds(fit, baseY)
    const midY = (b.top + b.bottom) / 2
    baseY += (stageCenter - midY) / safeSlope
  }
  baseY = THREE.MathUtils.clamp(baseY, -2.25, -0.4)

  const shadow = useMemo(
    () => new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false }),
    [],
  )
  useEffect(() => () => {
    shadow.map?.dispose()
    shadow.dispose()
  }, [shadow])

  // Kéo ngang để xoay (pointer ở window): bắt đầu ở đâu cũng được, chỉ bỏ qua
  // khi chạm vào nút/ô nhập, và chỉ nhận khi hướng kéo là ngang.
  useEffect(() => {
    const st = spin.current
    let active = false
    let grabbed = false
    let x0 = 0
    let y0 = 0
    let lastX = 0

    const onUi = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('button, a, input, textarea, select, [role="button"], [data-no-cake-drag]')

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (onUi(e.target)) return
      // Chặn bôi đen chữ và kéo-thả khối chữ của trình duyệt. Không có bước
      // này, lần kéo đầu tiên sẽ bôi đen nội dung trang; lần kéo sau trình
      // duyệt hiểu là kéo khối đang chọn -> bắn pointercancel và bánh đứng im.
      e.preventDefault()
      window.getSelection()?.removeAllRanges()
      active = true
      grabbed = false
      x0 = lastX = e.clientX
      y0 = e.clientY
      st.dragging = true
    }
    const onMove = (e: PointerEvent) => {
      if (!active) return
      if (!grabbed) {
        const dxAll = e.clientX - x0
        // chưa rõ hướng kéo, hoặc kéo dọc nhiều hơn -> nhường cho cuộn trang
        if (Math.abs(dxAll) < 7 || Math.abs(dxAll) < Math.abs(e.clientY - y0)) return
        grabbed = true
      }
      // xoay 1:1 theo tay, không tích quán tính -> thả tay là dừng ngay
      st.rot += (e.clientX - lastX) * DRAG_GAIN
      lastX = e.clientX
    }
    const onUp = () => {
      active = false
      grabbed = false
      st.dragging = false
    }
    // Lưới an toàn cho trường hợp trang đang có sẵn vùng chọn từ trước.
    const onDragStart = (e: DragEvent) => {
      if (!onUi(e.target)) e.preventDefault()
    }

    window.addEventListener('pointerdown', onDown, { passive: false })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    window.addEventListener('dragstart', onDragStart)
    window.addEventListener('blur', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('blur', onUp)
    }
  }, [])

  // Môi trường PMREM dựng từ canvas (không tải HDR): bìa sứ, kem, mắt bóng có
  // vệt phản chiếu. Gắn sau frame đầu nên không chặn render.
  useEffect(() => {
    const root = group.current
    if (!root) return
    const src = makeEnvTexture()
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromEquirectangular(src)
    pmrem.dispose()
    src.dispose()
    const seen = new Set<THREE.Material>()
    root.traverse((o) => {
      const m = (o as THREE.Mesh).material
      const list = Array.isArray(m) ? m : [m]
      for (const mat of list) {
        if (!mat || seen.has(mat)) continue
        seen.add(mat)
        if ('envMapIntensity' in mat) {
          const std = mat as THREE.MeshStandardMaterial
          std.envMap = rt.texture
          std.needsUpdate = true
        }
      }
    })
    return () => rt.dispose()
  }, [gl])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const st = spin.current
    const g = group.current
    if (g) {
      // chỉ còn nhún thở nhẹ; sau khi thổi nến bánh giữ nguyên hình dáng/mặt
      g.position.y = baseY + Math.sin(t * 1.1) * BREATHE
      g.rotation.y = st.rot
      g.scale.setScalar(fit)
    }
    if (shadowMesh.current) {
      shadowMesh.current.position.y = baseY + 0.004
      shadowMesh.current.scale.set(fit * 1.7, fit * 1.58, 1)
    }
  })

  return (
    <group>
      {/* đèn riêng cho bánh: key ấm + fill lạnh + rim sau lưng nên xoay tới
          hướng nào bánh cũng tươi, và khối vẫn lên được độ tròn (bớt phẳng) */}
      <ambientLight intensity={0.2} color="#FFF6EA" />
      <directionalLight position={[3.4, 5.2, 4.6]} intensity={0.74} color="#FFF4E0" />
      <directionalLight position={[-4.2, 2.8, -3.4]} intensity={0.4} color="#FFEAF2" />
      <directionalLight position={[-2.8, 1.6, 5.2]} intensity={0.22} color="#EDF3FF" />

      {/* bóng đổ mềm dưới bìa — đứng yên, không nhún theo bánh */}
      <mesh
        ref={shadowMesh}
        position={[0, baseY + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={shadow}
        scale={[fit * 1.7, fit * 1.58, 1]}
      >
        <circleGeometry args={[1.9, 32]} />
      </mesh>

      <group ref={group} position={[0, baseY, 0]} scale={fit}>
        <group ref={avatar}>
          {/* lit = còn nến; mặt nhân vật luôn giữ bản mắt mở, không đổi sau khi thổi */}
          <AvatarCake lit={!wishBlown} />
        </group>
      </group>

      <Confetti3D burst={wishBlown} quality={quality} />
    </group>
  )
}
