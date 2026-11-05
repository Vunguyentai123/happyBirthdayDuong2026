import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Pháo hoa trên không cho màn bánh / màn quà.
//
// Gồm 4 lớp:
//  • quầng tia (Points + shader additive): hàng trăm hạt phát sáng, quầng mờ
//    màu no, tự lấp lánh và rơi chậm dần;
//  • lõi tia (Points + shader thường): chấm màu đặc + tâm trắng — lớp này giữ
//    cho pháo hoa vẫn rõ trên nền kem sáng, không bị additive làm bạc trắng;
//  • đuôi tia (LineSegments): mỗi hạt kéo một vệt đúng hướng bay, tạo cảm giác
//    tốc độ và nhìn ra hình quả cầu nổ;
//  • chớp + vòng xung kích (Sprite): lóe sáng và vòng sóng loang ra tại tâm nổ.
//
// Vị trí nổ khai báo theo toạ độ màn hình (-1..1) rồi unproject ra thế giới,
// nên điện thoại dọc hay màn hình rộng đều thấy pháo hoa nằm đúng hai bên bánh,
// không bị cắt mất. Quả nổ được hẹn giờ so le ~5 giây, có điệu "liễu rủ" và
// màn kết hai bên; toàn bộ nằm phía sau/trên bánh nên không che mặt nhân vật.
// Hạt dùng pool cố định, không cấp phát bộ nhớ trong mỗi frame.

const TAU = Math.PI * 2
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

const MAX_SPARKS = 1200
const MAX_FX = 10

// Bảng màu pháo hoa: no hơn confetti để nổi trên nền kem sáng, nhưng vẫn hợp
// tông tiệc sinh nhật (vàng kim, hồng, xanh, ngọc lục, san hô).
const PALETTES = [
  ['#FFB000', '#FFE066', '#FF7A00'],
  ['#FF2D6F', '#FF7AA2', '#FFD1DC'],
  ['#2F6BFF', '#7C4DFF', '#C4E5FF'],
  ['#00A86B', '#7BE0B0', '#E5FF8F'],
  ['#FF4D3D', '#FF8A5B', '#FFE0B2'],
]

type BurstKind = 'peony' | 'willow' | 'crackle'

interface BurstSpec {
  at: number
  nx: number // -1..1 theo nửa bề ngang màn hình (0 = giữa)
  ny: number // -1..1 theo nửa chiều cao (0 = giữa)
  z: number // càng lớn càng gần camera
  palette: number
  count: number
  ring: boolean
  kind?: BurstKind
  power?: number
}

// Một màn ~5 giây: hai bên bánh thay phiên nổ, lên dần theo chiều cao rồi màn
// kết hai bên. nx/ny giữ trong khoảng ±0.8 để quả nổ không bị cắt mép.
const SHOW: BurstSpec[] = [
  { at: 0.0, nx: -0.66, ny: 0.36, z: 1.2, palette: 1, count: 95, ring: true },
  { at: 0.22, nx: 0.7, ny: 0.48, z: 1.0, palette: 2, count: 80, ring: true },
  { at: 0.48, nx: -0.8, ny: 0.64, z: 0.5, palette: 0, count: 75, ring: true },
  { at: 0.76, nx: 0.76, ny: 0.32, z: 1.4, palette: 3, count: 85, ring: true },
  { at: 1.1, nx: -0.58, ny: 0.52, z: 1.0, palette: 4, count: 75, ring: true },
  { at: 1.45, nx: 0.62, ny: 0.66, z: 0.7, palette: 1, count: 75, ring: true },
  { at: 1.9, nx: -0.8, ny: 0.3, z: 1.1, palette: 2, count: 80, ring: true },
  { at: 2.3, nx: 0.8, ny: 0.46, z: 0.6, palette: 0, count: 75, ring: true },
  { at: 2.75, nx: -0.64, ny: 0.68, z: 0.8, palette: 3, count: 75, ring: true },
  { at: 3.2, nx: 0.66, ny: 0.3, z: 1.3, palette: 4, count: 85, ring: true },
  { at: 3.7, nx: -0.74, ny: 0.42, z: 0.9, palette: 0, count: 85, ring: true, kind: 'willow' },
  { at: 4.05, nx: 0.74, ny: 0.42, z: 0.9, palette: 1, count: 85, ring: true, kind: 'willow' },
  { at: 4.4, nx: -0.44, ny: 0.58, z: 1.5, palette: 2, count: 90, ring: true, power: 1.15 },
  { at: 4.4, nx: 0.44, ny: 0.58, z: 1.5, palette: 3, count: 90, ring: true, power: 1.15 },
  { at: 4.75, nx: -0.72, ny: 0.5, z: 1.3, palette: 4, count: 95, ring: true, kind: 'willow' },
  { at: 4.75, nx: 0.72, ny: 0.5, z: 1.3, palette: 0, count: 95, ring: true, kind: 'willow' },
]

