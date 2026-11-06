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

// ---------------------------------------------------------------------------
// Micro thổi nến
// ---------------------------------------------------------------------------

/** Vì sao micro không mở được — quyết định nội dung bảng hướng dẫn. */
export type MicProblem = '' | 'insecure' | 'in-app' | 'denied' | 'no-device' | 'failed'

export type MicPlatform = 'ios' | 'android' | 'desktop'

export function micPlatform(): MicPlatform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

// Zalo, Facebook, Messenger, Instagram, TikTok... đều là webview riêng và
// thường chặn micro. Nhận ra để hướng dẫn mở bằng trình duyệt thật.
const IN_APP_RE = /Zalo|FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|TikTok|; wv\)/i

export function isInAppBrowser(): boolean {
  return typeof navigator !== 'undefined' && IN_APP_RE.test(navigator.userAgent)
}

// Tắt bộ lọc cho giọng nói: tiếng thổi là dải ồn rộng, bật khử ồn sẽ nuốt mất.
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
}

// Chỉ tự xin quyền một lần mỗi phiên (đóng tab là reset) để không làm phiền.
let autoAsked = false

// Trạng thái quyền micro, nếu trình duyệt cho biết (Chrome có, Safari thường không).
async function micPermissionState(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  try {
    const perms = navigator.permissions
    if (!perms?.query) return 'unknown'
    const status = await perms.query({ name: 'microphone' as PermissionName })
    return status.state
  } catch {
    return 'unknown'
  }
}

// --- Xin quyền SỚM ngay trong cú chạm "Đi tiếp" ------------------------------
// iPhone/Safari chỉ hiện hộp thoại xin quyền khi getUserMedia nằm cùng nhịp với
// một cử chỉ chạm. Hàm này được gọi thẳng trong onClick của nút chuyển màn, giữ
// lại luồng micro để màn thổi nến dùng tiếp — nhờ vậy khách chỉ phải bấm
// "Cho phép"/"Không cho phép" một lần, không cần chạm thêm gì.
let prewarm: Promise<MediaStream> | null = null
let prewarmCtx: AudioContext | null = null

