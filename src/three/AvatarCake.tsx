import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { content } from '../data/content'
import {
  makeBlueberryTexture,
  makeCakeSurfaceTexture,
  makeCandleTexture,
  makeFrostingNormalTexture,
  makeFrostingTexture,
  makeGlowTexture,
  makeMarbleTexture,
  makeMomongaFaceTexture,
  makeMousseBumpTexture,
  makePartyHatTexture,
  makeShadowTexture,
  makeStrawberryTexture,
  makeTierMessageTexture,
  makeUsagiFaceTexture,
  type FaceBox,
} from './textures'

export const BOARD = 3.4
export const BOARD_H = 0.18
const BODY_H = 1.0
const BODY_R = 1.02
const HEAD_R = 1.18
const HEAD_SY = 0.92
const HEAD_CY = 1.78
const HEAD_HY = HEAD_R * HEAD_SY
const TAU = Math.PI * 2
const DEG = Math.PI / 180

// Tầng bánh dưới: rộng, thấp, có gờ kem và dòng chữ chocolate ở mặt trước.
const TIER_R = 1.4
const TIER_H = 0.48
const TIER_TOP = BOARD_H + TIER_H
const CAKE_LIFT = TIER_H

// vành kem quanh chân bánh + dải kem ở cổ (chỗ 2 tầng gặp nhau)
const BASE_RING_R = 1.005
const BASE_RING_Y = BOARD_H + 0.09
const COLLAR_R = 0.9
const COLLAR_Y = 1.0
const COLLAR_GAP = 0.62 // nửa góc trước chừa cho chiếc nơ

const CREAM = '#FFFCF5'
const BUTTER = '#F7D99B'
const PIPING = '#FFFFFF'
const INNER_EAR = '#FFB0C6'
const BLUE = '#6B9CE8'
const PINK = '#FF9EC2'
const MINT = '#63C48D'
const LEAF = '#4FA96B'
const STEM = '#3F8F57'
const GOLD = '#C9A25D'
const CONTACT = [0.52, 0.36, 0.28] // màu bóng tiếp xúc (nâu ấm)

const SPRINKLE_COLORS = ['#FF8FB1', '#7FC9F5', '#FFD34D', '#7BE0B0', '#FFFFFF', '#FF9E7A', '#C0A8F5']
const MACARON_COLORS = ['#F3AFC3', '#C8E0AF', '#D4BFEA', '#F3D98F']
const CANDLE_COLORS = ['#F29DB6', '#F3CD77', '#9BD2C0', '#CDB2E8', '#F3E2CB']

// Nến đặt trên tầng dưới, so le với dâu tây để không che mặt bánh.
const CANDLES = [
  { a: 55, h: 0.46 },
  { a: 120, h: 0.54 },
  { a: 185, h: 0.4 },
  { a: 250, h: 0.5 },
  { a: 315, h: 0.43 },
]
const CANDLE_R = 1.24

// Thân Momonga: trụ bo đáy + bo vai, hơi phình ở giữa (dáng bánh bao)
function bodyRadius(t: number): number {
  const rb = 0.36
  const rt = 0.62
  let r: number
  if (t < rb) r = BODY_R - rb + Math.sqrt(Math.max(0, rb * rb - (rb - t) * (rb - t)))
  else if (t > BODY_H - rt) r = BODY_R - rt + Math.sqrt(Math.max(0, rt * rt - (t - (BODY_H - rt)) * (t - (BODY_H - rt))))
  else r = BODY_R
  return r + 0.032 * Math.sin((t / BODY_H) * Math.PI)
}

function headRadius(y: number): number {
  const k = (y - HEAD_CY) / HEAD_HY
  return HEAD_R * Math.sqrt(Math.max(0, 1 - k * k))
}

// Vùng dán mặt: y0..y1 (toạ độ bánh) và nửa góc ngang phiHalf.
const MOMONGA_FACE: FaceBox = { y0: 0.36, y1: 0.96, phiHalf: 0.64, radius: (y) => bodyRadius(y - BOARD_H) }
const USAGI_FACE: FaceBox = { y0: 1.42, y1: 2.16, phiHalf: 0.7, radius: headRadius }

// Đầu Usagi: khối cầu hơi dẹt dọc, dựng bằng lathe để kín cả 2 cực.
function makeHeadGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  const N = 30
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + (i / N) * Math.PI
    pts.push(new THREE.Vector2(HEAD_R * Math.cos(a), HEAD_CY + HEAD_HY * Math.sin(a)))
  }
  return new THREE.LatheGeometry(pts, 64)
}

// Thân Momonga: kín đáy bằng đĩa mỏng nằm trong lòng bìa (khỏi hở ruột khi soi góc thấp).
function makeBodyGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, BOARD_H)]
  const N = 40
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * BODY_H
    pts.push(new THREE.Vector2(bodyRadius(t), BOARD_H + t))
  }
  return new THREE.LatheGeometry(pts, 64)
}

