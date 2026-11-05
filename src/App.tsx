import { lazy, Suspense, useEffect, useState } from 'react'
import './index.css'
import { SceneManager } from './scenes/SceneManager'
import { Loader } from './components/Loader'
import { MusicPlayer } from './components/MusicPlayer'
import { useLiteFallback } from './hooks/hooks'
import { usagiHopFrames, momongaRoles } from './data/characters'

const CanvasRoot = lazy(() => import('./three/CanvasRoot').then((m) => ({ default: m.CanvasRoot })))

const preloadList = [...usagiHopFrames, ...Object.values(momongaRoles).map((r) => r.file), '/characters/usagi-07.png', '/characters/usagi-08.png', '/characters/usagi-09.png']

export default function App() {
  // Chỉ còn 1 giao diện: bản đầy đủ 3D. Cờ lite chỉ bật khi máy không có WebGL
  // (không vẽ được canvas 3D) — không có nút cho khách tự đổi qua lại nữa.
  const lite = useLiteFallback()
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let done = 0
    let cancelled = false
    const total = preloadList.length
    const tick = () => {
      done++
      if (!cancelled) setProgress(done / total)
      if (done >= total && !cancelled) window.setTimeout(() => setReady(true), 250)
    }
    // Timeout dự phòng 4s để không kẹt loader
    const fallback = window.setTimeout(() => setReady(true), 4000)
    preloadList.forEach((src) => {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = src
    })
    return () => {
      cancelled = true
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <>
      {lite ? (
        <div className="lite-bg" aria-hidden />
      ) : (
        <Suspense fallback={null}>
          <CanvasRoot lite={lite} />
        </Suspense>
      )}
      {!ready && <Loader progress={progress} />}
      <MusicPlayer />
      <SceneManager lite={lite} />
    </>
  )
}
