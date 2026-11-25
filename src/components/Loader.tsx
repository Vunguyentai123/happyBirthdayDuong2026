import { useState } from 'react'

const BALLOONS = ['#FF8FB1', '#FFC21A', '#BFE8FF', '#D6F5E8', '#D8C7F2']

export function Loader({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100)
  const [popped, setPopped] = useState<boolean[]>(() => BALLOONS.map(() => false))

  const pop = (index: number) => {
    setPopped((current) => {
      if (current[index]) return current
      const next = [...current]
      next[index] = true
      return next
    })
  }

  return (
    <div className="loader-screen">
      <div className="loader-card">
        <span aria-hidden className="loader-cake">
          🎂
        </span>
        <p className="loader-text">Usagi &amp; Momonga đang gói quà...</p>

        <div className="loader-balloons" aria-label="Bấm bóng bay trong lúc chờ">
          {BALLOONS.map((color, index) => (
            <button
              key={color + index}
              type="button"
              className={`loader-balloon ${popped[index] ? 'is-popped' : ''}`}
              style={{ background: color, animationDelay: `${index * 0.18}s` }}
              onClick={() => pop(index)}
              disabled={popped[index]}
              aria-label={`Bóng bay ${index + 1}${popped[index] ? ' đã nổ' : ''}`}
              aria-pressed={popped[index]}
            >
              <span aria-hidden />
            </button>
          ))}
        </div>

        <div
          className="loader-track"
          role="progressbar"
          aria-label="Đang tải"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span className="loader-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}
