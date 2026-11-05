import { useCallback, useEffect, useRef, useState } from 'react'
import { useSceneStore, sceneOrder } from '../store/useSceneStore'

export function useSceneFlow() {
  const { scene, next, setScene, restart } = useSceneStore()
  const index = sceneOrder.indexOf(scene)
  const goNext = useCallback(() => next(), [next])
  return { scene, index, total: sceneOrder.length, goNext, setScene, restart }
}

// Bản đầy đủ (canvas 3D) là đường chạy duy nhất — không còn công tắc cho khách
// tự đổi qua lại. Cờ "lite" giờ chỉ còn là lưới an toàn: máy KHÔNG có WebGL thì
// trả về true để các màn dùng giao diện 2D thay vì khung 3D trắng.
// (Trước đây tự bật thêm khi prefers-reduced-motion hoặc hardwareConcurrency<=4
// — đã bỏ, vì máy yếu vẫn hạ quality được bằng PerformanceMonitor.)
export function useLiteFallback(): boolean {
  const [noWebgl] = useState(() => {
    if (typeof document === 'undefined') return false
    try {
      const c = document.createElement('canvas')
      const gl = (window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl'))) as WebGLRenderingContext | null
      // nhả context thử nghiệm ngay, khỏi chiếm slot context của canvas chính
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      return !gl
    } catch {
      return true
    }
  })
  return noWebgl
}

// Nghe tiếng THỔI bằng micro để tắt nến. Trả về trạng thái để UI vẽ thanh âm
// lượng + câu nhắc. Đổ đầy `fill` (0..1) khi nghe tiếng thổi đủ lâu rồi gọi
// onBlow. Mọi lỗi (http không phải localhost, khách từ chối quyền, máy không có
// micro) đều trả về `note` để hiện lên chứ không im lặng nữa.
export function useMicBlow(onBlow: () => void) {
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0) // 0..1 mức âm thanh đang nghe được
  const [fill, setFill] = useState(0) // 0..1 tiến độ "thổi"
  const [note, setNote] = useState('')
  const st = useRef<{ ctx: AudioContext | null; stream: MediaStream | null; raf: number; pending: boolean }>({
    ctx: null, stream: null, raf: 0, pending: false,
  })
  const blowRef = useRef(onBlow)
  useEffect(() => {
    blowRef.current = onBlow
  }, [onBlow])

  const stop = useCallback(() => {
    const s = st.current
    s.pending = false
    if (s.raf) {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
    s.stream?.getTracks().forEach((t) => t.stop())
    s.stream = null
    const ctx = s.ctx
    s.ctx = null
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {})
    setOn(false)
    setLevel(0)
    setFill(0)
    setNote('')
  }, [])

  useEffect(() => stop, [stop]) // rời màn -> tắt micro

  const start = useCallback(async () => {
    const s = st.current
    if (s.stream || s.pending) return
    s.pending = true
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) {
      s.pending = false
      setNote('Trình duyệt chỉ mở micro khi web chạy https (hoặc localhost).')
      return
    }
    // Tạo AudioContext NGAY trong lượt bấm (đồng bộ) — iOS/Safari chỉ cho chạy
    // audio nếu context sinh ra từ cử chỉ người dùng, tạo sau `await` là câm.
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      s.pending = false
      setNote('Thiết bị không phân tích được âm thanh.')
      return
    }
    const ctx = new Ctor()
    try {
      await ctx.resume()
    } catch {
      /* Safari cũ: bỏ qua */
    }

    setNote('Đang xin quyền micro...')
    let stream: MediaStream
    try {
      stream = await md.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (err) {
      s.pending = false
      if (ctx.state !== 'closed') void ctx.close().catch(() => {})
      const name = (err as DOMException)?.name
      setNote(
        name === 'NotAllowedError'
          ? 'Bạn cần bấm “Cho phép” khi trình duyệt hỏi quyền micro nhé.'
          : name === 'NotFoundError'
            ? 'Máy này không có micro nào.'
            : 'Không mở được micro, thử lại nhé.',
      )
      return
    }
    // Khách bấm tắt trong lúc đang chờ cấp quyền -> dọn luôn
    if (!s.pending) {
      stream.getTracks().forEach((t) => t.stop())
      if (ctx.state !== 'closed') void ctx.close().catch(() => {})
      return
    }
    try {
      await ctx.resume()
    } catch {
      /* bỏ qua */
    }
    const an = ctx.createAnalyser()
    an.fftSize = 1024
    an.smoothingTimeConstant = 0.5
    ctx.createMediaStreamSource(stream).connect(an)
    const td = new Uint8Array(an.fftSize)
    const fq = new Uint8Array(an.frequencyBinCount)

    st.current = { ctx, stream, raf: 0, pending: false }
    setOn(true)
    setNote('Thổi vào micro nhé!')

    let warm = 0 // bỏ qua mấy frame đầu (tiếng bấm nút)
    let charge = 0
    let idle = 0
    let noise = 0 // mức ồn nền của phòng, học trong ~0.5s đầu
    let calib = 0
    const CALIB_FRAMES = 30
    const tick = () => {
      an.getByteTimeDomainData(td)
      let sum = 0
      for (let i = 0; i < td.length; i++) {
        const d = (td[i] - 128) / 128
        sum += d * d
      }
      const rms = Math.sqrt(sum / td.length)
      an.getByteFrequencyData(fq)
      const a = Math.min(60, fq.length)
      const b = Math.min(200, fq.length) // ~2.8-9.4kHz: tiếng thổi ồn đều dải này
      let hi = 0
      for (let i = a; i < b; i++) hi += fq[i]
      const hiNorm = b > a ? hi / (b - a) / 255 : 0

      // MỘT con số duy nhất cho cả thanh hiển thị lẫn việc phát hiện — trước đây
      // hai bên dùng ngưỡng khác nhau nên có lúc thanh đã đầy mà nến không tắt.
      const lv = Math.min(1, Math.max(rms / 0.16, hiNorm / 0.3))
      setLevel((p) => p + (lv - p) * 0.4)

      if (warm < 20) {
        warm++
      } else if (calib < CALIB_FRAMES) {
        // Học nền ồn của phòng (quạt, tivi...) để ngưỡng thổi không quá cao với
        // máy thu nhỏ, nhưng vẫn không tự kích khi phòng ồn.
        noise += (Math.min(lv, 0.45) - noise) * 0.2
        calib++
      } else {
        const thr = Math.min(0.7, Math.max(0.32, noise + 0.2))
        const blow = lv > thr
        charge = blow ? Math.min(1, charge + 1 / 24) : Math.max(0, charge - 2 / 24)
        setFill(charge)
        if (charge >= 1) {
          stop()
          blowRef.current()
          return
        }
      }
      idle = lv > 0.06 ? 0 : idle + 1
      if (idle === 180) setNote('Micro vẫn đang nghe — bạn thổi mạnh hơn chút nhé!')
      st.current.raf = requestAnimationFrame(tick)
    }
    st.current.raf = requestAnimationFrame(tick)
  }, [stop])

  const toggle = useCallback(() => {
    if (st.current.stream || st.current.pending) stop()
    else void start()
  }, [start, stop])

  return { on, level, fill, note, toggle, stop }
}

