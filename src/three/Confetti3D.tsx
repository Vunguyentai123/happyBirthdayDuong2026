import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Fireworks3D } from './Fireworks3D'

// Confetti 3D + pháo hoa cho màn bánh / màn quà.
//
// Bản cũ nhìn như giấy trắng dán lên màn hình vì 2 lỗi:
//  1. Gán màu trong useMemo — useMemo chạy TRƯỚC khi mesh mount nên
//     ref.current còn null, `setColorAt` không bao giờ chạy ⇒ mọi mảnh trắng trơn;
//  2. MeshBasicMaterial + PlaneGeometry dày 0 ⇒ không có sáng/tối, nghiêng là mất.
//
// Bản này dùng 4 lớp InstancedMesh CÓ đổ sáng theo đèn:
//  • chip     — mảnh giấy dày (box mỏng, flatShading): lật nghiêng thấy cả bề dày
//               và từng mặt sáng tối khác nhau;
//  • ribbon   — dải giấy cong (plane uốn sóng, hơi bóng): ánh sáng chạy dọc nếp gấp;
//  • star     — sao giấy kim tuyến, xoay lấp lánh giữa đám giấy;
//  • streamer — dải dài uốn sóng, rơi chậm như streamer trong tiệc.
// Kèm <Fireworks3D> nổ so le trên không (tia sáng + đuôi + vòng xung kích).
// Vật lý giấy: bùng nổ từ trên đầu bánh rồi rơi xoáy (trọng lực + gió nhẹ + tự lật),
// rơi khỏi khung thì tái sinh thành mưa giấy ở VÀNH quanh bánh (bán kính > 1,5)
// nên không cắt vào bánh và không che mặt cười. Sau cơn bùng nổ chỉ ~1/2 số mảnh
// quay lại làm mưa cho khỏi rối mắt.

const TAU = Math.PI * 2
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

// Lấy đúng bảng màu hạt đường trên bánh cho hài hoà; thêm vàng kim + trắng ngà
// để đám giấy có điểm nhấn lấp lánh.
const COLORS = [
  '#FF8FB1', '#7FC9F5', '#FFD34D', '#7BE0B0', '#FF9E7A',
  '#C0A8F5', '#FFE79A', '#FF6F91', '#F5C518', '#FFF8E7',
]
const STAR_COLORS = ['#FFD76A', '#FFF3C4', '#F5B942', '#FFFFFF', '#FFB347']
const STREAMER_COLORS = [
  '#FF8FB1', '#7FC9F5', '#FFD34D', '#7BE0B0', '#C0A8F5', '#FF9E7A', '#FFF8E7',
]

const N_CHIP = 170
const N_RIBBON = 90
const N_STAR = 44
const N_STREAMER = 16
const GRAVITY = 2.3
const DRAG = 0.85 // lực cản không khí (1/s) -> vận tốc rơi ~2,7 đơn vị/s

interface Piece {
  pos: THREE.Vector3
  vel: THREE.Vector3
  q: THREE.Quaternion
  axis: THREE.Vector3
  spin: number
  sway: number
  size: number
  color: string
  rain: boolean // còn quay lại làm mưa giấy không
  dead: boolean
}

function makePiece(palette: string[] = COLORS): Piece {
  return {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    axis: new THREE.Vector3(0, 1, 0),
    spin: 0,
    sway: 0,
    size: 1,
    color: palette[Math.floor(Math.random() * palette.length)],
    rain: true,
    dead: false,
  }
}

function initSpin(p: Piece) {
  p.axis.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize()
  p.spin = rnd(2.5, 8.5) * (Math.random() < 0.5 ? -1 : 1)
  p.sway = Math.random() * TAU
  p.size = rnd(0.8, 1.55)
  p.q.setFromAxisAngle(p.axis, Math.random() * TAU)
  p.dead = false
}

// Bùng nổ: ngay trên đầu bánh, bắn chếch lên + toả ra thật nhanh để mảnh không
// rơi ngược lại xuống xuyên qua đầu bánh
function spawnBurst(p: Piece) {
  const a = Math.random() * TAU
  const r = Math.random() * 1.15
  p.pos.set(Math.cos(a) * r, rnd(1.25, 1.85), Math.sin(a) * r * 0.7)
  p.vel.set(Math.cos(a) * rnd(1.4, 2.9), rnd(2.4, 4.4), Math.sin(a) * rnd(1, 2))
  p.rain = Math.random() < 0.5
  initSpin(p)
}