interface Spark {
  pos: THREE.Vector3
  vel: THREE.Vector3
  color: THREE.Color
  age: number
  life: number
  size: number
  drag: number
  gravity: number
  phase: number
  twinkle: number
  trail: number
  alive: boolean
}

function makeSpark(): Spark {
  return {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    color: new THREE.Color(),
    age: 0,
    life: 0,
    size: 0,
    drag: 0,
    gravity: 0,
    phase: 0,
    twinkle: 0,
    trail: 0.1,
    alive: false,
  }
}

function makeRingTexture(): THREE.CanvasTexture {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S * 0.5)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.56, 'rgba(255,255,255,0)')
  g.addColorStop(0.72, 'rgba(255,255,255,0.92)')
  g.addColorStop(0.84, 'rgba(255,255,255,0.32)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeFlareTexture(): THREE.CanvasTexture {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.12, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.32, 'rgba(255,255,255,0.34)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)

  // hai vệt sáng hình chữ thập -> nhìn như ánh lóe của pháo hoa
  ctx.globalCompositeOperation = 'lighter'
  const h = ctx.createLinearGradient(0, S / 2, S, S / 2)
  h.addColorStop(0, 'rgba(255,255,255,0)')
  h.addColorStop(0.5, 'rgba(255,255,255,0.9)')
  h.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = h
  ctx.fillRect(0, S / 2 - 2, S, 4)
  const v = ctx.createLinearGradient(S / 2, 0, S / 2, S)
  v.addColorStop(0, 'rgba(255,255,255,0)')
  v.addColorStop(0.5, 'rgba(255,255,255,0.9)')
  v.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = v
  ctx.fillRect(S / 2 - 2, 0, 4, S)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const SPARK_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float size = aSize * uPixelRatio * (320.0 / max(1.0, -mv.z));
    gl_PointSize = clamp(size, 1.0, 90.0 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`

// Quầng additive: chỉ vẽ halo, nhường phần lõi cho lớp core phía trên.
const SPARK_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    float halo = smoothstep(0.5, 0.02, d);
    float a = halo * 0.34 * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor * (0.82 + halo * 0.18), a);
    #include <colorspace_fragment>
  }
`

const CORE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float size = aSize * uPixelRatio * (320.0 / max(1.0, -mv.z)) * 0.62;
    gl_PointSize = clamp(size, 1.5, 46.0 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`

// Lõi thường (NormalBlending): chấm màu đặc, tâm trắng -> pháo hoa vẫn rõ
// trên nền kem sáng thay vì bị additive làm bạc trắng cả quả.
const CORE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.4, d);
    float hot = smoothstep(0.14, 0.0, d);
    vec3 col = mix(vColor, vec3(1.0), hot * 0.45);
    gl_FragColor = vec4(col, edge * vAlpha);
    #include <colorspace_fragment>
  }
`

const TRAIL_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const TRAIL_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.004) discard;
    gl_FragColor = vec4(vColor, vAlpha);
    #include <colorspace_fragment>
  }