// Miếng dán mặt: một phần mặt thân bánh, nới ra 0.012 để nổi hẳn trên bề mặt.
function facePatch(radius: (y: number) => number, box: FaceBox): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= 18; i++) {
    const y = box.y0 + ((box.y1 - box.y0) * i) / 18
    pts.push(new THREE.Vector2(radius(y) + 0.012, y))
  }
  return new THREE.LatheGeometry(pts, 48, -box.phiHalf, box.phiHalf * 2)
}

// Mâm bánh bằng đá: đế thấp, lòng mâm phẳng, vành hơi cong lên.
function makePlateGeometry(): THREE.LatheGeometry {
  const profile: Array<[number, number]> = [
    [0, 0.015], [0.74, 0.015], [0.8, 0.03], [0.82, 0.08],
    [1.32, 0.08], [1.45, 0.095], [1.56, 0.108], [1.64, 0.135],
    [1.67, 0.158], [1.65, 0.172], [1.58, 0.18], [0, 0.18],
  ]
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 96)
}

// Tầng bánh dưới: thân trụ bo góc, hơi phình rất nhẹ ở giữa.
function makeTierGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
  const N = 34
  const edge = 0.07
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * TIER_H
    let r: number
    if (t < edge) r = TIER_R - edge + Math.sqrt(Math.max(0, edge * edge - (edge - t) * (edge - t)))
    else if (t > TIER_H - edge) {
      const k = t - (TIER_H - edge)
      r = TIER_R - edge + Math.sqrt(Math.max(0, edge * edge - k * k))
    } else r = TIER_R + 0.008 * Math.sin((t / TIER_H) * Math.PI)
    pts.push(new THREE.Vector2(r, t))
  }
  pts.push(new THREE.Vector2(0, TIER_H))
  return new THREE.LatheGeometry(pts, 96)
}

// Dâu tây: lathe cao 1, bán kính lớn nhất 0.35 — nhân theo cỡ từng quả.
function makeBerryGeometry(): THREE.LatheGeometry {
  // dáng dâu thật: chóp nhọn ở đáy, nở rộng dần và vai tròn ở trên, nơi gắn đài lá
  const P: Array<[number, number]> = [
    [0.0, 0.0], [0.06, 0.04], [0.125, 0.1], [0.19, 0.2], [0.25, 0.33],
    [0.3, 0.47], [0.335, 0.61], [0.35, 0.75], [0.348, 0.86], [0.315, 0.93],
    [0.235, 0.972], [0.12, 0.993], [0.0, 1.0],
  ]
  return new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), 40)
}

// Lá bạc hà: shape lá dẹt, xoay nằm ngang để đặt lên bìa (dày theo trục Y).
function makeLeafGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.09, 0.075, 0.19, 0.07, 0.27, 0)
  s.bezierCurveTo(0.19, -0.07, 0.09, -0.075, 0, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.013, bevelEnabled: false, curveSegments: 8 })
  g.rotateX(-Math.PI / 2)
  return g
}

// Vành bóng tiếp xúc quanh chân bánh. Alpha để trong vertex color (đậm ở mép
// trong, tan dần ra ngoài) nên không phụ thuộc hướng uv của lathe.
function makeContactRingGeometry(inner: number, outer: number): THREE.LatheGeometry {
  const g = new THREE.LatheGeometry(
    [inner, (inner + outer) / 2, outer].map((r) => new THREE.Vector2(r, 0)),
    64,
  )
  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 4)
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i))
    const t = THREE.MathUtils.clamp((r - inner) / (outer - inner), 0, 1)
    col[i * 4] = CONTACT[0]
    col[i * 4 + 1] = CONTACT[1]
    col[i * 4 + 2] = CONTACT[2]
    col[i * 4 + 3] = (1 - t) ** 1.5 * 0.45
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 4))
  return g
}

// Ngọn lửa nến: giọt nước xoay tròn, chóp nhọn.
function makeFlameGeometry(): THREE.LatheGeometry {
  const P: Array<[number, number]> = [
    [0, 0], [0.013, 0.012], [0.03, 0.05], [0.038, 0.1],
    [0.031, 0.15], [0.018, 0.2], [0.007, 0.24], [0, 0.265],
  ]
  return new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), 18)
}

// Cánh nơ xanh: giọt dẹt bắt từ tâm ra, chóp ngoài bo tròn.
const BOW_WING: Array<[number, number]> = [
  [0.0, 0.0], [0.075, 0.04], [0.125, 0.10], [0.156, 0.175], [0.169, 0.27],
  [0.16, 0.36], [0.129, 0.43], [0.078, 0.48], [0.0, 0.5],
]

// Bố cục hoa quả trên mặt tầng dưới: a = góc (độ, 0° là mặt trước), r = bán
// kính, s = cỡ, tilt = ngả vào thân bánh (rad), spin = tự xoay (rad).
interface Piece {
  a: number
  r: number
  s: number
  tilt?: number
  spin?: number
  lift?: number
}

const BERRIES: Piece[] = [
  { a: 15, r: 1.24, s: 0.34, tilt: 0.13, spin: 0.6 },
  { a: 85, r: 1.26, s: 0.31, tilt: 0.17, spin: 2.1 },
  { a: 145, r: 1.23, s: 0.36, tilt: 0.12, spin: 3.4 },
  { a: 215, r: 1.25, s: 0.32, tilt: 0.15, spin: 4.9 },
  { a: 285, r: 1.24, s: 0.35, tilt: 0.14, spin: 5.7 },
]

