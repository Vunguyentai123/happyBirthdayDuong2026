// Cấu hình chung cho background 3D: bảng màu theo màn, hằng số camera và
// các hàm random/loop dùng lại ở nhiều component.

export interface Palette {
  top: string
  mid: string
  bottom: string
  accent: string
  accent2: string
  speed: number
}

export const palettes: Record<string, Palette> = {
  lock: { top: '#FFD9E8', mid: '#FFF0F6', bottom: '#FFF8E7', accent: '#FF8FB8', accent2: '#FFD98A', speed: 0.35 },
  greeting: { top: '#FFF2C4', mid: '#FFF9E4', bottom: '#FFE9F0', accent: '#FFA8C8', accent2: '#FFEFB8', speed: 0.6 },
  candle: { top: '#FFF0DE', mid: '#FFF8F0', bottom: '#FFFBF7', accent: '#FFD3B4', accent2: '#FFF0C4', speed: 0.45 },
  photos: { top: '#FFE3D2', mid: '#FFF6EC', bottom: '#FFE9F0', accent: '#F4B3C4', accent2: '#EBCB8C', speed: 0.4 },
  letter: { top: '#F7E2D0', mid: '#FFF6EA', bottom: '#FBE6EC', accent: '#DFC08F', accent2: '#EDA9B8', speed: 0.3 },
  gift: { top: '#FFD3DE', mid: '#FFF0F3', bottom: '#FFF8E7', accent: '#FFB3C9', accent2: '#FFE066', speed: 0.75 },
}

export const TAU = Math.PI * 2

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export const wrap = (v: number, m: number) => ((((v % m) + m) % m) + m) % m

// Camera của CanvasRoot: position z = 7, fov = 50.
export const CAMERA_Z = 7
export const FOV = 50
export const halfHeightAt = (z: number) => Math.tan((FOV * Math.PI) / 360) * (CAMERA_Z - z)