// Bam va giu ~1.5s de thoi nen. Tra ve {holding, progress, done, start, cancel}
export function useHoldToBlow(durationMs = 1500, onDone?: () => void) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!holding || done) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs)
      setProgress(p)
      if (p >= 1) {
        setDone(true)
        setHolding(false)
        onDone?.()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [holding, done, durationMs, onDone])

  const start = useCallback(() => {
    setProgress(0)
    setHolding(true)
  }, [])
  const cancel = useCallback(() => {
    setHolding(false)
    setProgress(0)
  }, [])
  return { holding, progress, done, start, cancel, reset: () => { setDone(false); setProgress(0) } }
}

// Chu hien dan kieu typewriter. reduced-motion -> hien ngay.
export function useTypewriter(text: string, cps = 28) {
  const [shown, setShown] = useState(0)
  const [instant, setInstant] = useState(false)
  const done = shown >= text.length

  useEffect(() => {
    setShown(0)
    setInstant(false)
  }, [text])

  useEffect(() => {
    if (done) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(text.length)
      return
    }
    if (instant) {
      setShown(text.length)
      return
    }
    const id = window.setTimeout(() => setShown((s) => Math.min(text.length, s + 1)), 1000 / cps)
    return () => window.clearTimeout(id)
  }, [shown, text, cps, instant, done])

  return { visible: text.slice(0, shown), done, showAll: () => setInstant(true) }
}
