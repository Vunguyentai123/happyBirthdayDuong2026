import * as THREE from 'three'

// Texture vẽ bằng canvas — không tải file ngoài, chỉ dùng cho màn bánh nến.
function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

// Bóng đổ mềm (gradient tròn) dán dưới bánh và dưới chân nến.
export function makeShadowTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(128)
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
  grad.addColorStop(0, 'rgba(122, 84, 66, 0.5)')
  grad.addColorStop(0.6, 'rgba(122, 84, 66, 0.2)')
  grad.addColorStop(1, 'rgba(122, 84, 66, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Kem ép: gợn dọc mềm (tua vít bắt sóng) + hạt li ti.
// Dùng làm roughnessMap + bumpMap nên để xám trung tính.
export function makeFrostingTexture(): THREE.CanvasTexture {
  const S = 256
  const [c, ctx] = canvas(S)
  ctx.fillStyle = '#8C8C8C'
  ctx.fillRect(0, 0, S, S)

  const bands = 14
  const w = S / bands
  for (let i = 0; i < bands; i++) {
    const x0 = i * w
    const light = i % 2 === 0
    const wob = (y: number) => Math.sin((y / S) * Math.PI * 2 * 3 + i) * w * 0.16
    ctx.beginPath()
    for (let y = 0; y <= S; y += 4) ctx.lineTo(x0 + wob(y), y)
    for (let y = S; y >= 0; y -= 4) ctx.lineTo(x0 + w + wob(y), y)
    ctx.closePath()
    const grad = ctx.createLinearGradient(x0 - w * 0.2, 0, x0 + w * 1.2, 0)
    grad.addColorStop(0, 'rgba(140, 140, 140, 0)')
    grad.addColorStop(0.5, light ? 'rgba(255, 255, 255, 0.5)' : 'rgba(10, 10, 10, 0.34)')
    grad.addColorStop(1, 'rgba(140, 140, 140, 0)')
    ctx.fillStyle = grad
    ctx.fill()
  }

  // hạt kem li ti
  const img = ctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26
    const v = Math.min(255, Math.max(0, img.data[i] + n))
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Pháp tuyến cho lớp kem ép: sống kem dọc có đạo hàm giải tích -> sườn nổi rõ,
// cộng hạt li ti. Dùng làm normalMap cho thành bánh.
export function makeFrostingNormalTexture(): THREE.CanvasTexture {
  const S = 256
  const [c, ctx] = canvas(S)
  const img = ctx.createImageData(S, S)
  const bands = 16 // số đường kem trong 1 vòng lặp
  for (let y = 0; y < S; y++) {
    const v = y / S
    const wob = Math.sin(v * Math.PI * 2 * 3) * 0.009
    for (let x = 0; x < S; x++) {
      const t = (x / S + wob) * bands
      // sườn kem: cos -> đạo hàm theo u là -sin * 2π * bands
      const slope = -Math.sin(t * Math.PI * 2) * 0.62 + (Math.random() - 0.5) * 0.22
      const grainY = (Math.random() - 0.5) * 0.12
      const i = (y * S + x) * 4
      img.data[i] = Math.max(0, Math.min(255, 128 - slope * 127))
      img.data[i + 1] = Math.max(0, Math.min(255, 128 - grainY * 127))
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Bề mặt mousse/kem: hạt li ti ĐẲNG HƯỚNG (không sọc dọc, tránh thành "sườn
// bí ngô" như texture gợn cũ) + mảng xoa kem rất nhẹ, vẽ tràn mép nên giáp
// vòng không lộ đường nối. Dùng làm bumpMap + roughnessMap với cường độ nhỏ.
// Nền sáng (232) vì roughnessMap nhân với roughness của vật liệu.
export function makeMousseBumpTexture(): THREE.CanvasTexture {
  const S = 256
  const [c, ctx] = canvas(S)
  ctx.fillStyle = '#E8E8E8'
  ctx.fillRect(0, 0, S, S)

  for (let i = 0; i < 24; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 26 + Math.random() * 56
    const light = Math.random() < 0.5
    const col = light ? '255, 255, 255' : '150, 150, 150'
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
        g.addColorStop(0, `rgba(${col}, ${light ? 0.14 : 0.18})`)
        g.addColorStop(1, `rgba(${col}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2)
      }
    }
  }

  // hạt mousse li ti
  const img = ctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 36
    const v = Math.min(255, Math.max(0, img.data[i] + n))
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Mặt kem/mousse: mảng màu lớn tương phản RẤT thấp + hạt li ti. Đây là map MÀU
// (nhân với màu vật liệu) nên chỉ để bề mặt bớt "nhựa phẳng", không đổi màu kem.
// Vẽ tràn hai mép để giáp vòng không lộ đường nối.
export function makeCakeSurfaceTexture(): THREE.CanvasTexture {
  const S = 384
  const [c, ctx] = canvas(S)
  ctx.fillStyle = '#FFFDF9'
  ctx.fillRect(0, 0, S, S)

  // kem xoa không đều: mảng ấm/lạnh rất nhẹ (không vẽ sọc để khỏi thành vân gỗ)
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 44 + Math.random() * 96
    const col = Math.random() < 0.55 ? '255, 242, 216' : '247, 235, 216'
    const a = 0.1 + Math.random() * 0.14
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
        g.addColorStop(0, `rgba(${col}, ${a})`)
        g.addColorStop(1, `rgba(${col}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2)
      }
    }
  }

  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 0.5 + Math.random() * 1.4
    ctx.fillStyle = `rgba(232, 216, 192, ${0.05 + Math.random() * 0.09})`
    for (const dy of [-S, 0, S]) {
      ctx.beginPath()
      ctx.arc(x, y + dy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Việt quất: xanh tím chuyển sắc + lớp phấn mờ + vương miện 5 khe ở cực trên.
// SphereGeometry + flipY mặc định -> cực trên nằm ở hàng CUỐI của canvas.
export function makeBlueberryTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  const grad = ctx.createLinearGradient(0, 0, 0, S)
  grad.addColorStop(0, '#2B3560')
  grad.addColorStop(0.5, '#44579C')
  grad.addColorStop(1, '#6B80C4')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)

  // lớp phấn (bloom) mờ
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * S
    const y = Math.random() * S
    const r = 5 + Math.random() * 18
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, 'rgba(216, 228, 255, 0.10)')
    rg.addColorStop(1, 'rgba(216, 228, 255, 0)')
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // vương miện: 5 khe toả ra từ cực trên (đáy canvas)
  ctx.strokeStyle = 'rgba(40, 50, 98, 0.6)'
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(S / 2, S)
    ctx.lineTo(S / 2 + Math.cos(a) * 20, S + Math.sin(a) * 20)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

// Dâu tây: nền đỏ chuyển sắc + hạt vàng xếp so le (map thẳng lên lathe quả dâu).
export function makeStrawberryTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  const grad = ctx.createLinearGradient(0, S, 0, 0)
  grad.addColorStop(0, '#A81F30')
  grad.addColorStop(0.42, '#DC3B4B')
  grad.addColorStop(1, '#F4707C')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)
  // vệt bóng dọc cho vỏ dâu căng mọng
  const shine = ctx.createLinearGradient(0, 0, S * 0.42, 0)
  shine.addColorStop(0, 'rgba(255, 255, 255, 0)')
  shine.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)')
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = shine
  ctx.fillRect(0, 0, S * 0.5, S)

  // vệt dọc mờ cho vỏ dâu bớt phẳng
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * S
    ctx.fillStyle = `rgba(255, 216, 220, ${0.03 + Math.random() * 0.05})`
    ctx.fillRect(x, 0, 1 + Math.random() * 3, S)
  }

  // hạt
  const rows = 12
  const cols = 11
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = (k + (r % 2 ? 0.5 : 0)) * (S / cols)
      const y = 8 + (r * (S - 16)) / (rows - 1)
      ctx.fillStyle = 'rgba(250, 228, 168, 0.85)'
      ctx.beginPath()
      ctx.ellipse(x, y, 1.5, 2.2, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(150, 54, 40, 0.3)'
      ctx.beginPath()
      ctx.ellipse(x + 0.5, y + 0.9, 0.8, 1.1, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

// Lát chanh: bản vẽ tròn (vỏ vàng, cùi trắng, múi) map lên nắp trên của khối trụ.
export function makeLemonTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  const cx = S / 2
  const cy = S / 2
  const r = S / 2 - 1

  ctx.fillStyle = '#F2CE4B'
  ctx.fillRect(0, 0, S, S)
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2)
  ctx.fillStyle = '#F8DE7A'
  ctx.fill()
  // cùi trắng
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2)
  ctx.fillStyle = '#FFF8E2'
  ctx.fill()
  // múi chanh
  const n = 9
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.16
    const a1 = ((i + 1) / n) * Math.PI * 2 - 0.16
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r * 0.82, a0, a1)
    ctx.closePath()
    const g2 = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 0.82)
    g2.addColorStop(0, '#FFF3C0')
    g2.addColorStop(0.6, '#FFE58C')
    g2.addColorStop(1, '#FFD85F')
    ctx.fillStyle = g2
    ctx.fill()
  }
  // viền vỏ ngoài + chút bóng
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.955, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(214, 160, 40, 0.55)'
  ctx.lineWidth = 2.4
  ctx.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Vệt kem chảy: tối dần ở mép trên (nằm dưới gờ kem nên bị che bóng) rồi sáng
