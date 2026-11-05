import { useMemo } from 'react'
import * as THREE from 'three'
import { TAU, halfHeightAt, rnd } from './config'

export interface Seed {
  x: number
  y: number
  z: number
  s: number
  ph: number
  rot: number
  sp: number
  h: number
}

export interface SeedOptions {
  zMin: number
  zMax: number
  sMin: number
  sMax: number
  edgeBias?: number
}

function makeSeed(
  aspect: number,
  zMin: number,
  zMax: number,
  sMin: number,
  sMax: number,
  edgeBias: number,
): Seed {
  const z = rnd(zMin, zMax)
  const h = halfHeightAt(z)
  const spread = h * aspect * 0.9
  // Đẩy bớt ra hai bên để phần giữa không bị rối sau các card nội dung.
  const edge = Math.pow(Math.random(), edgeBias)
  const sign = Math.random() < 0.5 ? -1 : 1
  const depthScale = THREE.MathUtils.clamp(1 + (z + 24) * 0.018, 0.72, 1.38)

  return {
    x: sign * (0.12 + 0.88 * edge) * spread,
    y: rnd(1 - h * 0.82, 1 + h * 0.82),
    z,
    s: rnd(sMin, sMax) * depthScale,
    ph: rnd(0, TAU),
    rot: rnd(0, TAU),
    sp: rnd(0.4, 1.15),
    h,
  }
}

// Mỗi loại vật thể tự tạo layout riêng theo aspect màn hình, nên khi xoay máy
// hoặc resize thì vị trí được rải lại đúng khung nhìn.
export function useSeeds(aspect: number, count: number, opts: SeedOptions): Seed[] {
  const { zMin, zMax, sMin, sMax } = opts
  const edgeBias = opts.edgeBias ?? 0.7

  return useMemo(
    () =>
      Array.from({ length: count }, () => makeSeed(aspect, zMin, zMax, sMin, sMax, edgeBias)),
    [aspect, count, zMin, zMax, sMin, sMax, edgeBias],
  )
}