function audioCtor(): typeof AudioContext | null {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

export function prewarmMic(): void {
  if (prewarm) return
  const md = navigator.mediaDevices
  if (!window.isSecureContext || !md?.getUserMedia) return
  // AudioContext cũng phải mở trong cử chỉ chạm: iPhone để nó ở trạng thái
  // suspended nếu tạo sau đó, và khi suspended thì không phân tích được âm thanh.
  if (!prewarmCtx) {
    const Ctor = audioCtor()
    if (Ctor) {
      prewarmCtx = new Ctor()
      void prewarmCtx.resume().catch(() => {})
    }
  }
  let p: Promise<MediaStream>
  try {
    p = md.getUserMedia({ audio: AUDIO_CONSTRAINTS })
  } catch {
    return
  }
  prewarm = p
  // Khách đổi ý, không sang màn thổi nến -> tắt micro sau 8s cho đỡ tốn pin.
  window.setTimeout(() => {
    if (prewarm === p) {
      prewarm = null
      p.then((s) => s.getTracks().forEach((t) => t.stop())).catch(() => {})
    }
    // Context chưa được màn thổi nến lấy đi thì đóng luôn.
    const c = prewarmCtx
    prewarmCtx = null
    if (c && c.state !== 'closed') void c.close().catch(() => {})
  }, 8000)
  p.catch(() => {
    if (prewarm === p) prewarm = null
  })
}

function takePrewarm(): Promise<MediaStream> | null {
  const p = prewarm
  prewarm = null
  return p
}

function takePrewarmCtx(): AudioContext | null {
  const c = prewarmCtx
  prewarmCtx = null
  return c
}

// Nghe tiếng THỔI bằng micro để tắt nến. Trả về trạng thái để UI vẽ thanh âm
// lượng + câu nhắc. Mọi lỗi (http không phải localhost, khách từ chối quyền, mở
// trong Zalo/Facebook, máy không có micro) đều trả về `problem` để mở bảng
// hướng dẫn cấp quyền thay vì im lặng.
export function useMicBlow(onBlow: () => void) {
  const [on, setOn] = useState(false)
  const [level, setLevel] = useState(0) // 0..1 mức âm thanh đang nghe được
  const [fill, setFill] = useState(0) // 0..1 tiến độ "thổi"
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState<MicProblem>('')
  const [helpOpen, setHelpOpen] = useState(false)
  const st = useRef<{ ctx: AudioContext | null; stream: MediaStream | null; raf: number; pending: boolean }>({
    ctx: null, stream: null, raf: 0, pending: false,
  })
  // Khách chủ động tắt micro thì đừng tự bật lại khi quay lại tab.
  const manualOff = useRef(false)
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

  // Mở bảng hướng dẫn + câu nhắc ngắn trong khay. `quiet` dùng cho lượt xin
  // quyền tự động: khách vừa bấm "Không cho phép" thì chỉ nhắc nhẹ, không bung
  // bảng hướng dẫn ra giữa màn hình.
  const fail = useCallback((p: MicProblem, msg: string, quiet = false) => {
    setProblem(p)
    setNote(msg)
    if (!quiet) setHelpOpen(true)
  }, [])

  const start = useCallback(async (quiet = false) => {
    const s = st.current
    if (s.stream || s.pending) return
    manualOff.current = false

    // 1) Môi trường có cho dùng micro không? (https + trình duyệt hỗ trợ)
    const md = navigator.mediaDevices
    if (!window.isSecureContext || !md?.getUserMedia) {
      fail(isInAppBrowser() ? 'in-app' : 'insecure', 'Micro chỉ mở được khi web chạy https.', quiet)
      return
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      fail('failed', 'Thiết bị này không phân tích được âm thanh.', quiet)
      return
    }

    s.pending = true
    setProblem('')
    setHelpOpen(false)
    setNote('Đang xin quyền micro...')

    // 2) AudioContext tạo ngay trong cử chỉ chạm — iOS/Safari không cho tạo sau await.
    //    Dùng lại context đã mở sẵn ở màn trước nếu có.
    const ctx = takePrewarmCtx() ?? new Ctor()

    // 3) Dùng luồng đã xin sẵn từ cú chạm "Đi tiếp" nếu có (iPhone chỉ hiện hộp
    //    thoại cấp quyền khi lời gọi nằm trong cử chỉ chạm). Không có thì gọi
    //    ngay tại đây — với nút micro, đây cũng là một cử chỉ chạm hợp lệ.
    const pre = takePrewarm()
    let gum: Promise<MediaStream>
    if (pre) {
      gum = pre
    } else {
      try {
        gum = md.getUserMedia({ audio: AUDIO_CONSTRAINTS })
      } catch (err) {
        gum = Promise.reject(err)
      }
    }
    // Gắn handler ngay: lúc còn chờ resume, promise này có thể reject trước khi
    // ta await -> trình duyệt báo "unhandled rejection" và bảng lỗi không hiện.
    gum.catch(() => {})

    // resume() không được chặn luồng: trên Safari nó có thể treo mãi nếu chưa
    // có thêm cử chỉ. Chạy song song rồi chờ có giới hạn.
    const resumed = ctx.resume().catch(() => {})

    // Dịch lỗi của trình duyệt thành việc cần làm.
    const failFor = (err: unknown) => {
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        fail(
          isInAppBrowser() ? 'in-app' : 'denied',
          quiet
            ? 'Chưa có quyền micro — chạm nút micro để xem cách bật nhé.'
            : 'Micro đang bị chặn — xem cách bật bên dưới nhé.',
          quiet,
        )
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        fail('no-device', 'Máy này không có micro nào.', quiet)
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        fail('failed', 'Micro đang bị ứng dụng khác dùng mất rồi.', quiet)
      } else {
        fail('failed', 'Không mở được micro, thử lại nhé.', quiet)
      }
    }

    let stream: MediaStream
    try {
      stream = await gum
    } catch (err) {
      // Một số máy Android từ chối bộ lọc âm thanh -> thử lại cấu hình tối giản.
      const name = (err as DOMException)?.name
      if (name === 'OverconstrainedError' || name === 'NotSupportedError' || name === 'TypeError') {
        try {
          stream = await md.getUserMedia({ audio: true })
        } catch (err2) {
          s.pending = false
          if (ctx.state !== 'closed') void ctx.close().catch(() => {})
          failFor(err2)
          return
        }
      } else {
        s.pending = false
        if (ctx.state !== 'closed') void ctx.close().catch(() => {})
        failFor(err)
        return
      }
    }
    // Khách bấm tắt trong lúc đang chờ cấp quyền -> dọn luôn
    if (!s.pending) {
      stream.getTracks().forEach((t) => t.stop())
      if (ctx.state !== 'closed') void ctx.close().catch(() => {})
      return
    }
    // Chờ resume xong, nhưng tối đa 1,2s để không treo giao diện.
    await Promise.race([resumed, new Promise((r) => setTimeout(r, 1200))])
    // Khách bấm tắt trong lúc chờ -> không dựng lại micro đã tắt.
    if (!s.pending) {
      stream.getTracks().forEach((t) => t.stop())
      if (ctx.state !== 'closed') void ctx.close().catch(() => {})
      return
    }
    // iOS đôi khi vẫn để context ở trạng thái suspended: thêm một lần chạm nữa là chạy.
    if (ctx.state !== 'running') {
      window.addEventListener('pointerdown', () => void ctx.resume().catch(() => {}), { once: true })
    }

    const an = ctx.createAnalyser()
    an.fftSize = 1024
    an.smoothingTimeConstant = 0.5
    ctx.createMediaStreamSource(stream).connect(an)
    const td = new Uint8Array(an.fftSize)
    const fq = new Uint8Array(an.frequencyBinCount)

    st.current = { ctx, stream, raf: 0, pending: false }
    setOn(true)
    setProblem('')
    setHelpOpen(false)
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
  }, [fail, stop])

  const toggle = useCallback(() => {
    if (st.current.stream || st.current.pending) {
      manualOff.current = true
      stop()
    } else {
      manualOff.current = false
      void start(false)
    }
  }, [start, stop])

  const retry = useCallback(() => {
    setHelpOpen(false)
    void start(false)
  }, [start])

  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const openHelp = useCallback(() => setHelpOpen(true), [])

  // Xin quyền TỰ ĐỘNG khi vừa vào màn thổi nến: khách chỉ cần bấm "Cho phép"
  // trong hộp thoại của điện thoại. Nếu máy đã từ chối từ trước thì không hỏi
  // lại (trình duyệt cũng không hiện hộp thoại nữa), chỉ nhắc nhẹ trong khay.
  const autoStart = useCallback(async () => {
    if (st.current.stream || st.current.pending) return
    const state = await micPermissionState()
    if (state === 'denied') {
      const inApp = isInAppBrowser()
      setProblem(inApp ? 'in-app' : 'denied')
      setNote(
        inApp
          ? 'Mở link bằng trình duyệt để dùng micro — chạm nút micro xem cách nhé.'
          : 'Micro đang bị chặn — chạm nút micro để xem cách bật nhé.',
      )
      return
    }
    // Chỉ tự hỏi một lần mỗi phiên; đã cấp quyền rồi thì lần nào vào cũng bật.
    if (state !== 'granted') {
      if (autoAsked) return
      autoAsked = true
    }
    void start(true)
  }, [start])

  // Khách ra Cài đặt bật quyền rồi quay lại tab: tự mở micro luôn, khỏi bấm lại.
  // (Trừ khi chính khách vừa chủ động tắt micro.)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (manualOff.current) return
      if (st.current.stream || st.current.pending) return
      void start(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [start])

  return { on, level, fill, note, problem, helpOpen, toggle, stop, retry, closeHelp, openHelp, autoStart }
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