// trắng xuống giọt — map vào lathe giọt kem nên giọt đọc thành dải kem đặc,
// không bị hoà lẫn vào thành bánh.
export function makeDripTexture(): THREE.CanvasTexture {
  const W = 64
  const H = 128
  const [c, ctx] = canvas(W, H)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#E6D3AE')
  grad.addColorStop(0.15, '#F5E9D3')
  grad.addColorStop(0.32, '#FFFFFF')
  grad.addColorStop(0.9, '#FFFCF2')
  grad.addColorStop(1, '#F3E3C6')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  // vệt sữa dọc rất nhẹ cho mặt kem không phẳng lì
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(255, 248, 236, ${0.05 + Math.random() * 0.07})`
    ctx.fillRect(Math.random() * W, 0, 1 + Math.random() * 2, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  // lathe xếp profile từ đầu giọt lên gốc nên uv.y = 1 ở gốc giọt; flipY mặc
  // định của texture khiến hàng trên canvas (mép tối dưới gờ kem) nằm ở gốc giọt
  return tex
}

// Bóng tiếp xúc ngay dưới gờ kem: dải ngang đậm ở mép trên rồi tan dần xuống
// (map lên trụ hở, vẽ chồng mờ lên thành bánh nên thành có chiều sâu).
export function makeLedgeShadowTexture(): THREE.CanvasTexture {
  const [c, ctx] = canvas(16, 64)
  const grad = ctx.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, 'rgba(108, 72, 52, 0.6)')
  grad.addColorStop(0.3, 'rgba(108, 72, 52, 0.3)')
  grad.addColorStop(0.72, 'rgba(108, 72, 52, 0.08)')
  grad.addColorStop(1, 'rgba(108, 72, 52, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 16, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Môi trường giả (equirect gradient + 2 đốm sáng) cho kim loại / sáp bóng có vệt phản chiếu.
export function makeEnvTexture(): THREE.CanvasTexture {
  const W = 512
  const H = 256
  const [c, ctx] = canvas(W, H)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#FFFBF4')
  grad.addColorStop(0.45, '#FFEBD4')
  grad.addColorStop(0.62, '#F7D5B2')
  grad.addColorStop(1, '#C18F76')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const blob = (x: number, y: number, r: number, col: string) => {
    const rg = ctx.createRadialGradient(x, y, 1, x, y, r)
    rg.addColorStop(0, col)
    rg.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  blob(W * 0.26, H * 0.3, 118, 'rgba(255, 255, 255, 0.95)')
  blob(W * 0.74, H * 0.34, 88, 'rgba(255, 236, 200, 0.6)')
  blob(W * 0.5, H * 0.86, 150, 'rgba(150, 100, 72, 0.35)')

  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ==== Mặt bánh Chiikawa ====
// Mặt (mắt, má hồng, miệng, lông mày) vẽ vào canvas có alpha, rồi dán lên một
// miếng cong ôm sát thân bánh (xem AvatarCake.tsx). Vì vậy ở đây dùng luôn toạ
// độ bánh (x ngang, y cao, gốc như gốc bánh) rồi quy đổi sang pixel theo đúng
// góc ngang (phiHalf) và khoảng cao (y0..y1) của miếng dán — mép miếng dán cong
// bao nhiêu thì hình vẽ cũng cong theo, không bị "dán phẳng" lên mặt cầu.
export interface FaceBox {
  /** cao thấp nhất / cao nhất của miếng dán (toạ độ bánh) */
  y0: number
  y1: number
  /** nửa góc ngang của miếng dán (rad) */
  phiHalf: number
  /** bán kính thân bánh tại độ cao y */
  radius: (y: number) => number
}

function faceCanvas(box: FaceBox): [HTMLCanvasElement, CanvasRenderingContext2D, (x: number, y: number) => [number, number], (y: number, arc: number) => number, number] {
  const w = 512
  const mid = (box.y0 + box.y1) / 2
  const arcW = 2 * box.phiHalf * Math.max(0.001, box.radius(mid))
  const h = Math.max(32, Math.round((w * (box.y1 - box.y0)) / arcW / 16) * 16)
  const [c, ctx] = canvas(w, h)
  const kY = h / (box.y1 - box.y0)
  // px theo chiều ngang: cung dài `arc` tại độ cao y (đổi qua góc phi)
  const kX = (y: number, arc: number) => (arc * w) / (2 * box.phiHalf * Math.max(0.001, box.radius(y)))
  const at = (x: number, y: number): [number, number] => {
    const phi = Math.asin(THREE.MathUtils.clamp(x / Math.max(0.001, box.radius(y)), -1, 1))
    return [w * (0.5 + phi / (2 * box.phiHalf)), (box.y1 - y) * kY]
  }
  return [c, ctx, at, kX, kY]
}

const EYE_INK = '#2B2731'
const BLUSH = 'rgba(247, 148, 172,'

// Mắt mở: oval đen + đốm sáng to (trên trái) + chấm nhỏ (dưới phải)
function drawEye(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kX: (y: number, arc: number) => number,
  kY: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  const [X, Y] = at(x, y)
  const RX = kX(y, rx)
  const RY = ry * kY
  ctx.fillStyle = EYE_INK
  ctx.beginPath()
  ctx.ellipse(X, Y, RX, RY, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.ellipse(X - RX * 0.34, Y - RY * 0.36, RX * 0.38, RY * 0.32, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.ellipse(X + RX * 0.3, Y + RY * 0.38, RX * 0.17, RY * 0.15, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

// Mắt cười: cung cong lên như "⌒"
function drawHappyEye(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kX: (y: number, arc: number) => number,
  x: number,
  y: number,
  rx: number,
) {
  const [X, Y] = at(x, y)
  const R = kX(y, rx)
  ctx.strokeStyle = EYE_INK
  ctx.lineWidth = R * 0.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(X, Y + R * 0.3, R, Math.PI * 1.16, Math.PI * 1.84)
  ctx.stroke()
}

// Má hồng: gradient tròn ép thành ellipse + 3 sợi râu mảnh
function drawBlush(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kX: (y: number, arc: number) => number,
  kY: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
  whisker: 1 | -1,
) {
  const [X, Y] = at(x, y)
  const RX = kX(y, rx)
  const RY = ry * kY
  ctx.save()
  ctx.translate(X, Y)
  ctx.scale(RX, RY)
  const grad = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1)
  grad.addColorStop(0, `${BLUSH} 0.95)`)
  grad.addColorStop(0.72, `${BLUSH} 0.8)`)
  grad.addColorStop(1, `${BLUSH} 0)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(196, 106, 128, 0.85)'
  ctx.lineCap = 'round'
  // 3 sợi râu: vươn ra phía ngoài má, hơi xoè quạt
  const xIn = x - whisker * rx * 0.25
  const xOut = x + whisker * rx * 1.3
  const len = Math.abs(xOut - xIn)
  ctx.lineWidth = Math.max(1.4, kY * 0.014)
  for (let i = -1; i <= 1; i++) {
    const cy0 = y + i * ry * 0.42
    const [ax, ay] = at(xIn + whisker * len * 0.1, cy0 - i * ry * 0.1)
    const [bx, by] = at(xOut - whisker * len * 0.15, cy0 + i * ry * 0.16)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
}