const BLUEBERRIES: Piece[] = [
  { a: 32, r: 1.1, s: 0.06 },
  { a: 68, r: 1.12, s: 0.055 },
  { a: 104, r: 1.1, s: 0.061 },
  { a: 174, r: 1.13, s: 0.052 },
  { a: 236, r: 1.1, s: 0.058 },
  { a: 306, r: 1.12, s: 0.055 },
]

const MINTS: Piece[] = [
  { a: 8, r: 1.2, s: 1.05, spin: 0.1, lift: 0.24 },
  { a: 138, r: 1.18, s: 1.15, spin: -0.5, lift: 0.3 },
  { a: 224, r: 1.21, s: 0.95, spin: 0.6, lift: 0.2 },
  { a: 296, r: 1.18, s: 1.1, spin: -0.3, lift: 0.26 },
]

const MACARONS = [82, 158, 234, 310]

function useCakeAssets() {
  return useMemo(() => {
    const mousse = makeMousseBumpTexture()
    mousse.repeat.set(5, 5)
    const surface = makeCakeSurfaceTexture()
    surface.repeat.set(3, 2)
    const frosting = makeFrostingTexture()
    frosting.repeat.set(12, 2)
    const frostingNormal = makeFrostingNormalTexture()
    frostingNormal.repeat.set(12, 2)
    const marble = makeMarbleTexture()
    const berryTex = makeStrawberryTexture()
    berryTex.repeat.set(2, 1)
    const blueberryTex = makeBlueberryTexture()
    const candleTex = makeCandleTexture()
    const glowTex = makeGlowTexture()
    const shadowTex = makeShadowTexture()
    const messageTex = makeTierMessageTexture(content.nickname, content.age)
    const faceM = makeMomongaFaceTexture(false, MOMONGA_FACE)
    const faceU = makeUsagiFaceTexture(false, USAGI_FACE)
    const hatTex = makePartyHatTexture()

    const disposable: Array<{ dispose: () => void }> = [
      mousse, surface, frosting, frostingNormal, marble, berryTex, blueberryTex,
      candleTex, glowTex, shadowTex, messageTex, faceM, faceU, hatTex,
    ]

    const geo = {
      plate: makePlateGeometry(),
      plateRim: new THREE.TorusGeometry(1.625, 0.017, 8, 96),
      tier: makeTierGeometry(),
      tierRim: new THREE.TorusGeometry(1.402, 0.0075, 8, 96),
      body: makeBodyGeometry(),
      head: makeHeadGeometry(),
      patchMomonga: facePatch((y) => bodyRadius(y - BOARD_H), MOMONGA_FACE),
      patchUsagi: facePatch(headRadius, USAGI_FACE),
      ear: new THREE.SphereGeometry(0.5, 28, 20),
      inner: new THREE.SphereGeometry(0.5, 24, 18),
      hat: new THREE.ConeGeometry(0.215, 0.55, 30, 1, false),
      hatRim: new THREE.TorusGeometry(0.215, 0.022, 10, 28),
      pom: new THREE.SphereGeometry(0.075, 16, 12),
      wing: new THREE.LatheGeometry(BOW_WING.map(([r, y]) => new THREE.Vector2(r, y)), 20),
      knot: new THREE.SphereGeometry(0.125, 20, 14),
      pearl: new THREE.SphereGeometry(1, 18, 14),
      berry: makeBerryGeometry(),
      calyx: new THREE.ConeGeometry(1, 1, 6, 1, false),
      stem: new THREE.CylinderGeometry(1, 1, 1, 6),
      leaf: makeLeafGeometry(),
      sprinkle: new THREE.CapsuleGeometry(0.019, 0.055, 3, 8),
      disc: new THREE.CircleGeometry(1, 20),
      contactRing: makeContactRingGeometry(0.68, 1.34),
      tierContact: makeContactRingGeometry(1.33, 1.55),
      candleBody: new THREE.CylinderGeometry(0.04, 0.047, 1, 16),
      candleHolder: new THREE.CylinderGeometry(0.067, 0.085, 0.055, 20),
      candleRim: new THREE.TorusGeometry(0.069, 0.008, 6, 20),
      wick: new THREE.CylinderGeometry(0.0045, 0.0035, 0.04, 6),
      flameOuter: makeFlameGeometry(),
      flameCore: makeFlameGeometry(),
      macaronShell: new THREE.SphereGeometry(1, 20, 12),
      macaronFill: new THREE.CylinderGeometry(1, 1, 1, 24),
      goldFlake: new THREE.CircleGeometry(1, 3),
      message: new THREE.CylinderGeometry(TIER_R + 0.012, TIER_R + 0.012, 0.28, 48, 1, true, -0.44, 0.88),
    }
    disposable.push(...Object.values(geo))

    const mats = {
      plate: new THREE.MeshPhysicalMaterial({
        color: '#FFFCF7', map: marble, roughness: 0.26, metalness: 0.02,
        clearcoat: 0.4, clearcoatRoughness: 0.22, envMapIntensity: 0.7,
      }),
      gold: new THREE.MeshPhysicalMaterial({
        color: GOLD, metalness: 1, roughness: 0.25, envMapIntensity: 1.35,
        clearcoat: 0.25, clearcoatRoughness: 0.22,
      }),
      // tầng dưới: kem phết có rãnh dọc + chữ chocolate
      tier: new THREE.MeshPhysicalMaterial({
        color: '#FDF0E2', map: surface, roughness: 0.62, roughnessMap: mousse,
        bumpMap: frosting, bumpScale: 0.008,
        normalMap: frostingNormal, normalScale: new THREE.Vector2(0.16, 0.05),
        clearcoat: 0.16, clearcoatRoughness: 0.5, specularIntensity: 0.55,
        envMapIntensity: 0.5,
      }),
      // kem sữa (Momonga): mousse trắng ngà — lì, hạt li ti, glaze mỏng nên sáng
      cream: new THREE.MeshPhysicalMaterial({
        color: CREAM, map: surface, roughness: 0.66, roughnessMap: mousse,
        bumpMap: mousse, bumpScale: 0.0035,
        clearcoat: 0.14, clearcoatRoughness: 0.55, specularIntensity: 0.55,
        envMapIntensity: 0.5,
      }),
      // hạt kem bắt viền: trắng hơn, hơi bóng hơn kem thân bánh
      piping: new THREE.MeshPhysicalMaterial({
        color: PIPING, roughness: 0.5, roughnessMap: mousse, bumpMap: mousse, bumpScale: 0.0025,
        clearcoat: 0.24, clearcoatRoughness: 0.45, specularIntensity: 0.62,
        envMapIntensity: 0.58,
      }),
      // bơ vàng (Usagi): kem bơ tươi — cùng chất mousse, hơi ấm và sáng hơn
      butter: new THREE.MeshPhysicalMaterial({
        color: BUTTER, map: surface, roughness: 0.62, roughnessMap: mousse,
        bumpMap: mousse, bumpScale: 0.003,
        clearcoat: 0.16, clearcoatRoughness: 0.5, specularIntensity: 0.55,
        envMapIntensity: 0.52,
      }),
      inner: new THREE.MeshStandardMaterial({ color: INNER_EAR, roughness: 0.66 }),
      faceMomonga: new THREE.MeshStandardMaterial({
        map: faceM, transparent: true, depthWrite: false, roughness: 0.55,
        polygonOffset: true, polygonOffsetFactor: -1, envMapIntensity: 0.3,
      }),
      faceUsagi: new THREE.MeshStandardMaterial({
        map: faceU, transparent: true, depthWrite: false, roughness: 0.55,
        polygonOffset: true, polygonOffsetFactor: -1, envMapIntensity: 0.3,
      }),
      message: new THREE.MeshStandardMaterial({
        map: messageTex, transparent: true, depthWrite: false, roughness: 0.48,
        polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.25,
      }),
      bow: new THREE.MeshPhysicalMaterial({
        color: BLUE, roughness: 0.62, sheen: 0.25, sheenColor: '#CFE0FF', sheenRoughness: 0.9,
        specularIntensity: 0.5, envMapIntensity: 0.4,
      }),
      hat: new THREE.MeshPhysicalMaterial({
        map: hatTex, roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.5, envMapIntensity: 0.4,
      }),
      pink: new THREE.MeshStandardMaterial({ color: PINK, roughness: 0.55, envMapIntensity: 0.35 }),
      berry: new THREE.MeshPhysicalMaterial({
        map: berryTex, bumpMap: berryTex, bumpScale: 0.004,
        roughness: 0.34, clearcoat: 0.36, clearcoatRoughness: 0.28,
        specularIntensity: 0.82, envMapIntensity: 0.62,
      }),
      blueberry: new THREE.MeshPhysicalMaterial({
        map: blueberryTex, bumpMap: blueberryTex, bumpScale: 0.002,
        roughness: 0.54, clearcoat: 0.12, clearcoatRoughness: 0.6,
        specularIntensity: 0.5, envMapIntensity: 0.45,
      }),
      mint: new THREE.MeshPhysicalMaterial({
        color: MINT, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5,
        specularIntensity: 0.6, envMapIntensity: 0.45,
      }),
      leaf: new THREE.MeshStandardMaterial({ color: LEAF, roughness: 0.55, envMapIntensity: 0.35 }),
      stem: new THREE.MeshStandardMaterial({ color: STEM, roughness: 0.6, envMapIntensity: 0.3 }),
      sprinkle: new THREE.MeshPhysicalMaterial({
        roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.7,
      }),
      contact: new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1,
      }),
      contactDot: new THREE.MeshBasicMaterial({
        map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2,
      }),
      wax: CANDLE_COLORS.map((color) => new THREE.MeshPhysicalMaterial({
        color, map: candleTex, roughness: 0.48, clearcoat: 0.28, clearcoatRoughness: 0.32,
        specularIntensity: 0.55, envMapIntensity: 0.4,
      })),
      wick: new THREE.MeshStandardMaterial({ color: '#4A3B33', roughness: 0.9 }),
      flameOuter: new THREE.MeshBasicMaterial({
        color: '#FF7A1F', transparent: true, opacity: 0.92, depthWrite: false,
        side: THREE.DoubleSide,
      }),
      flameCore: new THREE.MeshBasicMaterial({
        color: '#FFE9A3', transparent: true, opacity: 0.92, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }),
      glow: new THREE.SpriteMaterial({
        map: glowTex, color: '#FFC677', transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0.46,
      }),
      smoke: new THREE.SpriteMaterial({
        map: glowTex, color: '#8B7A70', transparent: true, depthWrite: false, opacity: 0,
      }),
      macaron: MACARON_COLORS.map((color) => new THREE.MeshPhysicalMaterial({
        color, roughness: 0.68, bumpMap: mousse, bumpScale: 0.002,
        clearcoat: 0.08, clearcoatRoughness: 0.6, envMapIntensity: 0.35,
      })),
      macaronFill: new THREE.MeshPhysicalMaterial({
        color: '#FFF6E4', roughness: 0.52, clearcoat: 0.18, clearcoatRoughness: 0.4,
        envMapIntensity: 0.4,
      }),
      goldFlake: new THREE.MeshPhysicalMaterial({
        color: GOLD, metalness: 1, roughness: 0.17, envMapIntensity: 1.4,
        side: THREE.DoubleSide,
      }),
    }
    disposable.push(...Object.values(mats).flat())

    // ---- bố cục chi tiết quay vòng quanh bánh ----
    const dummy = new THREE.Object3D()
    let seed = 9301
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    const place = (a: number, radius: number, y: number, s: number, tiltIn = 0, spin = 0): THREE.Matrix4 => {
      dummy.position.set(Math.sin(a) * radius, y, Math.cos(a) * radius)
      dummy.rotation.set(-tiltIn, a + spin, 0, 'YXZ')
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      return dummy.matrix.clone()
    }

    // vành kem bắt viền quanh chân Momonga (nằm trên mặt tầng dưới)
    const baseBorder: THREE.Matrix4[] = []
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TAU
      const s = 0.095 * (0.9 + rnd() * 0.18)
      dummy.position.set(Math.sin(a) * BASE_RING_R, BASE_RING_Y, Math.cos(a) * BASE_RING_R)
      dummy.rotation.set(0, a, 0, 'XYZ')
      dummy.scale.set(s, s * 0.94, s)
      dummy.updateMatrix()
      baseBorder.push(dummy.matrix.clone())
    }

    // dải kem hạt ở cổ, chừa cung trước cho chiếc nơ
    const collar: THREE.Matrix4[] = []
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TAU
      if (Math.cos(a) > Math.cos(COLLAR_GAP)) continue
      const s = 0.085 * (0.92 + rnd() * 0.16)
      dummy.position.set(Math.sin(a) * COLLAR_R, COLLAR_Y, Math.cos(a) * COLLAR_R)
      dummy.rotation.set(0, a, 0, 'XYZ')
      dummy.scale.set(s, s * 0.96, s)
      dummy.updateMatrix()
      collar.push(dummy.matrix.clone())
    }

    // viền hạt kem quanh chân tầng dưới, nơi kem gặp mâm đá
    const tierBeads: THREE.Matrix4[] = []
    for (let i = 0; i < 52; i++) {
      const a = (i / 52) * TAU
      const s = 0.035 * (0.9 + rnd() * 0.22)
      dummy.position.set(Math.sin(a) * 1.4, BOARD_H + 0.048, Math.cos(a) * 1.4)
      dummy.rotation.set(0, a, 0, 'XYZ')
      dummy.scale.set(s, s * 0.9, s)
      dummy.updateMatrix()
      tierBeads.push(dummy.matrix.clone())
    }

    const berry: THREE.Matrix4[] = []
    const calyx: THREE.Matrix4[] = []
    const stem: THREE.Matrix4[] = []
    const shadowDisc: THREE.Matrix4[] = []
    const disc = (a: number, radius: number, s: number) => {
      dummy.position.set(Math.sin(a) * radius, BOARD_H + 0.008, Math.cos(a) * radius)
      dummy.rotation.set(-Math.PI / 2, 0, 0, 'XYZ')
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      shadowDisc.push(dummy.matrix.clone())
    }
    const local = (y: number, sx: number, sy: number, tilt = 0): THREE.Matrix4 =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(0, y, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, rnd() * TAU, 0)),
        new THREE.Vector3(sx, sy, sx),
      )

    for (const p of BERRIES) {
      const a = p.a * DEG
      const base = place(a, p.r, BOARD_H + 0.01, p.s, p.tilt ?? 0.14, p.spin ?? 0)
      berry.push(base)
      calyx.push(base.clone().multiply(local(1.0, 0.32, 0.06, 0.08)))
      stem.push(base.clone().multiply(local(1.17, 0.032, 0.11, 0.22)))
      disc(a, p.r, p.s * 0.48)
    }

    const blueberry = BLUEBERRIES.map((p) => {
      const a = p.a * DEG
      disc(a, p.r, p.s * 1.7)
      return place(a, p.r, BOARD_H + p.s, p.s, 0, rnd() * TAU)
    })

    const mint: THREE.Matrix4[] = []
    for (const p of MINTS) {
      const a = p.a * DEG
      dummy.position.set(Math.sin(a) * p.r, BOARD_H + 0.02, Math.cos(a) * p.r)
      dummy.rotation.set(0, a + Math.PI / 2 + (p.spin ?? 0), -(p.lift ?? 0.22), 'YZX')
      dummy.scale.setScalar(p.s)
      dummy.updateMatrix()
      mint.push(dummy.matrix.clone())
    }
    // thêm 3 lá nhỏ quanh núm từng quả dâu cho khỏi giống quả bóng trang trí
    for (let i = 0; i < BERRIES.length; i++) {
      for (let j = 0; j < 3; j++) {
        mint.push(berry[i].clone().multiply(local(1.0, 0.27, 0.27, 0.07)))
      }
    }

    // hạt đường rắc trên mặt tầng dưới
    const sprinkle: THREE.Matrix4[] = []
    const sprinkleColor: THREE.Color[] = []
    const taken: Array<[number, number, number]> = [
      ...BERRIES.map((p): [number, number, number] => [Math.sin(p.a * DEG) * p.r, Math.cos(p.a * DEG) * p.r, 0.15 ** 2]),
      ...BLUEBERRIES.map((p): [number, number, number] => [Math.sin(p.a * DEG) * p.r, Math.cos(p.a * DEG) * p.r, 0.11 ** 2]),
      ...MINTS.map((p): [number, number, number] => [Math.sin(p.a * DEG) * p.r, Math.cos(p.a * DEG) * p.r, 0.15 ** 2]),
      ...CANDLES.map((p): [number, number, number] => [Math.sin(p.a * DEG) * CANDLE_R, Math.cos(p.a * DEG) * CANDLE_R, 0.1 ** 2]),
    ]
    for (let i = 0; i < 22; i++) {
      let ok = false
      let x = 0
      let z = 0
      for (let t = 0; t < 30 && !ok; t++) {
        const a = rnd() * TAU
        const rr = 1.06 + rnd() * 0.24
        x = Math.sin(a) * rr
        z = Math.cos(a) * rr
        if (Math.abs(x) > 1.3 || Math.abs(z) > 1.3) continue
        ok = taken.every(([tx, tz, d2]) => (tx - x) ** 2 + (tz - z) ** 2 > d2)
      }
      if (!ok) continue
      taken.push([x, z, 0.07 ** 2])
      const s = 0.85 + rnd() * 0.45
      dummy.position.set(x, BOARD_H + 0.021 * s, z)
      dummy.rotation.set(Math.PI / 2, rnd() * TAU, -0.2 + rnd() * 0.4, 'YXZ')
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      sprinkle.push(dummy.matrix.clone())
      sprinkleColor.push(new THREE.Color(SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]))
    }

    // lá vàng edible rải trên mặt kem
    const goldFlake: THREE.Matrix4[] = []
    for (let i = 0; i < 18; i++) {
      const a = rnd() * TAU
      const r = 0.92 + rnd() * 0.32
      dummy.position.set(Math.sin(a) * r, TIER_TOP + 0.006, Math.cos(a) * r)
      dummy.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.4, rnd() * TAU, rnd() * TAU, 'XYZ')
      const s = 0.018 + rnd() * 0.022
      dummy.scale.set(s, s * (0.7 + rnd() * 0.6), s)
      dummy.updateMatrix()
      goldFlake.push(dummy.matrix.clone())
    }

    const layout = {
      baseBorder, collar, tierBeads, berry, calyx, stem,
      blueberry, mint, sprinkle, sprinkleColor, shadowDisc, goldFlake,
    }

    return { geo, mats, layout, disposable }
  }, [])
}

