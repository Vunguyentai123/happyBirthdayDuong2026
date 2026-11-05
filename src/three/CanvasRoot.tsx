import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useSceneStore } from '../store/useSceneStore'
import { Backdrop3D } from './Backdrop3D'
import { CakeScene3D } from './CakeScene'
import { GiftScene3D } from './GiftScene'

// MỘT Canvas cố định toàn màn hình, sau giao diện (z-0, pointer-events điều kiện).
// dpr [1, 1.5]. Tự hạ chất lượng khi FPS thấp. Pause khi tab ẩn.
export function CanvasRoot({ lite }: { lite: boolean }) {
  const scene = useSceneStore((s) => s.scene)
  const [quality, setQuality] = useState(1)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (lite) return null

  const interactive = scene === 'candle' || scene === 'gift'

  return (
    <div
      className="canvas-3d"
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      aria-hidden
    >
      <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={paused ? 'never' : 'always'}
        camera={{ position: [0, 1, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <PerformanceMonitor
          onDecline={() => setQuality((q) => (q > 0.5 ? 0.5 : q))}
          onIncline={() => setQuality((q) => (q < 1 ? 1 : q))}
        />
        <hemisphereLight args={['#FFF7EC', '#F4CBA8', 0.55]} />
        <directionalLight position={[4, 6, 4]} intensity={0.7} color="#FFF1DE" />
        <directionalLight position={[-4, 2, 5]} intensity={0.28} color="#FFE4EC" />
        <Suspense fallback={null}>
          {/* Màn bánh cần sân khấu tĩnh hơn: giảm bớt vật thể nền để bánh là tâm điểm. */}
          <Backdrop3D quality={scene === 'candle' ? quality * 0.6 : quality} />
          {scene === 'candle' && <CakeScene3D quality={quality} />}
          {scene === 'gift' && <GiftScene3D quality={quality} />}
        </Suspense>
      </Canvas>
    </div>
  )
}