// Miệng "ω": hai cung lồi xuống chạm nhau ở giữa
function drawOmegaMouth(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kX: (y: number, arc: number) => number,
  x: number,
  y: number,
  s: number,
) {
  const [X, Y] = at(x, y)
  const S = kX(y, s)
  ctx.strokeStyle = '#3A3038'
  ctx.lineWidth = S * 0.32
  ctx.lineCap = 'round'
  for (const dx of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(X + dx * S, Y, S, Math.PI * 0.12, Math.PI * 0.88)
    ctx.stroke()
  }
}

// Miệng cười há: nửa ellipse đổ bóng + lưỡi hồng
function drawHappyMouth(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kX: (y: number, arc: number) => number,
  kY: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const [X, Y] = at(x, y)
  const W = kX(y, w)
  const H = h * kY
  ctx.fillStyle = '#8A4A58'
  ctx.beginPath()
  ctx.ellipse(X, Y, W, H, 0, 0, Math.PI)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#F29CB0'
  ctx.beginPath()
  ctx.ellipse(X, Y + H * 0.42, W * 0.5, H * 0.42, 0, 0, Math.PI)
  ctx.closePath()
  ctx.fill()
}

// Lông mày: cung mềm nối 2 đầu, đỉnh nâng lên `lift`
function drawBrow(
  ctx: CanvasRenderingContext2D,
  at: (x: number, y: number) => [number, number],
  kY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  lift: number,
) {
  const [ax, ay] = at(x0, y0)
  const [bx, by] = at((x0 + x1) / 2, (y0 + y1) / 2 + lift)
  const [cx, cy] = at(x1, y1)
  ctx.strokeStyle = EYE_INK
  ctx.lineWidth = Math.max(1.6, kY * 0.022)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.quadraticCurveTo(bx, by, cx, cy)
  ctx.stroke()
}

function toFaceTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Usagi: lông mày hếch ra ngoài, mắt to, má hồng + râu, miệng ω (cười: mắt ⌒ + miệng há)
export function makeUsagiFaceTexture(happy: boolean, box: FaceBox): THREE.CanvasTexture {
  const [c, ctx, at, kX, kY] = faceCanvas(box)
  const eyeX = 0.315
  const eyeY = 1.82
  const blushX = 0.545
  const blushY = 1.59
  if (!happy) {
    drawBrow(ctx, at, kY, -0.43, 2.055, -0.2, 2.035, 0.015)
    drawBrow(ctx, at, kY, 0.43, 2.055, 0.2, 2.035, 0.015)
  }
  for (const sx of [-1, 1]) {
    if (happy) drawHappyEye(ctx, at, kX, sx * eyeX, eyeY, 0.17)
    else drawEye(ctx, at, kX, kY, sx * eyeX, eyeY, 0.155, 0.175)
    drawBlush(ctx, at, kX, kY, sx * blushX, blushY, 0.115, 0.08, sx < 0 ? -1 : 1)
  }
  if (happy) drawHappyMouth(ctx, at, kX, kY, 0, 1.565, 0.1, 0.065)
  else drawOmegaMouth(ctx, at, kX, 0, 1.565, 0.075)
  return toFaceTexture(c)
}

