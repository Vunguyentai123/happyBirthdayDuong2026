// Tạo tấm ảnh kỷ niệm ngay trên máy, không upload ở đâu cả.
// Ảnh 1080x1350 (dọc) để Chanh lưu vào điện thoại hoặc gửi cho anh.

import { asset } from '../data/assets'
import { content } from '../data/content'
import { generatedPhotos } from '../data/photos.generated'
import { birthdayStatus } from './birthday'
import type { Wish } from './wish'

const WIDTH = 1080
const HEIGHT = 1350
const INK = '#4A2F27'
const PAPER = '#FFF8EA'
const PINK = '#E45C86'
const BUTTER = '#FFC21A'
const MINT = '#6FC3A4'
const SKY = '#8CCBEA'

interface RecapOptions {
  wish?: Wish | null
  /**
   * Đường dẫn gốc của 2 ảnh khách chọn (ví dụ `/photos/abc.webp`), chưa qua
   * `asset()`. Bỏ trống thì dùng 2 ảnh mặc định.
   */
  photos?: string[]
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
  const drawWidth = img.naturalWidth * scale
  const drawHeight = img.naturalHeight * scale
  ctx.save()
  roundRect(ctx, x, y, width, height, 30)
  ctx.clip()
  ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function defaultPhotoSources(): string[] {
  const list =
    generatedPhotos.length > 0
      ? generatedPhotos
      : ['/characters/usagi-08.png', '/characters/momonga-04.png']
  const picks = list.length >= 4 ? [list[0], list[3]] : list.slice(0, 2)
  return picks.length > 0 ? picks : ['/characters/usagi-08.png']
}

export async function createRecapImage(options: RecapOptions = {}): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas không khả dụng')

  const status = birthdayStatus(content.birthdayISO)

