import { useState } from 'react'
import confetti from 'canvas-confetti'
import { ArrowRight, CalendarDays, Heart } from 'lucide-react'
import { content } from '../data/content'
import { birthdayStatus } from '../lib/birthday'
import { useSceneStore } from '../store/useSceneStore'
import { UsagiHop } from '../components/UsagiHop'
import { MusicToggle } from '../components/MusicToggle'
import { prewarmMic } from '../hooks/hooks'
import { haptic, playSfx } from '../audio/sfx'

const CONFETTI_COLORS = [
  '#FF8FB1',
  '#FFC21A',
  '#BFE8FF',
  '#D6F5E8',
  '#D8C7F2',
  '#FF9E7A',
  '#FFF8EA',
]

const FLAGS = ['#FF8FB1', '#FFC21A', '#BFE8FF', '#D6F5E8', '#D8C7F2', '#FF9E7A', '#FF8FB1']

function Balloon({
  tone,
  className,
  delay = 0,
}: {
  tone: 'rose' | 'gold' | 'mint'
  className: string
  delay?: number
}) {
  const colors = {
    rose: ['#FFC2D4', '#F0709A'],
    gold: ['#FFE9A8', '#F0B429'],
    mint: ['#CBEFDF', '#6FC3A4'],
  }[tone]

  return (
    <svg
      aria-hidden
      viewBox="0 0 64 132"
      className={`stage-balloon ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <defs>
        <radialGradient id={`balloon-${tone}`} cx="32%" cy="24%" r="76%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".92" />
          <stop offset=".24" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </radialGradient>
      </defs>
      <path
        d="M32 5c13.2 0 22.5 10.1 22.5 23.3 0 11.5-8.4 20.3-19.6 22.2l-2.9 5.1-2.9-5.1C17.9 48.6 9.5 39.8 9.5 28.3 9.5 15.1 18.8 5 32 5Z"
        fill={`url(#balloon-${tone})`}
        stroke="rgba(255,255,255,.72)"
        strokeWidth="1.1"
      />
      <path d="m29.2 57.5 2.8 5.7 2.8-5.7" fill={colors[1]} />
      <path
        d="M32 63c-5.8 12.8 6.6 19.4 0 31.1-6.6 11.8 5.2 20.2 0 32.4"
        fill="none"
        stroke="rgba(137,98,60,.34)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="24"
        cy="21"
        rx="4.8"
        ry="8"
        fill="#FFFFFF"
        opacity=".4"
        transform="rotate(-24 24 21)"
      />
    </svg>
  )
}

// Màn 2: HERO SINH NHẬT — một màn duy nhất, to rõ tên + tuổi + ngày.
// Lời chúc dài đã chuyển sang thư và các màn sau; ở đây chỉ cần cảm giác
// "hôm nay là tiệc của Chanh" trong 3 giây đầu.
export function GreetingScene() {
  const next = useSceneStore((s) => s.next)
  const musicOn = useSceneStore((s) => s.musicOn)
  const setMusicOn = useSceneStore((s) => s.setMusicOn)
  const [leaving, setLeaving] = useState(false)
  const status = birthdayStatus(content.birthdayISO)

  const goNext = () => {
    if (leaving) return
    prewarmMic()
    // Bấm "Vào tiệc thôi" là một cử chỉ hợp lệ: bật nhạc luôn cho có không khí,
    // khách vẫn tắt được bằng đĩa nhạc ở góc.
    if (!musicOn) setMusicOn(true)
    setLeaving(true)
    playSfx('paper', musicOn)
    haptic(10, musicOn)

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      confetti({
        particleCount: 96,
        spread: 78,
        startVelocity: 38,
        gravity: 0.92,
        scalar: 0.95,
        ticks: 180,
        origin: { x: 0.5, y: 0.66 },
        colors: CONFETTI_COLORS,
        zIndex: 90,
      })
      window.setTimeout(
        () =>
          confetti({
            particleCount: 46,
            angle: 60,
            spread: 56,
            startVelocity: 34,
            origin: { x: 0.06, y: 0.74 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        120,
      )
      window.setTimeout(
        () =>
          confetti({
            particleCount: 46,
            angle: 120,
            spread: 56,
            startVelocity: 34,
            origin: { x: 0.94, y: 0.74 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        170,
      )
    }

    window.setTimeout(next, reduced ? 0 : 260)
  }

  return (
    <div className="bday-scene relative isolate min-h-dvh w-full">
      <div aria-hidden className="bday-ambient" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[540px] flex-col justify-center px-3 py-3 sm:px-5 sm:py-8">
        <article
          className={`bday-cover bday-rise relative overflow-hidden p-3.5 sm:p-7 ${
            leaving ? 'pointer-events-none' : ''
          }`}
        >
          <div className="relative z-10 text-center">
            <div className="bday-date-badge">
              <CalendarDays size={13} strokeWidth={2.6} aria-hidden />
              <strong>{status.full}</strong>
              <span>{status.label}</span>
            </div>

            <header className="relative mt-2 sm:mt-3">
              <span aria-hidden className="bday-name-halo" />
              <p className="bday-kicker">Happy Birthday</p>
              <h1 className="anim-pop mt-0.5">
                <span className="bday-name block font-editorial text-[3.9rem] font-semibold leading-[0.88] tracking-[-0.035em] sm:text-[5.2rem]">
                  {content.nickname}
                </span>
              </h1>
              <p className="bday-age-line">
                tuổi {content.age} <span aria-hidden>·</span> một chặng mới
              </p>
            </header>

            <div
              aria-hidden
              className="bday-bunting mx-auto mt-1.5 w-full max-w-[250px] sm:mt-3 sm:max-w-[300px]"
            >
              {FLAGS.map((color, i) => (
                <span
                  key={i}
                  className="bday-flag"
                  style={{
                    left: `${(100 / (FLAGS.length + 1)) * (i + 1)}%`,
                    background: color,
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative mx-auto mt-1 w-full max-w-[330px] sm:mt-3 sm:max-w-[390px]">
              <span aria-hidden className="bday-stage-halo" />

              <Balloon tone="rose" className="stage-balloon--left" delay={0.4} />
              <Balloon tone="gold" className="stage-balloon--right" delay={1.8} />
              <Balloon tone="mint" className="stage-balloon--small" delay={2.6} />

              <div className="bday-stage relative overflow-hidden px-4 pb-2 pt-6 sm:pb-3 sm:pt-8">
                <div aria-hidden className="bday-stage-rays" />
                <span aria-hidden className="bday-stage-glow" />
                <span
                  aria-hidden
                  className="bday-stage-ghost absolute left-1/2 top-4 -translate-x-1/2 select-none font-editorial leading-none"
                >
                  {content.age}
                </span>

                <div className="relative z-20 flex justify-center pt-1">
                  <UsagiHop className="bday-hop" maxWidth={214} height={174} fps={2.4} />
                </div>

                <span aria-hidden className="bday-yaha">
                  Yaha!
                </span>
              </div>

              <div aria-hidden className="bday-stage-shelf" />

              <div aria-hidden className="bday-seal">
                <span className="bday-seal-inner relative">
                  <span className="bday-seal-age relative z-10">{content.age}</span>
                  <span className="bday-seal-label relative z-10">tuổi</span>
                </span>
              </div>
            </div>

            <p className="bday-hero-line">Một bữa tiệc nhỏ, dành riêng cho em.</p>

            <div className="bday-hero-actions">
              <MusicToggle variant="disc" />
              <button
                onClick={goNext}
                className="bday-cta group flex h-[54px] min-w-0 flex-1 items-center justify-between gap-2 rounded-full px-4 text-left transition active:scale-[0.99]"
                aria-label="Vào tiệc thôi"
              >
                <span className="flex items-center gap-2">
                  <Heart size={12} className="text-[#B23A5E]" fill="currentColor" strokeWidth={0} aria-hidden />
                  <span className="text-[13.5px] font-extrabold tracking-[0.02em] text-[#4A2F27] sm:text-sm">
                    Vào tiệc thôi
                  </span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/80 bg-white/60 text-[#B23A5E] transition group-hover:translate-x-0.5 group-hover:bg-white/80">
                  <ArrowRight size={15} strokeWidth={2.6} aria-hidden />
                </span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