// Momonga: không lông mày, mắt tròn, má hồng + râu, miệng ω nhỏ
export function makeMomongaFaceTexture(happy: boolean, box: FaceBox): THREE.CanvasTexture {
  const [c, ctx, at, kX, kY] = faceCanvas(box)
  const eyeX = 0.25
  const eyeY = 0.73
  const blushX = 0.46
  const blushY = 0.62
  for (const sx of [-1, 1]) {
    if (happy) drawHappyEye(ctx, at, kX, sx * eyeX, eyeY, 0.14)
    else drawEye(ctx, at, kX, kY, sx * eyeX, eyeY, 0.125, 0.14)
    drawBlush(ctx, at, kX, kY, sx * blushX, blushY, 0.11, 0.07, sx < 0 ? -1 : 1)
  }
  if (happy) drawHappyMouth(ctx, at, kX, kY, 0, 0.55, 0.08, 0.055)
  else drawOmegaMouth(ctx, at, kX, 0, 0.545, 0.055)
  return toFaceTexture(c)
}

// Mũ sinh nhật: nền kem + sọc hồng chéo (vẽ lệch để không lộ đường nối khi dán quanh chóp).
export function makePartyHatTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  ctx.fillStyle = '#FFFCF6'
  ctx.fillRect(0, 0, S, S)
  ctx.save()
  // shear 2/3 ô sọc -> sọc chéo; bước sọc chia hết chiều rộng nên giáp vòng không lệch
  ctx.transform(1, 2 / 3, 0, 1, 0, 0)
  const period = S / 6
  ctx.fillStyle = 'rgba(255, 142, 184, 0.92)'
  for (let i = -8; i < 16; i++) {
    if (i % 2 === 0) continue
    ctx.fillRect(i * period, -S, period * 0.55, S * 3)
  }
  ctx.restore()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

