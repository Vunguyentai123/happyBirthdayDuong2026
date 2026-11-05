import { useEffect, useState } from 'react'
import { usagiHopFrames } from '../data/characters'

// Xoay vòng usagi-01..06 ở 5-6fps + tịnh tiến lên xuống. Dùng ở màn chào.
// Khung ngoài cố định kích thước để đổi frame không làm layout giật;
// chỉ ảnh bên trong dùng transform nên các phần tử khác đứng im.
export function UsagiHop({ className = '', fps = 5.5, maxWidth = 200, height = 190 }: { className?: string; fps?: number; maxWidth?: number; height?: number }) {
  const [i, setI] = useState(0)
  const [up, setUp] = useState(false)

  // Preload để không chớp khi đổi frame
  useEffect(() => {
    usagiHopFrames.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setI((v) => (v + 1) % usagiHopFrames.length)
      setUp((u) => !u)
    }, 1000 / fps)
    return () => window.clearInterval(id)
  }, [fps])

  return (
    <div
      className={className}
      style={{ width: '100%', maxWidth, height, position: 'relative', overflow: 'visible' }}
      aria-hidden={false}
    >
      <img
        src={usagiHopFrames[i]}
        alt="Usagi nhay tung tang"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `translateY(${up ? -12 : 0}px)`,
          transition: `transform ${1000 / fps}ms ease-in-out`,
          willChange: 'transform',
        }}
      />
    </div>
  )
}
