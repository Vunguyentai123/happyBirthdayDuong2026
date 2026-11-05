import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { ArrowRight, Heart } from 'lucide-react'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { UsagiHop } from '../components/UsagiHop'
import { MusicToggle } from '../components/MusicToggle'

const CONFETTI_COLORS = [
  '#9C3F56',
  '#B76A7A',
  '#C9A25D',
  '#F5D6D0',
  '#F2C94C',
  '#F4E4BE',
  '#8FBFA8',
]

const FLAGS = ['#7C2C44', '#E7A3AF', '#D8AF5C', '#A9CDBD', '#C9828D', '#E7C77B', '#7C2C44']

const STAGE_SPARKS = [
  { left: '8%', top: '30%', size: 5, color: '#C9A25D', delay: '0s', round: true },
  { left: '17%', top: '70%', size: 4, color: '#B76A7A', delay: '1.4s', round: false },
  { left: '84%', top: '36%', size: 6, color: '#E7A3AF', delay: '.7s', round: true },
  { left: '90%', top: '67%', size: 4, color: '#C9A25D', delay: '2.1s', round: false },
  { left: '73%', top: '15%', size: 3, color: '#7C2C44', delay: '1.8s', round: true },
  { left: '24%', top: '16%', size: 3, color: '#A9CDBD', delay: '2.6s', round: true },
]

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
    rose: ['#F7B3C1', '#E56F8A'],
    gold: ['#F7E3AC', '#D2A64D'],
    mint: ['#CDE9DA', '#8CBEAA'],
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