// Thẻ tròn "Happy Birthday" đặt trên bìa (như ảnh mẫu)
export function makeTagTexture(): THREE.CanvasTexture {
  const S = 256
  const [c, ctx] = canvas(S)
  const cx = S / 2
  const cy = S / 2
  ctx.save()
  ctx.shadowColor = 'rgba(120, 100, 90, 0.25)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy, S * 0.46, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = '#F0E7DE'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, S * 0.46 - 3, 0, Math.PI * 2)
  ctx.stroke()

  // cupcake nhỏ
  const cake = (x: number, y: number, s: number) => {
    ctx.fillStyle = '#FFB3CB'
    ctx.beginPath()
    ctx.arc(x, y, s * 0.95, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#F7E7C8'
    ctx.beginPath()
    ctx.moveTo(x - s, y)
    ctx.lineTo(x + s, y)
    ctx.lineTo(x + s * 0.62, y + s * 1.25)
    ctx.lineTo(x - s * 0.62, y + s * 1.25)
    ctx.closePath()
    ctx.fill()
  }
  cake(cx, cy - 32, 17)
  ctx.fillStyle = '#8A7466'
  ctx.textAlign = 'center'
  ctx.font = 'italic 700 30px "Baloo 2", "Segoe UI", system-ui, sans-serif'
  ctx.fillText('Happy', cx, cy + 24)
  ctx.fillText('Birthday', cx, cy + 54)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Mặt bàn đá cẩm thạch cho mâm bánh: nền ngà ấm + vân xám mảnh + vài sợi vàng.
// Vân vẽ tràn mép để khi map vòng quanh mâm không lộ đường nối.
export function makeMarbleTexture(): THREE.CanvasTexture {
  const S = 512
  const [c, ctx] = canvas(S)
  const base = ctx.createLinearGradient(0, 0, S, S)
  base.addColorStop(0, '#FFFDF8')
  base.addColorStop(0.46, '#F8F0E6')
  base.addColorStop(1, '#EFE1D2')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)

  const vein = (color: string, alpha: number, width: number, seed: number) => {
    let rnd = seed
    const r = () => {
      rnd = (rnd * 16807) % 2147483647
      return rnd / 2147483647
    }
    ctx.strokeStyle = color
    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    for (let i = 0; i < 5; i++) {
      const x = r() * S
      const y = r() * S
      ctx.beginPath()
      ctx.moveTo(x - S, y)
      ctx.bezierCurveTo(
        x - S * 0.45, y - 56 + r() * 112,
        x + S * 0.15, y + 70 - r() * 140,
        x + S, y + 24 - r() * 48,
      )
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  vein('rgba(168,151,138,0.9)', 0.12, 1.4, 73)
  vein('rgba(208,185,158,0.9)', 0.16, 0.9, 311)
  vein('rgba(191,154,92,0.9)', 0.12, 0.7, 977)

  // hạt đá li ti
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(152, 128, 112, ${Math.random() * 0.055})`
    ctx.fillRect(Math.random() * S, Math.random() * S, 1, 1)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Chữ viết tay bằng chocolate trên hông bánh. Nền trong suốt, chỉ có nét chữ
// và hoa văn vàng nên dán lên mặt kem vẫn giữ được chất kem bên dưới.
export function makeTierMessageTexture(name: string, age: number): THREE.CanvasTexture {
  const W = 1024
  const H = 256
  const [c, ctx] = canvas(W, H)
  const cx = W / 2

  const spaced = (text: string, x: number, y: number, gap: number) => {
    const chars = [...text]
    const widths = chars.map((ch) => ctx.measureText(ch).width)
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)
    let cursor = x - total / 2
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursor + widths[i] / 2, y)
      cursor += widths[i] + gap
    }
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // hoa văn vàng hai bên dòng chữ nhỏ
  ctx.strokeStyle = 'rgba(190, 145, 71, 0.8)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    const x = cx + side * 300
    ctx.beginPath()
    ctx.moveTo(x, 44)
    ctx.lineTo(x + side * 52, 44)
    ctx.stroke()
    ctx.fillStyle = 'rgba(201, 162, 93, 0.9)'
    ctx.beginPath()
    ctx.arc(x + side * 62, 44, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#B48646'
  ctx.font = '700 31px "Baloo 2", "Segoe UI", system-ui, sans-serif'
  spaced('HAPPY BIRTHDAY', cx, 44, 9)

  ctx.save()
  ctx.shadowColor = 'rgba(78, 38, 47, 0.22)'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 2
  ctx.fillStyle = '#713B4B'
  ctx.font = 'italic 600 108px "Playfair Display", Georgia, "Times New Roman", serif'
  ctx.fillText(`${name} · ${age}`, cx, 143)
  ctx.restore()

  // gạch chân mảnh + trái tim nhỏ
  const line = ctx.createLinearGradient(cx - 155, 0, cx + 155, 0)
  line.addColorStop(0, 'rgba(184, 139, 71, 0)')
  line.addColorStop(0.2, 'rgba(184, 139, 71, 0.75)')
  line.addColorStop(0.8, 'rgba(184, 139, 71, 0.75)')
  line.addColorStop(1, 'rgba(184, 139, 71, 0)')
  ctx.strokeStyle = line
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(cx - 160, 208)
  ctx.lineTo(cx + 160, 208)
  ctx.stroke()
  ctx.fillStyle = 'rgba(201, 162, 93, 0.95)'
  ctx.beginPath()
  ctx.arc(cx, 208, 3.4, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Giấy gói quà: nền trắng ngà + chấm bi nhỏ. Nhân với màu vật liệu nên chấm
// hiện ra thành màu sáng hơn, giúp mặt hộp bớt phẳng lì.
export function makeGiftWrapTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(255, 236, 243, 0.95)'
  const step = S / 5
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0)
      const y = row * step + step / 2
      ctx.beginPath()
      ctx.arc(x, y, 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Quầng sáng tròn dùng cho ngọn nến (sprite) và khói sau khi thổi.
export function makeGlowTexture(): THREE.CanvasTexture {
  const S = 128
  const [c, ctx] = canvas(S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255, 255, 255, 1)')
  g.addColorStop(0.26, 'rgba(255, 246, 214, 0.78)')
  g.addColorStop(0.62, 'rgba(255, 196, 108, 0.22)')
  g.addColorStop(1, 'rgba(255, 180, 90, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Sáp nến: nền trắng ngà + rãnh sáp mảnh chạy dọc. Nhân với màu vật liệu để ra
// từng cây nến pastel nhưng vẫn có vân sáp thật, không bị nhựa phẳng.
export function makeCandleTexture(): THREE.CanvasTexture {
  const W = 64
  const H = 256
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * W
    ctx.fillStyle = `rgba(226, 218, 208, ${0.16 + Math.random() * 0.16})`
    ctx.fillRect(x, 0, 1 + Math.random() * 2, H)
  }
  // vệt sáng mềm ở một bên cây nến
  const shine = ctx.createLinearGradient(0, 0, W, 0)
  shine.addColorStop(0.12, 'rgba(255,255,255,0)')
  shine.addColorStop(0.34, 'rgba(255,255,255,0.65)')
  shine.addColorStop(0.48, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.fillRect(0, 0, W, H)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
