import { useMemo } from 'react'
import confetti from 'canvas-confetti'
import { RotateCcw } from 'lucide-react'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { PageFrame, PageHead } from '../components/PaperPage'

// Trang 6: MÓN QUÀ — hộp quà 3D (CanvasRoot) hoặc hộp giấy CSS khi máy không có
// WebGL. Mở quà xong là tấm thiệp nội dung + lời tạm biệt + nút xem lại.
export function GiftScene({ lite }: { lite: boolean }) {
  const giftOpen = useSceneStore((s) => s.giftOpen)
  const setGiftOpen = useSceneStore((s) => s.setGiftOpen)
  const restart = useSceneStore((s) => s.restart)
  const goodbyeU = useMemo(() => pickRandom(content.usagiLines.goodbye), [])
  const goodbyeM = useMemo(() => pickRandom(content.momongaLines.goodbye), [])
  const giftLine = useMemo(() => pickRandom(content.momongaLines.gift), [])

  const openGift = () => {
    if (giftOpen) return
    setGiftOpen(true)
    if (lite) confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } })
    window.setTimeout(() => {
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } })
    }, 800)
  }

  return (
    <PageFrame>
      <PageHead title="Món quà" accent="nhỏ xinh" sub="Momonga yểm bùa rồi, mở nhẹ tay nha." />

      <section className={`gift-stage ${giftOpen ? 'is-open' : ''}`} aria-label="Hộp quà">
        <span aria-hidden className="gift-aura" />

        {lite && (
          <button
            type="button"
            onClick={openGift}
            className={`gift-box ${giftOpen ? 'is-open' : ''}`}
            aria-label="Mở hộp quà"
          >
            <span aria-hidden className="gift-box-body" />
            <span aria-hidden className="gift-box-lid" />
            <span aria-hidden className="gift-box-bow" />
          </button>
        )}
      </section>

      {!giftOpen ? (
        <>
          <div className="album-note album-note--momonga">
            <span className="album-note-face">
              <Character name="momonga" role="magic" maxWidth={40} alt="" />
            </span>
            <p className="min-w-0">
              <span className="album-note-name">Momonga</span>
              <span className="album-note-text">{giftLine}</span>
            </p>
          </div>

          <button type="button" onClick={openGift} className="paper-cta">
            Mở quà
          </button>
        </>
      ) : (
        <div className="gift-card paper-card anim-pop">
          <h2 className="gift-title">{content.giftTitle}</h2>
          <p className="gift-body">{content.giftBody}</p>

          <div className="gift-cast">
            <Character name="usagi" role="cheer" maxWidth={104} alt="Usagi reo vui" />
            <Character name="momonga" role="wave" maxWidth={116} alt="Momonga vẫy tay" />
          </div>

          <div className="gift-whispers">
            <p>
              <span>Usagi</span>
              {goodbyeU}
            </p>
            <p className="is-momonga">
              <span>Momonga</span>
              {goodbyeM}
            </p>
          </div>

          <button type="button" onClick={restart} className="paper-cta paper-cta--soft">
            <RotateCcw size={15} strokeWidth={2.6} aria-hidden />
            Xem lại từ đầu
          </button>
        </div>
      )}
    </PageFrame>
  )
}
