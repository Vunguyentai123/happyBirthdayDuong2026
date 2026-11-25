// Âm thanh tổng hợp bằng Web Audio: không cần file, không gửi dữ liệu đi đâu.
// Chỉ phát sau khi người dùng đã chạm (unlockAudio), đúng luật autoplay của
// trình duyệt. Mọi hàm đều "fail silent" nếu máy không hỗ trợ.

export type SfxName = 'pop' | 'stamp' | 'paper' | 'blow' | 'ribbon' | 'sparkle' | 'checkin'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function audioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

function getCtx(): AudioContext | null {
  const Ctor = audioCtor()
  if (!Ctor) return null
  if (!ctx || ctx.state === 'closed') {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
    noiseBuffer = null
  }
  return ctx
}

export function unlockAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume().catch(() => {})
}

function ready(enabled: boolean): AudioContext | null {
  if (!enabled) return null
  const c = getCtx()
  if (!c) return null
  if (c.state === 'suspended') void c.resume().catch(() => {})
  return c
}

function tone(
  c: AudioContext,
  freq: number,
  duration: number,
  when: number,
  gain: number,
  type: OscillatorType = 'sine',
  endFreq?: number,
) {
  const osc = c.createOscillator()
  const amp = c.createGain()
  const t = c.currentTime + when
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, duration * 0.2))
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(amp)
  amp.connect(master ?? c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

function noise(c: AudioContext, duration: number, when: number, gain: number, highpass: number, lowpass: number) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== c.sampleRate) {
    const size = Math.max(1, Math.floor(c.sampleRate * 0.4))
    noiseBuffer = c.createBuffer(1, size, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = highpass
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = lowpass
  const amp = c.createGain()
  const t = c.currentTime + when
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  src.connect(hp)
  hp.connect(lp)
  lp.connect(amp)
  amp.connect(master ?? c.destination)
  src.start(t)
  src.stop(t + duration + 0.02)
}

export function haptic(pattern: number | number[] = 12, enabled = true): void {
  if (!enabled) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Một số trình duyệt chặn rung khi không phải cử chỉ chạm: bỏ qua.
  }
}

export function playSfx(name: SfxName, enabled = true): void {
  const c = ready(enabled)
  if (!c) return
  switch (name) {
    case 'pop':
      tone(c, 760, 0.09, 0, 0.1, 'triangle', 240)
      noise(c, 0.06, 0, 0.045, 900, 5200)
      break
    case 'stamp':
      tone(c, 150, 0.16, 0, 0.14, 'sine', 58)
      noise(c, 0.12, 0.01, 0.06, 300, 1800)
      break
    case 'paper':
      noise(c, 0.16, 0, 0.055, 1200, 6800)
      break
    case 'blow':
      noise(c, 0.5, 0, 0.12, 260, 2600)
      break
    case 'ribbon':
      tone(c, 320, 0.26, 0, 0.055, 'sine', 1100)
      noise(c, 0.2, 0.02, 0.035, 1600, 7200)
      break
    case 'sparkle':
      tone(c, 1250, 0.22, 0, 0.045, 'sine', 1850)
      tone(c, 1680, 0.3, 0.05, 0.033, 'sine', 2200)
      break
    case 'checkin':
      tone(c, 130, 0.15, 0, 0.13, 'sine', 52)
      noise(c, 0.11, 0.01, 0.05, 300, 1600)
      tone(c, 980, 0.22, 0.12, 0.05, 'sine', 1500)
      tone(c, 1320, 0.3, 0.18, 0.04, 'sine', 1900)
      break
  }
}

// Happy Birthday (giai điệu đã thuộc phạm vi công cộng) chơi bằng tiếng hộp nhạc.
// Trả về độ dài (giây) để màn thổi nến biết lúc nào trả nhạc nền về âm lượng cũ.
const NOTE = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const

type MelodyNote = readonly [number, number]

const MELODY: readonly MelodyNote[] = [
  [NOTE.G4, 0.5],
  [NOTE.G4, 0.5],
  [NOTE.A4, 1],
  [NOTE.G4, 1],
  [NOTE.C5, 1],
  [NOTE.B4, 1.6],
  [0, 0.4],
  [NOTE.G4, 0.5],
  [NOTE.G4, 0.5],
  [NOTE.A4, 1],
  [NOTE.G4, 1],
  [NOTE.D5, 1],
  [NOTE.C5, 1.6],
  [0, 0.4],
  [NOTE.G4, 0.5],
  [NOTE.G4, 0.5],
  [NOTE.G5, 1],
  [NOTE.E5, 1],
  [NOTE.C5, 1],
  [NOTE.B4, 1],
  [NOTE.A4, 1.6],
  [0, 0.4],
  [NOTE.F5, 0.5],
  [NOTE.F5, 0.5],
  [NOTE.E5, 1],
  [NOTE.C5, 1],
  [NOTE.D5, 1],
  [NOTE.C5, 1.8],
  [0, 0.6],
]

function bell(c: AudioContext, freq: number, when: number, duration: number) {
  // Hai dao động lệch quãng tám tạo tiếng hộp nhạc mềm, không chói.
  tone(c, freq, duration, when, 0.042, 'sine')
  tone(c, freq * 2, duration * 0.8, when, 0.012, 'triangle')
}

export function playBirthdayJingle(enabled: boolean): number {
  const c = ready(enabled)
  if (!c) return 0
  const beat = 0.29
  let at = 0.06
  for (const [freq, beats] of MELODY) {
    const duration = Math.max(0.12, beats * beat * 0.92)
    if (freq > 0) bell(c, freq, at, duration)
    at += beats * beat
  }
  return at
}