  try {
    // Đợi font ngắn thôi: nếu mạng/asset chậm, vẫn vẽ bằng font dự phòng thay vì
    // treo nút "Đang ghép ảnh...".
    // Truyền mẫu chữ có đủ dấu tiếng Việt để trình duyệt tải đúng file subset;
    // nếu chỉ load mặt chữ trơn, chữ có dấu sẽ rơi về font dự phòng khi vẽ.
    const sample = [
      content.nickname,
      `tuổi ${content.age}`,
      status.full,
      ...content.photoCaptions,
    ].join(' ')
    const fontsReady = Promise.all([
      // 600 italic phải là mặt chữ thật (đã import 600-italic.css). Thiếu mặt
      // này, trình duyệt tự nghiêng + tự làm đậm và chữ bị vỡ nét trên canvas.
      document.fonts.load('italic 600 168px "Playfair Display"', sample),
      document.fonts.load('italic 500 30px "Playfair Display"', sample),
      document.fonts.load('700 34px "Baloo 2"', sample),
      document.fonts.load('800 58px "Baloo 2"', sample),
      document.fonts.load('700 28px "Baloo 2"', sample),
      document.fonts.load('700 25px "Baloo 2"', sample),
      document.fonts.load('700 22px "Baloo 2"', sample),
      document.fonts.ready,
    ])
    await Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 2500))])
  } catch {
    // Font chưa sẵn sàng vẫn vẽ được bằng font dự phòng.
  }

  // Nền giấy kem + hạt confetti rải cố định (cùng một tấm ảnh mỗi lần tạo).
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const colors = [PINK, BUTTER, SKY, MINT, '#D8C7F2', '#FF9E7A']
  let seed = 17
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 150; i++) {
    const x = rand() * WIDTH
    const y = rand() * HEIGHT
    const size = 6 + rand() * 12
    ctx.globalAlpha = 0.35 + rand() * 0.4
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)] ?? PINK
    ctx.beginPath()
    if (i % 3 === 0) {
      ctx.rect(x, y, size, size * 0.45)
    } else {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Viền trong
  ctx.strokeStyle = 'rgba(74,47,39,.18)'
  ctx.lineWidth = 3
  roundRect(ctx, 42, 42, WIDTH - 84, HEIGHT - 84, 46)
  ctx.stroke()

  // Tiêu đề
  ctx.textAlign = 'center'
  ctx.fillStyle = PINK
  ctx.font = '700 34px "Baloo 2", sans-serif'
  ctx.fillText('HAPPY BIRTHDAY', WIDTH / 2, 152)

  ctx.fillStyle = INK
  ctx.font = 'italic 600 168px "Playfair Display", Georgia, serif'
  ctx.fillText(content.nickname, WIDTH / 2, 322)

  ctx.fillStyle = INK
  ctx.font = '800 58px "Baloo 2", sans-serif'
  ctx.fillText(`tuổi ${content.age}`, WIDTH / 2, 390)

  ctx.fillStyle = 'rgba(74,47,39,.68)'
  ctx.font = '700 28px "Baloo 2", sans-serif'
  ctx.fillText(`${status.full} · sinh nhật`, WIDTH / 2, 438)

  // 2 ảnh khách chọn. Ảnh dọc -> đặt cạnh nhau; ảnh ngang -> đặt trên dưới.
  const chosen =
    options.photos && options.photos.length > 0 ? options.photos : defaultPhotoSources()
  const photos = chosen.slice(0, 2).map((src) => asset(src))
  const loaded = await Promise.all(photos.map(loadImage))
  const landscapePair =
    loaded.length > 1 &&
    loaded.every((img) => img !== null && img.naturalWidth >= img.naturalHeight)

  const cols = landscapePair ? 1 : 2
  const rows = landscapePair ? 2 : 1
  const frameW = landscapePair ? 524 : 470
  const frameH = landscapePair ? 350 : 627
  const gap = landscapePair ? 24 : 28
  const startX = (WIDTH - (cols * frameW + (cols - 1) * gap)) / 2
  const startY = landscapePair ? 476 : 500
  const photosBottom = startY + rows * frameH + (rows - 1) * gap

  loaded.forEach((img, index) => {
    const x = startX + (index % cols) * (frameW + gap)
    const y = startY + Math.floor(index / cols) * (frameH + gap)
    const tilt = index % 2 === 0 ? -0.018 : 0.016

    ctx.save()
    ctx.translate(x + frameW / 2, y + frameH / 2)
    ctx.rotate(tilt)
    ctx.translate(-frameW / 2, -frameH / 2)

    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(74,47,39,.18)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 10
    roundRect(ctx, 0, 0, frameW, frameH, 18)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    if (img) {
      drawCover(ctx, img, 14, 14, frameW - 28, frameH - 78)
    } else {
      ctx.fillStyle = '#FFE6EE'
      roundRect(ctx, 14, 14, frameW - 28, frameH - 78, 12)
      ctx.fill()
      ctx.fillStyle = PINK
      ctx.font = '700 36px "Baloo 2", sans-serif'
      ctx.fillText('♡', frameW / 2, frameH / 2)
    }

    // Băng dính washi
    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,194,26,.7)' : 'rgba(191,232,255,.8)'
    roundRect(ctx, frameW / 2 - 42, -8, 84, 24, 4)
    ctx.fill()

    // Caption ngắn trên polaroid
    ctx.fillStyle = INK
    ctx.font = '700 22px "Baloo 2", sans-serif'
    const caption = content.photoCaptions[index % content.photoCaptions.length] ?? ''
    ctx.fillText(caption, frameW / 2, frameH - 30)

    ctx.restore()
  })

  // Lời chúc / điều ước
  ctx.textAlign = 'center'
  const quote = options.wish?.text
    ? `“${options.wish.text}”`
    : content.photoNotes[8] ?? 'Một ngày rất đỗi bình thường, có em là thành ngày anh nhớ.'
  ctx.fillStyle = INK
  ctx.font = 'italic 500 30px "Playfair Display", Georgia, serif'
  const quoteY = Math.min(1248, photosBottom + 56)
  const lines = wrapText(ctx, quote, WIDTH - 220).slice(0, 2)
  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, quoteY + index * 38)
  })

  // Chân ảnh
  ctx.fillStyle = PINK
  ctx.font = '700 25px "Baloo 2", sans-serif'
  ctx.fillText('Usagi & Momonga có quà cho Chanh', WIDTH / 2, 1320)

  return canvas.toDataURL('image/png')
}

export function downloadRecap(dataUrl: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `sinh-nhat-chanh-${content.age}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}
