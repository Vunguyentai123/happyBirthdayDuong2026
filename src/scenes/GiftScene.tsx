import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { Camera, Download, Heart, RotateCcw, X } from 'lucide-react'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { PageFrame, PageHead } from '../components/PaperPage'
import { loadWish, type Wish } from '../lib/wish'
import { createRecapImage, downloadRecap } from '../lib/recap'
import { generatedPhotos } from '../data/photos.generated'
import { asset } from '../data/assets'
import { haptic, playSfx } from '../audio/sfx'

// Trang 6: MÓN QUÀ — hộp 3D mở ra thành sổ coupon. Sau đó là tấm ảnh kỷ niệm
// được ghép ngay trên máy: 2 ảnh khách chọn + tên + tuổi + ngày + điều ước
// (tuỳ chọn). Ảnh dọc xếp cạnh nhau, ảnh ngang xếp trên dưới.
export function GiftScene({ lite }: { lite: boolean }) {
  const giftOpen = useSceneStore((s) => s.giftOpen)
  const setGiftOpen = useSceneStore((s) => s.setGiftOpen)
  const restart = useSceneStore((s) => s.restart)
  const musicOn = useSceneStore((s) => s.musicOn)

  const goodbyeU = useMemo(() => pickRandom(content.usagiLines.goodbye), [])
  const goodbyeM = useMemo(() => pickRandom(content.momongaLines.goodbye), [])
  const giftLine = useMemo(() => pickRandom(content.momongaLines.gift), [])
  const wish = useMemo<Wish | null>(() => loadWish(), [])

  const [recap, setRecap] = useState<string | null>(null)
  const [recapLoading, setRecapLoading] = useState(false)
  const [recapError, setRecapError] = useState('')
  const [includeWish, setIncludeWish] = useState(false)
  const [pickedPhotos, setPickedPhotos] = useState<string[]>(() => {
    if (generatedPhotos.length === 0) return []
    const picks = [generatedPhotos[0]]
    const second = generatedPhotos[3] ?? generatedPhotos[1]
    if (second) picks.push(second)
    return picks
  })

  const toggleRecapPhoto = (photo: string) => {
    setRecapError('')
    setPickedPhotos((current) => {
      if (current.includes(photo)) return current.filter((item) => item !== photo)
      // Đã đủ 2 ảnh: ảnh vừa chạm thay ảnh chọn trước đó, luôn giữ đúng 2 ảnh.
      if (current.length >= 2) return [current[current.length - 1] ?? photo, photo]
      return [...current, photo]
    })
  }

  const openGift = () => {
    if (giftOpen) return
    setGiftOpen(true)
    playSfx('ribbon', musicOn)
    haptic([10, 30, 12], musicOn)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    if (lite) confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } })
    window.setTimeout(() => {
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } })
    }, 800)
  }

  const makeRecap = async () => {
    if (recapLoading) return
    if (pickedPhotos.length !== 2) {
      setRecapError('Chọn đủ 2 ảnh đã nhé.')
      return
    }
    setRecapLoading(true)
    setRecapError('')
    playSfx('paper', musicOn)
    try {
      const data = await createRecapImage({ wish: includeWish ? wish : null, photos: pickedPhotos })
      setRecap(data)
      playSfx('sparkle', musicOn)
      haptic(12, musicOn)
    } catch {
      setRecapError('Chưa tạo được ảnh. Thử lại giúp mình nhé.')
    } finally {
      setRecapLoading(false)
    }
  }

  return (
    <PageFrame>
      <PageHead
        title="Sổ quà"
        accent="của Chanh"
        sub="Ba tấm coupon nhỏ, đổi lúc nào cũng được."
      />

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
        <div className="anim-pop">
          <div className="coupon-book">
            <div className="coupon-book-head">
              <span className="coupon-book-eyebrow">
                <Heart size={10} strokeWidth={0} fill="currentColor" aria-hidden />
                {content.giftTitle}
              </span>
              <p>Hạn dùng: mãi mãi.</p>
            </div>

            <div className="coupon-list">
              {content.giftCoupons.map((coupon, index) => (
                <article className={`coupon coupon--${index + 1}`} key={coupon.code}>
                  <span className="coupon-hole" aria-hidden />
                  <div className="coupon-main">
                    <span className="coupon-code">{coupon.code}</span>
                    <h3>{coupon.title}</h3>
                    <p>{coupon.body}</p>
                  </div>
                  <div className="coupon-side" aria-hidden>
                    <span>Hạn dùng</span>
                    <strong>mãi mãi</strong>
                    <span className="coupon-heart">♡</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

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

          <section className="recap-card" aria-label="Ảnh kỷ niệm">
            <div className="recap-copy">
              <span className="coupon-book-eyebrow">
                <Camera size={12} strokeWidth={2.6} aria-hidden />
                Quà mang về
              </span>
              <h2>Tấm ảnh của bữa tiệc hôm nay</h2>
              <p>Chọn 2 tấm ảnh em thích. Ảnh dọc xếp cạnh nhau, ảnh ngang xếp trên dưới.</p>
              {wish && (
                <label className="recap-check">
                  <input
                    type="checkbox"
                    checked={includeWish}
                    onChange={(event) => setIncludeWish(event.target.checked)}
                  />
                  In điều ước lên ảnh
                </label>
              )}
            </div>

            {generatedPhotos.length > 0 && (
              <div className="recap-picker">
                <div className="recap-picker-head">
                  <span>Chọn 2 ảnh đưa vào tấm vé</span>
                  <span className="recap-picker-count" aria-live="polite">
                    {pickedPhotos.length}/2
                  </span>
                </div>
                <div className="recap-photo-grid" role="group" aria-label="Chọn 2 ảnh cho ảnh kỷ niệm">
                  {generatedPhotos.map((photo, index) => {
                    const order = pickedPhotos.indexOf(photo)
                    const selected = order >= 0
                    return (
                      <button
                        key={photo}
                        type="button"
                        className={`recap-photo${selected ? ' is-picked' : ''}`}
                        aria-pressed={selected}
                        aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} ảnh ${index + 1}`}
                        onClick={() => toggleRecapPhoto(photo)}
                      >
                        <img src={asset(photo)} alt="" loading="lazy" />
                        {selected && (
                          <span className="recap-photo-badge" aria-hidden>
                            {order + 1}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="recap-picker-hint">
                  {pickedPhotos.length === 2
                    ? 'Ảnh dọc xếp cạnh nhau · ảnh ngang xếp trên dưới.'
                    : 'Chạm thêm một ảnh nữa nhé.'}
                </p>
              </div>
            )}

            <button
              type="button"
              className="paper-cta recap-make"
              onClick={makeRecap}
              disabled={recapLoading || pickedPhotos.length !== 2}
            >
              <Camera size={16} strokeWidth={2.6} aria-hidden />
              {recapLoading ? 'Đang ghép ảnh...' : 'Tạo ảnh kỷ niệm'}
            </button>
            {recapError && (
              <p className="recap-error" role="status" aria-live="polite">
                {recapError}
              </p>
            )}
          </section>

          <button type="button" onClick={restart} className="paper-cta paper-cta--soft">
            <RotateCcw size={15} strokeWidth={2.6} aria-hidden />
            Xem lại từ đầu
          </button>
        </div>
      )}

      {recap &&
        createPortal(
          <div className="recap-layer" role="dialog" aria-modal="true" aria-label="Ảnh kỷ niệm">
          <button
            type="button"
            className="recap-backdrop"
            aria-label="Đóng ảnh kỷ niệm"
            onClick={() => setRecap(null)}
          />
          <div className="recap-dialog">
            <button
              type="button"
              className="recap-close"
              onClick={() => setRecap(null)}
              aria-label="Đóng"
            >
              <X size={18} strokeWidth={2.8} aria-hidden />
            </button>
            <img src={recap} alt={`Ảnh kỷ niệm sinh nhật ${content.nickname} ${content.age} tuổi`} />
            <div className="recap-actions">
              <button type="button" className="paper-cta" onClick={() => downloadRecap(recap)}>
                <Download size={15} strokeWidth={2.6} aria-hidden />
                Lưu ảnh
              </button>
              <p>Trên iPhone, nhấn giữ ảnh để lưu vào Photos nhé.</p>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </PageFrame>
  )
}