// Mưa giấy: rơi từ trên cao xuống theo vành quanh bánh. Bán kính trong 1.8 >
// trụ loại trừ 1.25 + biên độ gió ~0.5 nên gần như không bao giờ chạm vào bánh.
function spawnRain(p: Piece) {
  const a = Math.random() * TAU
  const r = rnd(1.8, 3.9)
  p.pos.set(Math.cos(a) * r, rnd(3.2, 4.8), Math.sin(a) * r * 0.9)
  p.vel.set(rnd(-0.3, 0.3), rnd(-1, -0.35), rnd(-0.25, 0.25))
  initSpin(p)
}

// Streamer dài: thả từ trên cao, rơi chậm và lượn như dải lụa. Không bắn từ
// tâm bánh để tránh quấn vào mặt nhân vật.
function spawnStreamer(p: Piece) {
  const a = Math.random() * TAU
  const r = rnd(1.7, 3.2)
  p.pos.set(Math.cos(a) * r, rnd(2.8, 4.2), Math.sin(a) * r * 0.85)
  p.vel.set(rnd(-0.4, 0.4), rnd(-1.2, -0.45), rnd(-0.3, 0.3))
  p.rain = true
  initSpin(p)
  p.size = rnd(0.9, 1.25)
}

// Một lớp confetti: gán màu khi mount + cập nhật ma trận mỗi frame.
function useConfettiLayer(
  burst: boolean,
  count: number,
  pieces: Piece[],
  spawn: (p: Piece) => void = spawnBurst,
) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmpQ = useMemo(() => new THREE.Quaternion(), [])
  const tmpAxis = useMemo(() => new THREE.Vector3(), [])
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    const m = mesh.current
    if (m) {
      // gán màu ở EFFECT (sau khi mesh mount) — đây là chỗ bản cũ làm sai
      for (let i = 0; i < count; i++) m.setColorAt(i, tmpColor.set(pieces[i].color))
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    if (burst) pieces.forEach(spawn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst, count, pieces, spawn])

  useFrame(({ clock: c }, dt) => {
    const m = mesh.current
    if (!m || !burst) return
    const t = c.getElapsedTime()
    const step = Math.min(dt, 0.05)
    const drag = Math.max(0, 1 - DRAG * step)
    m.count = count

    for (let i = 0; i < count; i++) {
      const p = pieces[i]
      if (p.dead) continue

      p.vel.y -= GRAVITY * step
      p.vel.multiplyScalar(drag)
      // giấy rơi không rơi thẳng: gió nhẹ + rung theo pha riêng của từng mảnh
      p.vel.x += Math.sin(t * 2.1 + p.sway) * 0.7 * step
      p.vel.z += Math.cos(t * 1.7 + p.sway * 1.4) * 0.55 * step
      p.pos.addScaledVector(p.vel, step)

      // lưới an toàn: mảnh nào trôi vào vùng bánh (trụ cao bằng cả bánh) thì đẩy
      // ra theo phương ngang — mạnh hơn trọng lực nên không bao giờ "dính" vào bánh
      const d = Math.hypot(p.pos.x, p.pos.z)
      if (d > 0.001 && d < 1.25 && p.pos.y > -1.3 && p.pos.y < 1.75) {
        const k = (1.25 - d) * 10
        p.vel.x += (p.pos.x / d) * k * step
        p.vel.z += (p.pos.z / d) * k * step
      }

      // tự lật quanh trục riêng + rung nhẹ -> nhìn rõ bề dày mảnh giấy
      tmpQ.setFromAxisAngle(p.axis, p.spin * step)
      p.q.multiply(tmpQ)
      tmpAxis.set(Math.sin(p.sway), Math.cos(p.sway * 0.7), Math.sin(p.sway * 1.3)).normalize()
      tmpQ.setFromAxisAngle(tmpAxis, Math.sin(t * 3.4 + p.sway) * 1.2 * step)
      p.q.multiply(tmpQ)

      // rơi khỏi khung -> mưa giấy, hoặc nằm im ngoài màn hình cho đỡ rối
      if (p.pos.y < -3.7 || Math.abs(p.pos.x) > 4.6 || Math.abs(p.pos.z) > 4.6) {
        if (p.rain) spawnRain(p)
        else p.dead = true
      }

      dummy.position.copy(p.pos)
      dummy.quaternion.copy(p.q)
      dummy.scale.setScalar(p.size)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return mesh
}

// Sao 5 cánh mỏng, thu nhỏ còn ~0.14 đơn vị để lẫn trong giấy mà vẫn nhận ra.
function makeStarGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  const R = 0.5
  const r = 0.21
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = (i / 10) * TAU - Math.PI / 2
    const x = Math.cos(a) * rad
    const y = Math.sin(a) * rad
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: false,
    curveSegments: 1,
  })
  g.center()
  g.scale(0.14, 0.14, 1)
  return g
}