type CakeAssets = ReturnType<typeof useCakeAssets>

// Cùng một hình + một vật liệu lặp nhiều chỗ -> 1 draw call thay vì N.
function Instances({
  geometry,
  material,
  matrices,
  colors,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  matrices: THREE.Matrix4[]
  colors?: THREE.Color[]
}) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    colors?.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [matrices, colors])
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} frustumCulled={false} />
}

// Tai: vỏ vàng (ellipsoid) + lòng hồng dẹt nhô ra mặt trước
function Ear({ assets, side }: { assets: CakeAssets; side: 1 | -1 }) {
  const { geo, mats } = assets
  const bx = side * 0.38
  const rz = 0.06
  const by = HEAD_CY + HEAD_HY * Math.sqrt(Math.max(0, 1 - (Math.sqrt(bx * bx + rz * rz) / HEAD_R) ** 2))
  const tilt = -side * 0.18
  const ax = Math.sin(0.18) * side
  const ay = Math.cos(0.18)
  return (
    <group position={[bx + ax * 0.29, by + ay * 0.29, -rz]} rotation={[-0.05, 0, tilt]}>
      <mesh geometry={geo.ear} material={mats.butter} scale={[0.46, 1.02, 0.4]} />
      <mesh geometry={geo.inner} material={mats.inner} position={[0, 0.08, 0.135]} scale={[0.256, 0.63, 0.15]} />
    </group>
  )
}

