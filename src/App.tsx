import { lazy, Suspense, useEffect, useState } from 'react'
import './index.css'
import { SceneManager } from './scenes/SceneManager'
import { Loader } from './components/Loader'
import { MusicPlayer } from './components/MusicPlayer'
import { useLiteFallback } from './hooks/hooks'
import { usagiHopFrames, momongaRoles } from './data/characters'
import { asset } from './data/assets'
import { unlockAudio } from './audio/sfx'

const CanvasRoot = lazy(() => import('./three/CanvasRoot').then((m) => ({ default: m.CanvasRoot })))

const preloadList = [
  ...usagiHopFrames,
  ...Object.values(momongaRoles).map((r) => r.file),
  asset('/characters/usagi-07.png'),
  asset('/characters/usagi-08.png'),
  asset('/characters/usagi-09.png'),
]

export default function App() {
  // Chỉ còn 1 giao diện: bản đầy đủ 3D. Cờ lite chỉ bật khi máy không có WebGL
  // (không vẽ được canvas 3D) — không có nút cho khách tự đổi qua lại nữa.
  const lite = useLiteFallback()
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  // Trình duyệt chỉ cho phát âm thanh sau một cử chỉ thật. Mở AudioContext ở
  // lần chạm/phím đầu tiên để nhạc hộp và SFX dùng lại được ngay sau đó.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

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
