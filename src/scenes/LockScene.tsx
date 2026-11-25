import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { BirthdayTicket } from '../components/BirthdayTicket'
import { haptic, playSfx } from '../audio/sfx'
import { CompanionStrip } from './lock/CompanionStrip'
import { GateDoor } from './lock/GateDoor'
import { GateOpened } from './lock/GateOpened'

const CONFETTI_COLORS = ['#FF8FB1', '#FFC21A', '#BFE8FF', '#D6F5E8', '#D8C7F2', '#FFF8EA']

// Trang 1: THIỆP MỜI — Momonga soát vé ở cửa, Usagi đứng chờ bên trong.
// Không còn câu đố kỷ niệm: khách chỉ cần "check-in" tấm vé có tên mình.
export function LockScene() {
  const gatePassed = useSceneStore((s) => s.gatePassed)
  const setGatePassed = useSceneStore((s) => s.setGatePassed)
  const setUnlocked = useSceneStore((s) => s.setUnlocked)
  const next = useSceneStore((s) => s.next)
  const musicOn = useSceneStore((s) => s.musicOn)

  const [opened, setOpened] = useState(gatePassed)
  const [stamped, setStamped] = useState(gatePassed)
  const [checking, setChecking] = useState(false)

  const blockLine = useMemo(
    () => pickRandom(['Vé đâu? Đưa tui soát cái coi.', 'Đứng lại, để tui xem vé đã.']),
    [],
  )
  const unlockLine = useMemo(() => pickRandom(content.momongaLines.unlock), [])

  const checkIn = () => {
    if (opened || stamped || checking) return
    setChecking(true)
    // Đóng dấu vé trước, rồi mới mở cửa: khoảnh khắc "được nhận vào" có nhịp.
    setStamped(true)
    playSfx('checkin', musicOn)
    haptic([12, 40, 18], musicOn)

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      confetti({
        particleCount: 90,
        spread: 74,
        startVelocity: 34,
        gravity: 0.95,
        scalar: 0.9,
        ticks: 180,
        origin: { x: 0.5, y: 0.58 },
        colors: CONFETTI_COLORS,
        zIndex: 90,
      })
      window.setTimeout(
        () =>
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 52,
            startVelocity: 30,
            origin: { x: 0.08, y: 0.72 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        130,
      )
      window.setTimeout(
        () =>
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 52,
            startVelocity: 30,
            origin: { x: 0.92, y: 0.72 },
            colors: CONFETTI_COLORS,
            zIndex: 90,
          }),
        180,
      )
    }

    window.setTimeout(
      () => {
        setOpened(true)
        setUnlocked(true)
        setGatePassed(true)
        setChecking(false)
      },
      reduced ? 0 : 720,
    )
  }

  const momongaLine = opened ? unlockLine : blockLine
  const usagiLine = opened
    ? 'Yaha! Vào tiệc thôi! Hôm nay Chanh là khách VIP!'
    : 'Chanh tới rồi! Momonga mở cửa đi!'

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_26%,rgba(255,250,242,.82)_0%,rgba(255,247,240,.46)_52%,rgba(255,247,240,.12)_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1080px] flex-1 flex-col">
        <header className="mx-auto max-w-[760px] text-center">
          <p className="gate-kicker">{content.birthdayLabel} · {content.nickname}</p>
          <h1 className="gate-title">
            Một tấm vé nhỏ
            <span className="gate-title-em">dành cho {content.nickname}</span>
          </h1>
          <p className="gate-sub">
            {opened ? 'Vé hợp lệ. Bữa tiệc bắt đầu!' : 'Đưa vé cho Momonga nhé.'}
          </p>
        </header>

        <div
          className={`grid min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 ${
            opened ? 'mt-4 sm:mt-8' : 'mt-5 sm:mt-8'
          }`}
        >
          {/* Sân khấu cửa */}
          <div className="gate-alcove relative min-w-0 overflow-hidden rounded-[1.6rem] px-3 pb-4 pt-8 sm:rounded-[2rem] sm:px-6 sm:pb-8 sm:pt-12">
            <div className="gate-spotlight" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-5 top-4 flex items-center justify-between"
            >
              <span className="h-px w-9 bg-[#E7C77B]/45" />
              <span className="h-1 w-1 rotate-45 bg-[#FFC21A]/70" />
              <span className="h-px w-9 bg-[#E7C77B]/45" />
            </div>

            <GateDoor opened={opened || stamped} />
          </div>

          {/* Thiệp mời / vé */}
          <div className={`gate-invitation relative flex min-w-0 flex-col overflow-hidden rounded-[2rem] ${opened ? 'p-4 sm:p-7' : 'p-4 sm:p-7'}`}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-2.5 rounded-[calc(2rem-0.625rem)] border border-[#E7C77B]/35"
            />

            <div className="relative">
              {opened ? (
                <GateOpened usagiLine={usagiLine} momongaLine={momongaLine} onNext={next} />
              ) : (
                <>
                  <BirthdayTicket checkedIn={stamped} onCheckIn={checkIn} disabled={checking} />
                  <CompanionStrip momongaLine={momongaLine} usagiLine={usagiLine} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