function Bow({ assets }: { assets: CakeAssets }) {
  const { geo, mats } = assets
  return (
    <group position={[0, 1.03, 0.87]}>
      {([-1, 1] as const).map((side) => (
        <group key={side} rotation={[0, side * 0.3, -side * (Math.PI / 2 + 0.22)]}>
          <mesh geometry={geo.wing} material={mats.bow} scale={[1, 1, 0.62]} />
        </group>
      ))}
      <mesh geometry={geo.knot} material={mats.bow} scale={[1, 1.12, 0.92]} position={[0, 0, 0.05]} />
    </group>
  )
}

function PartyHat({ assets }: { assets: CakeAssets }) {
  const { geo, mats } = assets
  return (
    <group position={[0.55, 2.64, 0.34]} rotation={[0.26, 0, -0.36]}>
      <mesh geometry={geo.hat} material={mats.hat} position={[0, 0.275, 0]} />
      <mesh geometry={geo.hatRim} material={mats.pink} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geo.pom} material={mats.pink} position={[0, 0.59, 0]} />
    </group>
  )
}

// Nến thật: thân sáp, đế vàng, bấc, lửa nhấp nháy + quầng sáng. Khi bánh đã
// được ước, lửa tắt dần và một làn khói mảnh bay lên.
function CakeCandles({ assets, lit }: { assets: CakeAssets; lit: boolean }) {
  const { geo, mats } = assets
  const flames = useRef<Array<THREE.Group | null>>([])
  const glows = useRef<Array<THREE.Sprite | null>>([])
  const smokes = useRef<Array<THREE.Sprite | null>>([])
  const light = useRef<THREE.PointLight>(null!)
  const snuffedAt = useRef(-1)

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    const step = Math.min(dt, 0.05)
    if (!lit && snuffedAt.current < 0) snuffedAt.current = t
    if (lit) snuffedAt.current = -1

    flames.current.forEach((flame, i) => {
      if (!flame) return
      const fx = lit ? 0.7 * (1 + Math.sin(t * 11 + i * 1.7) * 0.12) : 0
      const fy = lit ? 0.68 * (1 + Math.sin(t * 17 + i * 0.9) * 0.16) : 0
      flame.scale.x = THREE.MathUtils.damp(flame.scale.x, fx, lit ? 14 : 9, step)
      flame.scale.z = THREE.MathUtils.damp(flame.scale.z, fx, lit ? 14 : 9, step)
      flame.scale.y = THREE.MathUtils.damp(flame.scale.y, fy, lit ? 14 : 9, step)
      flame.rotation.y = t * 1.6 + i
      flame.visible = flame.scale.y > 0.015
    })

    // quầng sáng và khói dùng chung vật liệu nên chỉ cần cập nhật opacity một lần
    mats.glow.opacity = lit ? 0.3 + Math.sin(t * 13) * 0.05 : 0
    glows.current.forEach((glow) => {
      if (glow) glow.visible = lit
    })

    const smokeT = snuffedAt.current >= 0 ? t - snuffedAt.current : 0
    const smokeLife = Math.min(1, smokeT / 2.6)
    mats.smoke.opacity = smokeT > 0 && smokeLife < 1 ? (1 - smokeLife) * 0.28 : 0
    smokes.current.forEach((smoke, i) => {
      if (!smoke) return
      smoke.visible = smokeT > 0 && smokeLife < 1
      smoke.position.y = CANDLES[i].h + 0.1 + smokeLife * 0.38
      smoke.position.x = Math.sin(t * 1.8 + i * 2.1) * 0.018 * smokeLife
      smoke.position.z = Math.cos(t * 1.5 + i * 1.3) * 0.014 * smokeLife
      const s = 0.12 + smokeLife * 0.17
      smoke.scale.set(s, s, 1)
    })

    if (light.current) {
      const target = lit ? 1.08 + Math.sin(t * 12.4) * 0.14 + Math.sin(t * 6.9) * 0.08 : 0
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, target, 6, step)
    }
  })

  return (
    <group>
      <pointLight
        ref={light}
        position={[0, TIER_TOP + 0.62, 0.62]}
        color="#FFC17B"
        intensity={1.15}
        distance={4.2}
        decay={2}
      />
      {CANDLES.map((c, i) => {
        const a = c.a * DEG
        return (
          <group
            key={c.a}
            position={[Math.sin(a) * CANDLE_R, TIER_TOP + 0.006, Math.cos(a) * CANDLE_R]}
            rotation={[0, a, 0]}
          >
            <mesh
              geometry={geo.disc}
              material={mats.contactDot}
              position={[0, 0.002, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[0.15, 0.15, 0.15]}
            />
            <mesh geometry={geo.candleHolder} material={mats.gold} position={[0, 0.028, 0]} />
            <mesh geometry={geo.candleRim} material={mats.gold} position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh
              geometry={geo.candleBody}
              material={mats.wax[i % mats.wax.length]}
              position={[0, 0.05 + c.h / 2, 0]}
              scale={[1, c.h, 1]}
            />
            <mesh geometry={geo.wick} material={mats.wick} position={[0, 0.045 + c.h + 0.02, 0]} />
            <group
              ref={(el) => { flames.current[i] = el }}
              position={[0, 0.05 + c.h + 0.035, 0]}
            >
              <mesh geometry={geo.flameOuter} material={mats.flameOuter} />
              <mesh geometry={geo.flameCore} material={mats.flameCore} scale={[0.55, 0.64, 0.55]} />
            </group>
            <sprite
              ref={(el) => { glows.current[i] = el }}
              position={[0, 0.05 + c.h + 0.15, 0]}
              scale={[0.19, 0.19, 1]}
            >
              <primitive object={mats.glow} attach="material" />
            </sprite>
            <sprite
              ref={(el) => { smokes.current[i] = el }}
              position={[0, 0.05 + c.h + 0.1, 0]}
              scale={[0.12, 0.12, 1]}
              visible={false}
            >
              <primitive object={mats.smoke} attach="material" />
            </sprite>
          </group>
        )
      })}
    </group>
  )
}

