import { useState } from 'react'
import { getCharacterFile, type CharacterName } from '../data/characters'

interface Props {
  name: CharacterName
  role: string
  alt?: string
  className?: string
  maxWidth?: number
}

const missingLogged = new Set<string>()

export function Character({ name, role, alt, className = '', maxWidth = 240 }: Props) {
  const src = getCharacterFile(name, role)
  const [failed, setFailed] = useState(false)

  if (failed) {
    if (!missingLogged.has(src)) {
      missingLogged.add(src)
      console.warn(`[Character] missing file: ${src}`)
    }
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-pink-100 border-4 border-white shadow ${className}`}
        style={{ width: maxWidth, height: maxWidth }}
        role="img"
        aria-label={alt ?? `${name} ${role} (placeholder)`}
      >
        <span className="text-sm font-bold px-2 text-center">{alt ?? `${name}:${role}`}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt ?? `${name} ${role}`}
      className={className}
      style={{ maxWidth, width: '100%', height: 'auto' }}
      loading="eager"
      onError={() => setFailed(true)}
      // Giới hạn kích thước theo naturalWidth / 1.5 để không vỡ nét
      onLoad={(e) => {
        const img = e.currentTarget
        if (img.naturalWidth > 0) {
          img.style.maxWidth = `${Math.min(maxWidth, img.naturalWidth / 1.5)}px`
        }
      }}
    />
  )
}
