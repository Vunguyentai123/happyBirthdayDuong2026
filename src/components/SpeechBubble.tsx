import type { ReactNode } from 'react'

export function SpeechBubble({
  speaker,
  children,
  color = 'white',
}: {
  speaker: 'Usagi' | 'Momonga'
  children: ReactNode
  color?: 'white' | 'lemon' | 'pink' | 'mint'
}) {
  const bg =
    color === 'lemon' ? 'bg-[#FFF3B0]' : color === 'pink' ? 'bg-[#FFE4EA]' : color === 'mint' ? 'bg-[#D8F5E7]' : 'bg-white'
  const nameColor = speaker === 'Usagi' ? 'text-amber-500' : 'text-sky-500'
  return (
    <div className={`relative rounded-3xl border-2 border-white shadow-lg px-4 py-3 ${bg} anim-pop max-w-full`}>
      <div className={`text-xs font-extrabold tracking-wide ${nameColor}`}>{speaker}</div>
      <div className="text-base leading-snug font-semibold">{children}</div>
      <div className={`absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-white ${bg}`} />
    </div>
  )
}