function WishNote({
  name,
  role,
  quote,
  accent,
  delay,
}: {
  name: 'Usagi' | 'Momonga'
  role: string
  quote: string
  accent: string
  delay?: string
}) {
  const isUsagi = name === 'Usagi'

  return (
    <figure
      className={`wish-card bday-rise ${isUsagi ? 'wish-card--usagi' : 'wish-card--momonga'}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative z-10 flex items-start gap-3">
        <span
          className={`wish-medallion ${isUsagi ? 'wish-medallion--usagi' : 'wish-medallion--momonga'}`}
        >
          <span className="wish-medallion-inner">
            <Character name={isUsagi ? 'usagi' : 'momonga'} role={role} maxWidth={50} />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`wish-name ${accent}`}>
              <span className="mr-1 inline-block h-1 w-1 rounded-full bg-current align-middle" />
              {name}
            </span>
            <span className="wish-hand">{isUsagi ? 'Yaha!' : 'Hehe!'}</span>
          </div>
          <blockquote className="wish-quote">“{quote}”</blockquote>
        </div>
      </div>
      <span aria-hidden className="wish-tail" />
    </figure>
  )
}

// Màn 2 CHÀO: thiệp sinh nhật dạng poster giấy mỹ thuật.
// Bố cục một cột trên điện thoại, mở thành hai trang trên màn hình rộng:
// trang trái là tiêu đề + sân khấu Usagi, trang phải là thiệp chúc + nút đi tiếp.
export function GreetingScene() {
  const next = useSceneStore((s) => s.next)
  const u = useMemo(() => pickRandom(content.usagiLines.greeting), [])
  const m = useMemo(() => pickRandom(content.momongaLines.greeting), [])
  const [leaving, setLeaving] = useState(false)

  const goNext = () => {
    if (leaving) return
    setLeaving(true)

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      confetti({
        particleCount: 80,
        spread: 72,
        startVelocity: 38,
        gravity: 0.9,
        scalar: 0.9,
        ticks: 160,
        origin: { x: 0.5, y: 0.64 },
        colors: CONFETTI_COLORS,
        zIndex: 90,
      })
      window.setTimeout(
        () =>
          confetti({
            particleCount: 42,
            angle: 60,
            spread: 55,
            startVelocity: 34,
            origin: { x: 0.08, y: 0.72 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        110,
      )
      window.setTimeout(
        () =>
          confetti({
            particleCount: 42,
            angle: 120,
            spread: 55,
            startVelocity: 34,
            origin: { x: 0.92, y: 0.72 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        160,
      )
    }

    window.setTimeout(next, reduced ? 0 : 240)
  }

  return (
    <div className="bday-scene relative isolate min-h-dvh w-full">
      <div aria-hidden className="bday-ambient" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-3 py-2 sm:px-5 sm:py-8 lg:max-w-[1080px] lg:px-8">
        <article
          className={`bday-cover bday-rise relative overflow-hidden p-3 sm:p-6 lg:p-9 ${
            leaving ? 'pointer-events-none' : ''
          }`}
        >
          <div className="relative z-10 lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:gap-9">
            {/* Trang trái: lời chào + sân khấu Usagi */}
            <div className="bday-hero">
              <header className="relative text-center lg:text-left">
                <div className="relative">
                  <span aria-hidden className="bday-name-halo" />

                  <h1 className="anim-pop mt-1">
                    <span className="block font-editorial text-[1.12rem] italic leading-tight tracking-[0.02em] text-[#9C3F56] sm:text-[1.35rem]">
                      Chúc mừng sinh nhật
                    </span>
                    <span className="bday-name mt-1 block font-editorial text-[3.8rem] font-semibold leading-[0.9] tracking-[-0.035em] sm:text-[5rem] lg:text-[5.5rem]">
                      {content.nickname}
                    </span>
                  </h1>
                </div>
              </header>

              {/* Dây cờ nhỏ nối tiêu đề với sân khấu */}
              <div aria-hidden className="bday-bunting mx-auto mt-2 w-full max-w-[288px] lg:mx-0 sm:mt-5">
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

              <div className="relative mx-auto mt-2 w-full max-w-[360px] sm:mt-4 sm:max-w-[405px] lg:max-w-[430px]">
                <span aria-hidden className="bday-stage-halo" />

                <Balloon tone="rose" className="stage-balloon--left" delay={0.4} />
                <Balloon tone="gold" className="stage-balloon--right" delay={1.8} />
                <Balloon tone="mint" className="stage-balloon--small" delay={2.6} />

                <div className="bday-stage relative overflow-hidden px-4 pb-2.5 pt-7 sm:pb-3 sm:pt-9">
                  <div aria-hidden className="bday-stage-rays" />
                  <span aria-hidden className="bday-stage-glow" />
                  <span
                    aria-hidden
                    className="bday-stage-ghost absolute left-1/2 top-6 -translate-x-1/2 select-none font-editorial leading-none"
                  >
                    {content.age}
                  </span>

                  {STAGE_SPARKS.map((spark, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="bday-spark"
                      style={{
                        left: spark.left,
                        top: spark.top,
                        width: spark.size,
                        height: spark.size,
                        background: spark.color,
                        borderRadius: spark.round ? '999px' : '1px',
                        animationDelay: spark.delay,
                      }}
                    />
                  ))}

                  <div className="relative z-20 flex justify-center pt-1">
                    <UsagiHop className="bday-hop" maxWidth={228} height={188} fps={2.4} />
                  </div>

                  <span aria-hidden className="bday-yaha">
                    Yaha!
                  </span>
                </div>

                <div aria-hidden className="bday-stage-shelf" />

                {/* Con dấu tuổi nằm đè lên góc vòm */}
                <div aria-hidden className="bday-seal">
                  <span className="bday-seal-inner relative">
                    <span className="bday-seal-age relative z-10">{content.age}</span>
                    <span className="bday-seal-label relative z-10">tuổi</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Trang phải: hai lời chúc + nhạc + CTA */}
            <section className="bday-notes bday-rise relative mt-3 sm:mt-5 lg:mt-0" style={{ animationDelay: '120ms' }}>
              <div className="relative z-10">
                <div className="mt-1 space-y-2.5 sm:mt-2 sm:space-y-3">
                  <WishNote
                    name="Usagi"
                    role="cheer"
                    quote={u}
                    accent="text-[#B76A7A]"
                    delay="80ms"
                  />

                  <div aria-hidden className="flex items-center gap-3 px-3 py-0.5">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A25D]/30" />
                    <span className="grid h-6 w-6 rotate-45 place-items-center rounded-[4px] border border-[#C9A25D]/35 bg-[#FFF9EE] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                      <Heart
                        size={8}
                        className="-rotate-45 text-[#9C3F56]"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A25D]/30" />
                  </div>

                  <WishNote
                    name="Momonga"
                    role="wave"
                    quote={m}
                    accent="text-[#4F8570]"
                    delay="160ms"
                  />
                </div>

                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center gap-2.5">
                    <MusicToggle variant="disc" />
                    <button
                      onClick={goNext}
                      className="bday-cta group flex h-[54px] min-w-0 flex-1 items-center justify-between gap-2 rounded-full px-4 text-left transition active:scale-[0.99]"
                    >
                      <span className="flex items-center gap-2">
                        <Heart
                          size={12}
                          className="text-[#9C2F52]"
                          fill="currentColor"
                          strokeWidth={0}
                          aria-hidden
                        />
                        <span className="text-[13.5px] font-extrabold tracking-[0.02em] text-[#5C1B33] sm:text-sm">
                          Đi tiếp
                        </span>
                      </span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/80 bg-white/55 text-[#9C2F52] transition group-hover:translate-x-0.5 group-hover:bg-white/70">
                        <ArrowRight size={15} strokeWidth={2.6} aria-hidden />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
