import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { content, pickRandom } from '../data/content'
import { generatedPhotos } from '../data/photos.generated'
import { asset } from '../data/assets'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { NextButton, PageFrame, PageHead } from '../components/PaperPage'

// Trang 4: ALBUM KÝ ỨC — polaroid dán băng dính trên dây đèn, vuốt ngang,
// chấm chuyển ảnh, bấm để phóng to. Ảnh không tự chạy nữa: Chanh giữ nhịp
// đọc caption của mình. Caption ngắn in dưới ảnh, câu dài dùng cho alt/zoom.
const samplePhotos = [
  asset('/characters/usagi-08.png'),
  asset('/characters/momonga-04.png'),
  asset('/characters/momonga-02.png'),
]
const SLIDE_MS = 520

export function PhotosScene() {
  const next = useSceneStore((s) => s.next)
  const photos = useMemo(
    () =>
      (generatedPhotos.length > 0 ? generatedPhotos.slice(0, 20) : samplePhotos).map((p) => asset(p)),
    [],
  )
  const captions = useMemo(
    () =>
      photos.map((_, i) =>
        content.photoCaptions[i % content.photoCaptions.length] ?? `Kỷ niệm ${i + 1}`,
      ),
    [photos],
  )
  const notes = useMemo(
    () =>
      photos.map((_, i) => content.photoNotes[i % content.photoNotes.length] ?? captions[i] ?? ''),
    [photos, captions],
  )
  const [idx, setIdx] = useState(0)
  const [zoom, setZoom] = useState<number | null>(null)
  const [touchX, setTouchX] = useState<number | null>(null)

  // 2/3 số lượt bình luận do Usagi nói, 1/3 do Momonga; mỗi lượt kéo dài 3 ảnh.
  const round = Math.floor(idx / 3)
  const comment = useMemo(() => {
    const speaker = round % 3 === 2 ? 'Momonga' : 'Usagi'
    const pool =
      speaker === 'Momonga' ? content.momongaLines.photoComment : content.usagiLines.photoComment
    return { speaker, text: pickRandom(pool) } as const
  }, [round])

  const go = (d: number) => setIdx((i) => (i + d + photos.length) % photos.length)

  useEffect(() => {
    if (zoom === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  return (
    <PageFrame>
      <PageHead title="Album" accent="của Chanh" sub="Mỗi tấm là một ngày mình đã giữ lại." />

      <section className="album-stage" aria-roledescription="carousel" aria-label="Album ảnh kỷ niệm">
        <div aria-hidden className="album-lights">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <div
          className="album-viewport"
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX === null) return
            const dx = e.changedTouches[0].clientX - touchX
            if (dx < -40) go(1)
            if (dx > 40) go(-1)
            setTouchX(null)
          }}
        >
          <div
            className="album-track"
            style={{ transform: `translateX(-${idx * 100}%)`, transitionDuration: `${SLIDE_MS}ms` }}
          >
            {photos.map((photo, i) => (
              <div className="album-slide" key={photo + i}>
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  className="album-frame"
                  aria-label={`Phóng to ảnh ${i + 1}: ${notes[i]}`}
                >
                  <img src={photo} alt={notes[i]} loading={i === 0 ? 'eager' : 'lazy'} />
                  <span className="album-caption">{captions[i]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="album-controls">
          <button type="button" onClick={() => go(-1)} className="album-arrow" aria-label="Ảnh trước">
            <ChevronLeft size={18} strokeWidth={2.6} aria-hidden />
          </button>

          <div className="album-dots">
            {photos.map((photo, i) => (
              <button
                key={`dot-${photo}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className="album-dot"
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === idx ? 'true' : undefined}
              />
            ))}
          </div>

          <button type="button" onClick={() => go(1)} className="album-arrow" aria-label="Ảnh sau">
            <ChevronRight size={18} strokeWidth={2.6} aria-hidden />
          </button>
        </div>
      </section>

      <div className={`album-note ${comment.speaker === 'Momonga' ? 'album-note--momonga' : ''}`}>
        <span className="album-note-face">
          <Character
            name={comment.speaker === 'Usagi' ? 'usagi' : 'momonga'}
            role={comment.speaker === 'Usagi' ? 'bounce' : 'wave'}
            maxWidth={40}
            alt=""
          />
        </span>
        <p className="min-w-0">
          <span className="album-note-name">{comment.speaker}</span>
          <span className="album-note-text">{comment.text}</span>
        </p>
      </div>

      <NextButton onClick={next} label="Mở lá thư" />

      {zoom !== null &&
        createPortal(
          <div
            className="photo-zoom"
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh phóng to"
          onClick={() => setZoom(null)}
        >
          <figure className="photo-zoom-figure">
            <img src={photos[zoom]} alt={notes[zoom]} />
            <figcaption>{notes[zoom]}</figcaption>
          </figure>
          <button
            type="button"
            className="photo-zoom-close"
            onClick={() => setZoom(null)}
            aria-label="Đóng ảnh"
          >
            <X size={18} strokeWidth={2.8} aria-hidden />
          </button>
          </div>,
          document.body,
        )}
    </PageFrame>
  )
}
