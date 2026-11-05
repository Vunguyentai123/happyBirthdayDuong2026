import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TAU, halfHeightAt, rnd } from './config'

const MAX_DUST = 260
const MAX_SPARKLES = 130
const MAX_BOKEH = 24

const DUST_COLORS = ['#FFE6A8', '#FFC9DA', '#FFFFFF', '#CFF3E4', '#D8E4FF']
const SPARKLE_COLORS = ['#FFFFFF', '#FFE9A8', '#FFC9DA', '#BFF3E0', '#CFD9FF']

function makeParticleGeometry(
  count: number,
  aspect: number,
  zMin: number,
  zMax: number,
  sizeMin: number,
  sizeMax: number,
  colors: string[],
  edge = false,
): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const tints = new Float32Array(count * 3)
  const col = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const z = rnd(zMin, zMax)
    const h = halfHeightAt(z)
    const halfW = h * aspect
    const i3 = i * 3

    if (edge) {
      const sign = Math.random() < 0.5 ? -1 : 1
      positions[i3] = sign * rnd(halfW * 0.55, halfW * 0.98)
    } else {
      positions[i3] = rnd(-halfW * 0.92, halfW * 0.92)
    }
    positions[i3 + 1] = rnd(1 - h * 0.9, 1 + h * 0.9)
    positions[i3 + 2] = z

    sizes[i] = rnd(sizeMin, sizeMax)
    phases[i] = rnd(0, TAU)
    col.set(colors[i % colors.length])
    tints[i3] = col.r
    tints[i3 + 1] = col.g
    tints[i3 + 2] = col.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geo.setAttribute('aColor', new THREE.BufferAttribute(tints, 3))
  return geo
}

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.14 + aPhase) * 0.55;
    pos.y += cos(uTime * 0.11 + aPhase * 1.37) * 0.65;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float twinkle = 0.62 + 0.38 * sin(uTime * 1.7 + aPhase * 2.0);
    vColor = aColor;
    vTwinkle = twinkle;

    gl_PointSize = aSize * uPixelRatio * (12.0 / max(1.0, -mv.z)) * (0.72 + 0.28 * twinkle);
    gl_Position = projectionMatrix * mv;
  }
`

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform float uSharpness;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), uSharpness);
    gl_FragColor = vec4(vColor, a * uOpacity * vTwinkle);
  }
`

interface ParticleOptions {
  count: number
  aspect: number
  zMin: number
  zMax: number
  sizeMin: number
  sizeMax: number
  colors: string[]
  opacity: number
  sharpness: number
  additive: boolean
  edge?: boolean
}

function makeParticleLayer(opts: ParticleOptions) {
  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uOpacity: { value: opts.opacity },
    uSharpness: { value: opts.sharpness },
  }

  const geometry = makeParticleGeometry(
    opts.count,
    opts.aspect,
    opts.zMin,
    opts.zMax,
    opts.sizeMin,
    opts.sizeMax,
    opts.colors,
    opts.edge,
  )

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  })

  return { geometry, material, uniforms }
}

// 3 lớp hạt: bụi mịn, đom đóm và bokeh mờ sát ống kính.
export function ParticleField({ quality = 1 }: { quality?: number }) {
  const gl = useThree((s) => s.gl)
  const aspect = useThree((s) => s.size.width / s.size.height)

  const particles = useMemo(
    () => ({
      dust: makeParticleLayer({
        count: MAX_DUST,
        aspect,
        zMin: -26,
        zMax: -3,
        sizeMin: 1.2,
        sizeMax: 3.6,
        colors: DUST_COLORS,
        opacity: 0.55,
        sharpness: 3.0,
        additive: false,
      }),
      sparkles: makeParticleLayer({
        count: MAX_SPARKLES,
        aspect,
        zMin: -22,
        zMax: -2,
        sizeMin: 5,
        sizeMax: 14,
        colors: SPARKLE_COLORS,
        opacity: 0.8,
        sharpness: 1.8,
        additive: true,
      }),
      bokeh: makeParticleLayer({
        count: MAX_BOKEH,
        aspect,
        zMin: 0,
        zMax: 2.5,
        sizeMin: 10,
        sizeMax: 20,
        colors: SPARKLE_COLORS,
        opacity: 0.3,
        sharpness: 1.5,
        additive: true,
        edge: true,
      }),
    }),
    [aspect],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const nOf = (max: number) => Math.max(1, Math.floor(max * quality))

    particles.dust.geometry.setDrawRange(0, nOf(MAX_DUST))
    particles.sparkles.geometry.setDrawRange(0, nOf(MAX_SPARKLES))
    particles.bokeh.geometry.setDrawRange(0, nOf(MAX_BOKEH))

    const dpr = gl.getPixelRatio()
    Object.values(particles).forEach((layer) => {
      layer.uniforms.uTime.value = t
      layer.uniforms.uPixelRatio.value = dpr
    })
  })

  return (
    <>
      <points geometry={particles.dust.geometry} material={particles.dust.material} frustumCulled={false} />
      <points
        geometry={particles.sparkles.geometry}
        material={particles.sparkles.material}
        frustumCulled={false}
      />
      <points geometry={particles.bokeh.geometry} material={particles.bokeh.material} frustumCulled={false} />
    </>
  )
}