// Dải streamer dài 0.55, uốn sóng nhẹ theo 2 trục để khi xoay không bị phẳng lì.
function makeStreamerGeometry(): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(0.045, 0.55, 1, 10)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    const v = y / 0.55 + 0.5
    p.setX(i, p.getX(i) + Math.sin(v * Math.PI * 2.1) * 0.025)
    p.setZ(i, Math.sin(v * Math.PI * 3.2) * 0.035)
  }
  g.computeVertexNormals()
  return g
}

export function Confetti3D({ burst = false, quality = 1 }: { burst?: boolean; quality?: number }) {
  const chipCount = Math.max(20, Math.floor(N_CHIP * quality))
  const ribCount = Math.max(12, Math.floor(N_RIBBON * quality))
  const starCount = Math.max(12, Math.floor(N_STAR * quality))
  const streamerCount = Math.max(8, Math.floor(N_STREAMER * quality))

  const parts = useMemo(() => {
    // mảnh giấy dày: có bề dày nên lật nghiêng vẫn thấy khối
    const chip = new THREE.BoxGeometry(0.1, 0.15, 0.013)
    // dải cong: plane uốn theo sóng -> ánh sáng chạy dọc nếp gấp, nhìn ra 3D
    const ribbon = new THREE.PlaneGeometry(0.06, 0.2, 1, 6)
    const rp = ribbon.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < rp.count; i++) {
      rp.setZ(i, Math.sin((rp.getY(i) / 0.2 + 0.5) * Math.PI * 1.6) * 0.03)
    }
    ribbon.computeVertexNormals()
    const star = makeStarGeometry()
    const streamer = makeStreamerGeometry()

    const chipMat = new THREE.MeshStandardMaterial({ roughness: 0.52, metalness: 0.08, flatShading: true })
    const ribbonMat = new THREE.MeshStandardMaterial({
      roughness: 0.24, metalness: 0.16, side: THREE.DoubleSide,
    })
    // kim tuyến: hơi kim loại + emissive ấm để sao không bị tối khi quay lưng
    const starMat = new THREE.MeshStandardMaterial({
      roughness: 0.26,
      metalness: 0.5,
      emissive: new THREE.Color('#B07A22'),
      emissiveIntensity: 0.22,
      flatShading: true,
    })
    const streamerMat = new THREE.MeshStandardMaterial({
      roughness: 0.32, metalness: 0.12, side: THREE.DoubleSide,
    })
    return { chip, ribbon, star, streamer, chipMat, ribbonMat, starMat, streamerMat }
  }, [])

  useEffect(
    () => () => {
      parts.chip.dispose()
      parts.ribbon.dispose()
      parts.star.dispose()
      parts.streamer.dispose()
      parts.chipMat.dispose()
      parts.ribbonMat.dispose()
      parts.starMat.dispose()
      parts.streamerMat.dispose()
    },
    [parts],
  )

  const chips = useMemo(() => Array.from({ length: N_CHIP }, () => makePiece()), [])
  const ribbons = useMemo(() => Array.from({ length: N_RIBBON }, () => makePiece()), [])
  const stars = useMemo(() => Array.from({ length: N_STAR }, () => makePiece(STAR_COLORS)), [])
  const streamers = useMemo(
    () => Array.from({ length: N_STREAMER }, () => makePiece(STREAMER_COLORS)),
    [],
  )
  const chipMesh = useConfettiLayer(burst, chipCount, chips)
  const ribMesh = useConfettiLayer(burst, ribCount, ribbons)
  const starMesh = useConfettiLayer(burst, starCount, stars)
  const streamerMesh = useConfettiLayer(burst, streamerCount, streamers, spawnStreamer)

  if (!burst) return null
  return (
    <>
      <Fireworks3D quality={quality} />
      <instancedMesh ref={chipMesh} args={[parts.chip, parts.chipMat, N_CHIP]} count={0} frustumCulled={false} />
      <instancedMesh ref={ribMesh} args={[parts.ribbon, parts.ribbonMat, N_RIBBON]} count={0} frustumCulled={false} />
      <instancedMesh ref={starMesh} args={[parts.star, parts.starMat, N_STAR]} count={0} frustumCulled={false} />
      <instancedMesh
        ref={streamerMesh}
        args={[parts.streamer, parts.streamerMat, N_STREAMER]}
        count={0}
        frustumCulled={false}
      />
    </>
  )
}
