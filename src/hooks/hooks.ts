import { useCallback, useEffect, useMemo, useState } from 'react'
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
// Tách theo code point (Array.from) để emoji không bị cắt đôi giữa chừng.
export function useTypewriter(text: string, cps = 28) {
  const chars = useMemo(() => Array.from(text), [text])
  const total = chars.length
  const [shown, setShown] = useState(0)
  const [instant, setInstant] = useState(false)
  const done = shown >= total

  useEffect(() => {
    setShown(0)
    setInstant(false)
  }, [text])

  useEffect(() => {
    if (done) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(total)
      return
    }
    if (instant) {
      setShown(total)
      return
    }
    const id = window.setTimeout(() => setShown((s) => Math.min(total, s + 1)), 1000 / cps)
    return () => window.clearTimeout(id)
  }, [shown, total, cps, instant, done])

  return { visible: chars.slice(0, shown).join(''), done, showAll: () => setInstant(true) }
}
