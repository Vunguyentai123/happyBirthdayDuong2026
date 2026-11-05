import * as THREE from 'three'

// Quầng sáng mềm cho sprite.
export function makeGlowTexture(): THREE.CanvasTexture {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.28, 'rgba(255,255,255,0.52)')
  g.addColorStop(0.62, 'rgba(255,255,255,0.14)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Môi trường giả màu pastel để vật liệu bóng có vệt phản chiếu đẹp (không tải HDR).
export function makeDreamEnvTexture(): THREE.CanvasTexture {
  const W = 512
  const H = 256
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#FFFDF9')
  grad.addColorStop(0.42, '#FFE8F1')
  grad.addColorStop(0.7, '#E4FAF3')
  grad.addColorStop(1, '#FFD9C2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const blob = (x: number, y: number, r: number, col: string) => {
    const rg = ctx.createRadialGradient(x, y, 1, x, y, r)
    rg.addColorStop(0, col)
    rg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  blob(W * 0.22, H * 0.25, 120, 'rgba(255,255,255,0.98)')
  blob(W * 0.72, H * 0.3, 90, 'rgba(255,182,208,0.75)')
  blob(W * 0.5, H * 0.82, 130, 'rgba(168,236,214,0.55)')
  blob(W * 0.88, H * 0.58, 70, 'rgba(255,223,150,0.65)')
  blob(W * 0.36, H * 0.62, 60, 'rgba(168,200,255,0.45)')

  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
