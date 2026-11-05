import { useState } from 'react'

// Ảnh nguyên nền trong khung bo tròn, viền trắng, hơi nghiêng.
// File thiếu trong public/cards/ thì bỏ qua âm thầm (render null).
export function StickerCard({ src, caption, tilt = -3 }: { src: string; caption?: string; tilt?: number }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <figure
      className="bg-white rounded-2xl border-4 border-white shadow-xl p-2 w-40 shrink-0"
      style={{ transform: `rotate(${tilt}deg)`, ['--tilt' as string]: `${tilt}deg` }}
    >
      <img src={src} alt={caption ?? 'sticker'} className="rounded-xl w-full h-28 object-cover" onError={() => setOk(false)} />
      {caption && <figcaption className="text-xs font-bold text-center pt-1">{caption}</figcaption>}
    </figure>
  )
}