`

interface FxItem {
  ring: THREE.Sprite
  flash: THREE.Sprite
  ringMat: THREE.SpriteMaterial
  flashMat: THREE.SpriteMaterial
  age: number
  scale: number
  active: boolean
}

export function Fireworks3D({ quality = 1 }: { quality?: number }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const qualityRef = useRef(quality)
  qualityRef.current = quality
  const viewRef = useRef({ aspect: 1 })
  viewRef.current.aspect = size.width / Math.max(1, size.height)

  const sparks = useMemo(() => Array.from({ length: MAX_SPARKS }, makeSpark), [])
  const cursor = useRef(0)
  const fxCursor = useRef(0)
  const startAt = useRef(-1)
  const nextBurst = useRef(0)
  const probe = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  const buffers = useMemo(() => {
    const positions = new Float32Array(MAX_SPARKS * 3)
    const colors = new Float32Array(MAX_SPARKS * 3)
    const sizes = new Float32Array(MAX_SPARKS)
    const alphas = new Float32Array(MAX_SPARKS)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    geo.setDrawRange(0, MAX_SPARKS)

    const trailPositions = new Float32Array(MAX_SPARKS * 2 * 3)
    const trailColors = new Float32Array(MAX_SPARKS * 2 * 3)
    const trailAlphas = new Float32Array(MAX_SPARKS * 2)
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeo.setAttribute('aColor', new THREE.BufferAttribute(trailColors, 3))
    trailGeo.setAttribute('aAlpha', new THREE.BufferAttribute(trailAlphas, 1))

    return {
      geo, trailGeo,
      positions, colors, sizes, alphas,
      trailPositions, trailColors, trailAlphas,
    }
  }, [])

  const materials = useMemo(() => {
    const spark = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: SPARK_VERT,
      fragmentShader: SPARK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    const core = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    })
    const trail = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: TRAIL_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    })
    return { spark, core, trail }
  }, [])

  const fx = useMemo(() => {
    const group = new THREE.Group()
    const ringTex = makeRingTexture()
    const flareTex = makeFlareTexture()
    const items: FxItem[] = Array.from({ length: MAX_FX }, () => {
      const ringMat = new THREE.SpriteMaterial({
        map: ringTex, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.NormalBlending, toneMapped: false,
      })
      const ring = new THREE.Sprite(ringMat)
      ring.visible = false
      group.add(ring)

      const flashMat = new THREE.SpriteMaterial({
        map: flareTex, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false,
      })
      const flash = new THREE.Sprite(flashMat)
      flash.visible = false
      group.add(flash)

      return { ring, flash, ringMat, flashMat, age: 0, scale: 1, active: false }
    })
    return { group, items, textures: [ringTex, flareTex] }
  }, [])

  useEffect(() => () => {
    buffers.geo.dispose()
    buffers.trailGeo.dispose()
    materials.spark.dispose()
    materials.core.dispose()
    materials.trail.dispose()
    for (const item of fx.items) {
      item.ringMat.dispose()
      item.flashMat.dispose()
    }
    for (const tex of fx.textures) tex.dispose()
  }, [buffers, materials, fx])

  const explode = (spec: BurstSpec) => {
    const palette = PALETTES[spec.palette % PALETTES.length]
    const count = Math.max(24, Math.round(spec.count * qualityRef.current))
    const aspect = viewRef.current.aspect

    // Vị trí khai báo theo toạ độ màn hình -> unproject để mọi tỉ lệ màn hình
    // đều đặt quả nổ đúng chỗ, không bị cắt khi điện thoại dọc.
    camera.updateMatrixWorld()
    dir.copy(probe.set(spec.nx, spec.ny, 0.5).unproject(camera)).sub(camera.position).normalize()
    const depth = (spec.z - camera.position.z) / dir.z
    const ox = camera.position.x + dir.x * depth * 0.82
    const oy = camera.position.y + dir.y * depth * 0.86
    const oz = spec.z

    // Màn hẹp thì thu bán kính nổ theo đúng tỉ lệ bề ngang để quả pháo vẫn
    // nằm gọn hai bên bánh, không phình to che mất mặt nhân vật.
    const spread = THREE.MathUtils.clamp(aspect / 1.35, 0.34, 1)
    const power = (spec.power ?? 1) * spread

    for (let i = 0; i < count; i++) {
      const idx = cursor.current
      cursor.current = (cursor.current + 1) % MAX_SPARKS
      const p = sparks[idx]

      // Hướng ngẫu nhiên trên mặt cầu; một phần bị ép dẹt thành vòng để quả nổ
      // có cả tia tỏa đều lẫn vành hoa.
      const u = Math.random() * 2 - 1
      const phi = Math.random() * TAU
      const s = Math.sqrt(1 - u * u)
      let dx = Math.cos(phi) * s
      let dy = u
      let dz = Math.sin(phi) * s
      if (spec.ring && Math.random() < 0.34) {
        const a = Math.random() * TAU
        dx = Math.cos(a)
        dy = Math.sin(a * 2) * 0.16
        dz = Math.sin(a) * 0.62
        const len = Math.hypot(dx, dy, dz) || 1
        dx /= len
        dy /= len
        dz /= len
      }

      const speed = rnd(0.85, 3.2) * power
      p.pos.set(ox + dx * 0.07, oy + dy * 0.07, oz + dz * 0.07)
      p.vel.set(dx * speed, dy * speed + rnd(0.05, 0.45), dz * speed)
      p.age = 0
      p.life = rnd(1.2, 2.15)
      p.size = rnd(0.16, 0.34) * (Math.random() < 0.15 ? 1.45 : 1)
      p.drag = rnd(0.35, 1.0)
      p.gravity = rnd(0.75, 1.35)
      p.phase = Math.random() * TAU
      p.twinkle = rnd(8, 20)
      p.trail = 0.16
      p.alive = true
      p.color.set(palette[Math.floor(Math.random() * palette.length)])

      if (spec.kind === 'willow') {
        // liễu rủ: ít cản, rơi chậm và cong xuống, cháy lâu hơn
        p.life = rnd(2.2, 3.1)
        p.size *= 1.08
        p.drag = rnd(0.14, 0.32)
        p.gravity = rnd(0.5, 0.85)
        p.trail = 0.3
        if (Math.random() < 0.5) p.color.set(palette[0])
      } else if (spec.kind === 'crackle') {
        // nổ lách tách: sống ngắn, nhấp nháy nhanh
        p.life = rnd(0.9, 1.6)
        p.size *= 0.82
        p.twinkle = rnd(18, 34)
        p.trail = 0.13
      } else if (Math.random() < 0.08) {
        // ~8% là tia "sao băng": sống lâu, ít cản, kéo vệt dài hơn hẳn
        p.life = rnd(2.0, 2.55)
        p.size *= 1.2
        p.drag = 0.18
        p.trail = 0.26
      }
    }

    const item = fx.items[fxCursor.current]
    fxCursor.current = (fxCursor.current + 1) % MAX_FX
    item.active = true
    item.age = 0
    item.scale = power
    item.ring.position.set(ox, oy, oz)
    item.flash.position.set(ox, oy, oz)
    item.ringMat.color.set(palette[1] ?? palette[0])
    item.flashMat.color.set(palette[2] ?? palette[0])
    item.ring.visible = true
    item.flash.visible = true
    item.ring.scale.setScalar(0.22 * power)
    item.flash.scale.setScalar(0.38 * power)
  }

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    const step = Math.min(dt, 0.05)
    if (startAt.current < 0) startAt.current = t
    const local = t - startAt.current

    while (nextBurst.current < SHOW.length && local >= SHOW[nextBurst.current].at) {
      explode(SHOW[nextBurst.current])
      nextBurst.current++
    }

    const posAttr = buffers.geo.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = buffers.geo.getAttribute('aColor') as THREE.BufferAttribute
    const sizeAttr = buffers.geo.getAttribute('aSize') as THREE.BufferAttribute
    const alphaAttr = buffers.geo.getAttribute('aAlpha') as THREE.BufferAttribute
    const trailPos = buffers.trailGeo.getAttribute('position') as THREE.BufferAttribute
    const trailCol = buffers.trailGeo.getAttribute('aColor') as THREE.BufferAttribute
    const trailAlpha = buffers.trailGeo.getAttribute('aAlpha') as THREE.BufferAttribute

    for (let i = 0; i < MAX_SPARKS; i++) {
      const p = sparks[i]

      if (p.alive) {
        p.age += step
        if (p.age >= p.life) {
          p.alive = false
        } else {
          const drag = Math.max(0, 1 - p.drag * step)
          p.vel.multiplyScalar(drag)
          p.vel.y -= p.gravity * step
          p.vel.x += Math.sin(t * 2.1 + p.phase) * 0.11 * step
          p.vel.z += Math.cos(t * 1.7 + p.phase) * 0.09 * step
          p.pos.addScaledVector(p.vel, step)
        }
      }

      const base = i * 3
      const trailBase = i * 6
      if (!p.alive) {
        buffers.alphas[i] = 0
        buffers.trailAlphas[i * 2] = 0
        buffers.trailAlphas[i * 2 + 1] = 0
        // vẫn ghi vị trí cuối để line không nhảy về gốc toạ độ
        buffers.trailPositions[trailBase] = p.pos.x
        buffers.trailPositions[trailBase + 1] = p.pos.y
        buffers.trailPositions[trailBase + 2] = p.pos.z
        buffers.trailPositions[trailBase + 3] = p.pos.x
        buffers.trailPositions[trailBase + 4] = p.pos.y
        buffers.trailPositions[trailBase + 5] = p.pos.z
        continue
      }

      const k = p.age / p.life
      const fade = Math.pow(1 - k, 1.45)
      const twinkle = 0.72 + 0.28 * Math.sin(p.age * p.twinkle + p.phase)
      const alpha = fade * twinkle
      const size = p.size * (1 - 0.34 * k)

      buffers.positions[base] = p.pos.x
      buffers.positions[base + 1] = p.pos.y
      buffers.positions[base + 2] = p.pos.z
      buffers.colors[base] = p.color.r
      buffers.colors[base + 1] = p.color.g
      buffers.colors[base + 2] = p.color.b
      buffers.sizes[i] = size
      buffers.alphas[i] = alpha

      // đuôi dài theo hướng bay, đầu sáng và cuối trong suốt
      const tx = p.pos.x - p.vel.x * p.trail
      const ty = p.pos.y - p.vel.y * p.trail
      const tz = p.pos.z - p.vel.z * p.trail
      buffers.trailPositions[trailBase] = p.pos.x
      buffers.trailPositions[trailBase + 1] = p.pos.y
      buffers.trailPositions[trailBase + 2] = p.pos.z
      buffers.trailPositions[trailBase + 3] = tx
      buffers.trailPositions[trailBase + 4] = ty
      buffers.trailPositions[trailBase + 5] = tz
      buffers.trailColors[trailBase] = p.color.r
      buffers.trailColors[trailBase + 1] = p.color.g
      buffers.trailColors[trailBase + 2] = p.color.b
      buffers.trailColors[trailBase + 3] = p.color.r
      buffers.trailColors[trailBase + 4] = p.color.g
      buffers.trailColors[trailBase + 5] = p.color.b
      buffers.trailAlphas[i * 2] = alpha * 0.92
      buffers.trailAlphas[i * 2 + 1] = 0
    }

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    trailPos.needsUpdate = true
    trailCol.needsUpdate = true
    trailAlpha.needsUpdate = true
    materials.spark.uniforms.uPixelRatio.value = gl.getPixelRatio()
    materials.core.uniforms.uPixelRatio.value = gl.getPixelRatio()

    for (const item of fx.items) {
      if (!item.active) continue
      item.age += step

      const ringT = item.age / 0.72
      if (ringT >= 1) {
        item.ring.visible = false
      } else {
        const s = (0.22 + ringT * 2.5) * item.scale
        item.ring.scale.set(s, s, 1)
        item.ringMat.opacity = Math.pow(1 - ringT, 1.6) * 0.55
      }

      const flashT = item.age / 0.3
      if (flashT >= 1) {
        item.flash.visible = false
      } else {
        const s = (0.38 + flashT * 1.15) * item.scale
        item.flash.scale.set(s, s, 1)
        item.flashMat.opacity = Math.pow(1 - flashT, 2.0) * 0.9
      }

      if (item.age > 0.82) item.active = false
    }
  })

  return (
    <>
      <points
        geometry={buffers.geo}
        material={materials.spark}
        frustumCulled={false}
        renderOrder={1}
      />
      <points
        geometry={buffers.geo}
        material={materials.core}
        frustumCulled={false}
        renderOrder={2}
      />
      <lineSegments
        geometry={buffers.trailGeo}
        material={materials.trail}
        frustumCulled={false}
        renderOrder={1}
      />
      <primitive object={fx.group} />
    </>
  )
}
