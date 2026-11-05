import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Palette } from './config'
import { makeGlowTexture } from './textures'

const GLOWS = [
  { p: [-10, 5.5, -24] as [number, number, number], s: 28, o: 0.2, c: 'accent' as const },
  { p: [10, -2.5, -22] as [number, number, number], s: 24, o: 0.16, c: 'accent2' as const },
  { p: [1, 8.5, -26] as [number, number, number], s: 34, o: 0.14, c: 'white' as const },
]

const SKY_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBottom;
  uniform vec3 uAccent;
  uniform vec3 uAccent2;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 col = mix(uBottom, uMid, smoothstep(0.0, 0.52, vUv.y));
    col = mix(col, uTop, smoothstep(0.42, 1.0, vUv.y));

    float w1 = sin(vUv.x * 5.0 + uTime * 0.16) * 0.5
             + sin(vUv.x * 9.0 - uTime * 0.11) * 0.25;
    float ribbon1 = smoothstep(0.17, 0.0, abs(vUv.y - (0.64 + w1 * 0.1)));
    float w2 = sin(vUv.x * 3.6 - uTime * 0.1 + 1.7) * 0.5
             + sin(vUv.x * 7.0 + uTime * 0.08) * 0.22;
    float ribbon2 = smoothstep(0.15, 0.0, abs(vUv.y - (0.38 + w2 * 0.09)));

    col += uAccent * ribbon1 * 0.17;
    col += uAccent2 * ribbon2 * 0.11;

    float sunD = distance(vUv * vec2(1.0, 1.2), vec2(0.76, 0.82));
    col += uAccent * 0.14 * smoothstep(0.62, 0.0, sunD);

    float vig = smoothstep(0.92, 0.32, distance(vUv, vec2(0.5, 0.52)));
    col *= mix(0.945, 1.0, vig);
    col += (hash(vUv * 900.0) - 0.5) * 0.014;

    gl_FragColor = vec4(col, 1.0);
  }
`

// Mặt trời giả full-screen + các quầng sáng phía xa. Màu được lerp mượt khi
// chuyển màn để không bị giật.
export function SkyBackdrop({ palette }: { palette: Palette }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(palette.top) },
      uMid: { value: new THREE.Color(palette.mid) },
      uBottom: { value: new THREE.Color(palette.bottom) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uAccent2: { value: new THREE.Color(palette.accent2) },
      uTime: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
      }),
    [uniforms],
  )

  const glowTexture = useMemo(() => makeGlowTexture(), [])
  const target = useMemo(() => new THREE.Color(), [])

  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    const step = Math.min(dt, 0.06)
    const blend = 1 - Math.exp(-2.4 * step)

    uniforms.uTop.value.lerp(target.set(palette.top), blend)
    uniforms.uMid.value.lerp(target.set(palette.mid), blend)
    uniforms.uBottom.value.lerp(target.set(palette.bottom), blend)
    uniforms.uAccent.value.lerp(target.set(palette.accent), blend)
    uniforms.uAccent2.value.lerp(target.set(palette.accent2), blend)
    uniforms.uTime.value = t
  })

  return (
    <>
      <mesh renderOrder={-1000} frustumCulled={false} material={material}>
        <planeGeometry args={[2, 2]} />
      </mesh>

      {GLOWS.map((g) => (
        <sprite key={g.c + g.p[0]} position={g.p} scale={[g.s, g.s, 1]}>
          <spriteMaterial
            map={glowTexture}
            color={g.c === 'accent2' ? palette.accent2 : g.c === 'white' ? '#FFFFFF' : palette.accent}
            transparent
            opacity={g.o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      ))}
    </>
  )
}