// Macaron đặt trên vành mâm đá: hai vỏ hạnh nhân kẹp kem, có màu pastel.
function CakeMacarons({ assets }: { assets: CakeAssets }) {
  const { geo, mats } = assets
  return (
    <group>
      {MACARONS.map((angle, i) => {
        const a = angle * DEG
        return (
          <group key={angle} position={[Math.sin(a) * 1.51, BOARD_H + 0.004, Math.cos(a) * 1.51]} rotation={[0, a, 0]}>
            <mesh geometry={geo.macaronShell} material={mats.macaron[i % mats.macaron.length]} position={[0, 0.047, 0]} scale={[0.115, 0.05, 0.115]} />
            <mesh geometry={geo.macaronFill} material={mats.macaronFill} position={[0, 0.093, 0]} scale={[0.085, 0.024, 0.085]} />
            <mesh geometry={geo.macaronShell} material={mats.macaron[i % mats.macaron.length]} position={[0, 0.139, 0]} scale={[0.11, 0.047, 0.11]} />
          </group>
        )
      })}
    </group>
  )
}

export function AvatarCake({ lit = true }: { lit?: boolean }) {
  const assets = useCakeAssets()
  const { geo, mats, layout, disposable } = assets

  useEffect(() => () => disposable.forEach((d) => d.dispose()), [disposable])

  return (
    <group>
      {/* mâm đá cẩm thạch + viền vàng */}
      <mesh geometry={geo.plate} material={mats.plate} />
      <mesh geometry={geo.plateRim} material={mats.gold} position={[0, BOARD_H - 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* tầng bánh dưới, viền hạt kem, giọt kem, dòng chữ chocolate */}
      <mesh geometry={geo.tier} material={mats.tier} position={[0, BOARD_H, 0]} />
      <mesh geometry={geo.tierRim} material={mats.gold} position={[0, TIER_TOP - 0.052, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Instances geometry={geo.pearl} material={mats.piping} matrices={layout.tierBeads} />
      <mesh geometry={geo.message} material={mats.message} position={[0, BOARD_H + TIER_H * 0.52, 0]} />
      <mesh geometry={geo.tierContact} material={mats.contact} position={[0, BOARD_H + 0.004, 0]} />

      <CakeCandles assets={assets} lit={lit} />
      <CakeMacarons assets={assets} />

      {/* lá vàng edible trên mặt kem */}
      <Instances geometry={geo.goldFlake} material={mats.goldFlake} matrices={layout.goldFlake} />

      {/* nhân vật kem: nâng lên đúng mặt tầng dưới */}
      <group position={[0, CAKE_LIFT, 0]}>
        <mesh geometry={geo.contactRing} material={mats.contact} position={[0, BOARD_H + 0.004, 0]} />
        <Instances geometry={geo.disc} material={mats.contactDot} matrices={layout.shadowDisc} />

        <mesh geometry={geo.body} material={mats.cream} />
        <mesh geometry={geo.patchMomonga} material={mats.faceMomonga} />
        <Bow assets={assets} />
        <Instances geometry={geo.pearl} material={mats.piping} matrices={layout.baseBorder} />
        <Instances geometry={geo.pearl} material={mats.piping} matrices={layout.collar} />

        <Instances geometry={geo.berry} material={mats.berry} matrices={layout.berry} />
        <Instances geometry={geo.calyx} material={mats.leaf} matrices={layout.calyx} />
        <Instances geometry={geo.stem} material={mats.stem} matrices={layout.stem} />
        <Instances geometry={geo.pearl} material={mats.blueberry} matrices={layout.blueberry} />
        <Instances geometry={geo.leaf} material={mats.mint} matrices={layout.mint} />
        <Instances geometry={geo.sprinkle} material={mats.sprinkle} matrices={layout.sprinkle} colors={layout.sprinkleColor} />

        <mesh geometry={geo.head} material={mats.butter} />
        <mesh geometry={geo.patchUsagi} material={mats.faceUsagi} />
        <Ear assets={assets} side={-1} />
        <Ear assets={assets} side={1} />
        <PartyHat assets={assets} />
      </group>
    </group>
  )
}
