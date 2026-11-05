import { useCallback, useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import {
  ArrowRight,
  Flame,
  Mic,
  MicOff,
  Sparkles,
  Wind,
} from 'lucide-react'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { useHoldToBlow, useMicBlow } from '../hooks/hooks'

// Màn 3 THỔI ĐIỀU ƯỚC: bánh 3D nhiều tầng, nến thật có lửa run và khói sau khi
// thổi. Trang được dàn như một tấm thiệp: tiêu đề thư pháp, lời nhắn của Usagi,
// sân khấu bánh ở giữa. Sau khi ước, khay dưới cùng chuyển thành hai lượt thoại
// (Usagi trên, Momonga dưới) và một tấm vé dẫn sang chặng kế tiếp.
export function CandleScene({ lite }: { lite: boolean }) {
  const wishBlown = useSceneStore((s) => s.wishBlown)
  const setWishBlown = useSceneStore((s) => s.setWishBlown)
  const next = useSceneStore((s) => s.next)
  const setProgress = useSceneStore((s) => s.setProgress)

  const wishLine = useMemo(() => pickRandom(content.usagiLines.blowCandle), [])
  const sneakLine = useMemo(() => pickRandom(content.momongaLines.momongaSneaksCake), [])
  const caughtLine = useMemo(() => pickRandom(content.usagiLines.momongaSneaksCake), [])

  const blowOut = useCallback(() => {
    setWishBlown(true)
    setProgress(1)
    if (lite) {
      confetti({
        particleCount: 160,
        spread: 92,
        origin: { y: 0.46 },
        colors: ['#F7C9D4', '#F6E3A1', '#C9A25D', '#B85C74', '#FFF8E7'],
      })
    }
  }, [lite, setWishBlown, setProgress])

  const { holding, progress: holdProgress, start, cancel } = useHoldToBlow(1500, blowOut)
  const mic = useMicBlow(blowOut)

  // Nền sáng dần theo hơi thổi; nhả tay hoặc tắt micro giữa chừng thì trả về 0.
  useEffect(() => {
    if (wishBlown) return
    if (holding) setProgress(holdProgress)
    else if (mic.on) setProgress(mic.fill)
    else setProgress(0)
  }, [wishBlown, holding, holdProgress, mic.on, mic.fill, setProgress])

  const percent = Math.round((holding ? holdProgress : mic.on ? mic.fill : 0) * 100)

  return (
    <div className="candle-scene relative isolate min-h-dvh w-full overflow-hidden">
      <div aria-hidden className="candle-ambient" />

      <div
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pt-[4.5rem] sm:max-w-[480px] sm:px-5 sm:pt-6 lg:max-w-[520px] lg:px-6 lg:pt-8"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <header className="candle-head">
          <h1 className="candle-title">
            Thổi nến, <em>ước một điều.</em>
          </h1>
          <p className="candle-sub">Nhắm mắt thật chặt và giữ điều ước trong tim nhé.</p>
        </header>

        {!wishBlown && (
          <div className="candle-note anim-pop">
            <span className="candle-note-avatar">
              <Character name="usagi" role="hop2" maxWidth={46} />
            </span>
            <span className="candle-note-copy">
              <span className="candle-note-name">Usagi</span>
              <span className="candle-note-line">{wishLine}</span>
            </span>
            <Sparkles className="candle-note-spark" size={14} strokeWidth={2.2} aria-hidden />
          </div>
        )}

        <section className={`candle-stage ${wishBlown ? 'is-wished' : ''}`} aria-label="Bánh sinh nhật 3D">
          <div aria-hidden className="candle-stage-aura" />
          <div aria-hidden className="candle-stage-ring" />
          <div aria-hidden className="candle-stage-sparks">
            <i /><i /><i /><i /><i /><i />
          </div>

          {lite && (
            <div className="candle-lite-cake anim-float">
              <div className="candle-lite-emoji">🎂</div>
              <p>{wishBlown ? 'Điều ước đã bay lên! Yaha!' : 'Bánh kem 17 tuổi'}</p>
            </div>
          )}

          <div className="candle-seal" aria-hidden>
            <span>{content.age}</span>
            <em>tuổi</em>
          </div>
        </section>

        <div className={`candle-dock ${wishBlown ? 'is-wished' : ''}`}>
          {!wishBlown ? (
            <>
              <button
                type="button"
                onPointerDown={start}
                onPointerUp={cancel}
                onPointerLeave={cancel}
                onPointerCancel={cancel}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Giữ để thổi điều ước"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className={`candle-blow ${holding ? 'is-holding' : ''}`}
              >
                <span className="candle-blow-fill" style={{ width: `${percent}%` }} />
                <span className="candle-blow-shine" aria-hidden />
                <span className="candle-blow-label">
                  <Flame size={20} strokeWidth={2.3} aria-hidden />
                  Giữ để thổi điều ước
                </span>
                {holding && <span className="candle-blow-pct">{percent}%</span>}
              </button>

              <div className="candle-tools">
                <button
                  type="button"
                  onClick={mic.toggle}
                  aria-pressed={mic.on}
                  aria-label={mic.on ? 'Tắt micro' : 'Thổi nến bằng micro'}
                  className={`candle-mic ${mic.on ? 'is-listening' : ''}`}
                >
                  {mic.on ? <MicOff size={15} strokeWidth={2.6} /> : <Mic size={15} strokeWidth={2.6} />}
                  <span>{mic.on ? 'Đang nghe...' : 'Thổi bằng micro'}</span>
                  {mic.on && <i className="candle-mic-pulse" aria-hidden />}
                </button>
              </div>

              {mic.on && (
                <div className="candle-level">
                  <Wind size={13} strokeWidth={2.6} aria-hidden />
                  <span className="candle-level-track">
                    <span
                      className="candle-level-fill"
                      style={{ width: `${Math.round(Math.max(mic.level, mic.fill) * 100)}%` }}
                    />
                  </span>
                </div>
              )}

              {mic.note && (
                <p className="candle-note-hint" role="status" aria-live="polite">
                  {mic.note}
                </p>
              )}
            </>
          ) : (
            <div className="candle-after anim-pop">
              <div className="candle-after-head">
                <p className="candle-after-title">
                  <span aria-hidden />
                  Điều ước đã bay lên trời
                  <span aria-hidden />
                </p>
              </div>

              <div className="candle-exchange" aria-live="polite">
                <div className="candle-turn">
                  <span className="candle-turn-face">
                    <Character name="usagi" role="cheer" maxWidth={38} alt="" />
                  </span>
                  <span className="candle-turn-copy">
                    <span className="candle-turn-name">Usagi</span>
                    <span className="candle-turn-line">{caughtLine}</span>
                  </span>
                </div>

                <span className="candle-turn-divider" aria-hidden>
                  <i />
                </span>

                <div className="candle-turn is-momonga is-caught">
                  <span className="candle-turn-face">
                    <Character name="momonga" role="angel" maxWidth={38} alt="" />
                  </span>
                  <span className="candle-turn-copy">
                    <span className="candle-turn-name">
                      Momonga
                      <em className="candle-turn-tag">Bị bắt quả tang!</em>
                    </span>
                    <span className="candle-turn-line">{sneakLine}</span>
                  </span>
                </div>
              </div>

              <div className="candle-nav">
                <button
                  type="button"
                  onClick={next}
                  className="candle-next"
                  aria-label="Tiếp tục hành trình: album ký ức"
                >
                  <span className="candle-next-copy">
                    <strong>Album ký ức</strong>
                  </span>
                  <span className="candle-next-arrow" aria-hidden>
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
