import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { Check, ChevronRight, Heart, Pencil, Trash2, X } from 'lucide-react'
import { useSceneStore } from '../../store/useSceneStore'
import { haptic, playSfx } from '../../audio/sfx'
import {
  clearWish,
  formatWishDate,
  loadWish,
  saveWish,
  WISH_MAX,
  type Wish,
} from '../../lib/wish'
import { flushWishQueue } from '../../lib/wishSync'

const CONFETTI_COLORS = ['#FF8FB1', '#FFC21A', '#BFE8FF', '#D6F5E8', '#D8C7F2', '#FFF8EA']

function JarVisual({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 128 148" className={`wish-jar-svg ${filled ? 'is-filled' : ''}`} aria-hidden>
      <defs>
        <linearGradient id="jar-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
          <stop offset=".45" stopColor="#E8F8FF" stopOpacity=".55" />
          <stop offset="1" stopColor="#BFE8FF" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id="jar-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD978" />
          <stop offset="1" stopColor="#E0A32E" />
        </linearGradient>
      </defs>
      <rect x="35" y="7" width="58" height="15" rx="7" fill="url(#jar-lid)" stroke="#8A5A1E" strokeWidth="1.4" />
      <rect x="41" y="20" width="46" height="7" rx="3.5" fill="#FFF3C4" stroke="#8A5A1E" strokeWidth="1.1" />
      <path
        d="M27 34c0-6 4-9 9-10h56c5 1 9 4 9 10v85c0 9-7 16-16 16H43c-9 0-16-7-16-16V34Z"
        fill="url(#jar-glass)"
        stroke="#7A9EAE"
        strokeWidth="1.6"
      />
      <path d="M33 38c0-4 3-6 6-7h50c3 1 6 3 6 7v78c0 7-5 12-12 12H45c-7 0-12-5-12-12V38Z" fill="#FFFFFF" opacity=".26" />
      <ellipse cx="64" cy="124" rx="32" ry="7" fill="#9BC9D8" opacity=".2" />
      {[
        [45, 96, 0.2],
        [71, 104, 1.1],
        [57, 84, 2.2],
        [82, 88, 0.7],
        [51, 112, 1.7],
      ].map(([cx, cy, delay], i) => (
        <g key={i} className="wish-jar-star" style={{ animationDelay: `${delay}s` }}>
          <path
            d={`M${cx} ${cy - 6}l1.8 3.8 4.2.5-3.1 2.9.8 4.1-3.7-2.1-3.7 2.1.8-4.1-3.1-2.9 4.2-.5L${cx} ${cy - 6}Z`}
            fill={i % 2 === 0 ? '#FFC21A' : '#FF8FB1'}
            stroke="#8A5A1E"
            strokeWidth=".7"
          />
        </g>
      ))}
      <path d="M40 42c-2 1-3 3-3 5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".65" />
    </svg>
  )
}

// Hũ điều ước: một khoảnh khắc chậm sau khi thổi nến. Điều ước lưu trên máy
// (localStorage) và có một bản sao lưu riêng tư; giao diện chỉ nói "của riêng em",
// không nhắc tới việc sao lưu. Nếu trình duyệt chặn lưu, vẫn giữ được trong phiên.
export function WishJar() {
  const musicOn = useSceneStore((s) => s.musicOn)
  const [wish, setWish] = useState<Wish | null>(() => loadWish())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Gửi tiếp các điều ước còn nợ từ lần trước (mất mạng / đóng tab giữa chừng).
  useEffect(() => {
    void flushWishQueue()
  }, [])

  const openJar = () => {
    setOpen(true)
    setEditing(!wish)
    setDraft(wish?.text ?? '')
    setNote('')
    playSfx('paper', musicOn)
  }

  const closeJar = () => {
    setOpen(false)
    setEditing(false)
    setNote('')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeJar()
    }
    window.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => {
      if (editing) textareaRef.current?.focus()
      else dialogRef.current?.focus()
    }, 40)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(id)
    }
  }, [open, editing])

  const submit = () => {
    const result = saveWish(draft)
    if (!result) {
      setNote('Viết một chút đã rồi hẵng thả vào hũ nhé.')
      return
    }
    setWish(result.wish)
    setEditing(false)
    setDraft(result.wish.text)
    setNote(result.persisted ? '' : 'Máy không cho lưu lâu, nhưng điều ước đã nằm trong hũ.')
    playSfx('sparkle', musicOn)
    haptic([10, 30, 14], musicOn)

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      confetti({
        particleCount: 42,
        spread: 58,
        startVelocity: 26,
        gravity: 0.7,
        scalar: 0.7,
        ticks: 120,
        origin: { x: 0.5, y: 0.62 },
        colors: CONFETTI_COLORS,
        zIndex: 95,
      })
    }
  }

  const remove = () => {
    clearWish()
    setWish(null)
    setDraft('')
    setEditing(true)
    setNote('Đã xoá điều ước khỏi hũ.')
    playSfx('paper', musicOn)
  }

  const remaining = WISH_MAX - draft.length

  return (
    <>
      <section className={`wish-jar-card ${wish ? 'is-filled' : ''}`} aria-label="Hũ điều ước">
        <button type="button" className="wish-jar-open" onClick={openJar}>
          <span className="wish-jar-thumb">
            <JarVisual filled={Boolean(wish)} />
          </span>
          <span className="wish-jar-copy">
            <span className="wish-jar-eyebrow">
              <Heart size={10} strokeWidth={0} fill="currentColor" aria-hidden />
              Hũ điều ước
            </span>
            <strong>{wish ? 'Điều ước đang ở trong hũ' : 'Giữ điều ước lại một chút'}</strong>
            <small>
              {wish
                ? `Đã cất ngày ${formatWishDate(wish.createdAt)} · nằm yên trong hũ`
                : 'Viết một câu thôi, rồi thả vào hũ.'}
            </small>
          </span>
          <ChevronRight size={17} strokeWidth={2.6} aria-hidden className="wish-jar-chevron" />
        </button>
      </section>

      {open &&
        createPortal(
          <div className="wish-jar-layer">
          <button
            type="button"
            className="wish-jar-backdrop"
            aria-label="Đóng hũ điều ước"
            onClick={closeJar}
          />
          <div
            ref={dialogRef}
            className="wish-jar-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-jar-title"
            tabIndex={-1}
          >
            <button type="button" className="wish-jar-close" onClick={closeJar} aria-label="Đóng">
              <X size={18} strokeWidth={2.8} aria-hidden />
            </button>

            <div className="wish-jar-hero">
              <JarVisual filled={Boolean(wish)} />
              <div>
                <h2 id="wish-jar-title" className="wish-jar-title">
                  {editing ? 'Giữ điều ước trong hũ' : 'Điều ước của Chanh'}
                </h2>
                <p className="wish-jar-sub">
                  {editing
                    ? 'Một câu thôi. Viết xong là cất vào hũ, của riêng em.'
                    : 'Nó vẫn ở đây, chờ em quay lại.'}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="wish-jar-form">
                <label htmlFor="wish-jar-input" className="wish-jar-label">
                  Điều ước của em
                </label>
                <textarea
                  id="wish-jar-input"
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => {
                    // Không trim/collapse khi đang gõ: nếu không, dấu cách cuối sẽ
                    // bị nuốt và các từ dính vào nhau.
                    setDraft(event.target.value.slice(0, WISH_MAX))
                    setNote('')
                  }}
                  maxLength={WISH_MAX}
                  rows={3}
                  placeholder="Ví dụ: mong cả nhà mình luôn khoẻ, và mình được đi chơi nhiều hơn..."
                  className="wish-jar-input"
                />
                <div className="wish-jar-meta">
                  <span>Còn {remaining} ký tự</span>
                </div>

                {note && (
                  <p className="wish-jar-note" role="status" aria-live="polite">
                    {note}
                  </p>
                )}

                <div className="wish-jar-actions">
                  <button
                    type="button"
                    className="wish-jar-primary"
                    onClick={submit}
                    disabled={!draft.trim()}
                  >
                    <Heart className="wish-jar-heart" size={15} strokeWidth={0} fill="currentColor" aria-hidden />
                    Thả vào hũ
                  </button>
                  <button type="button" className="wish-jar-secondary" onClick={closeJar}>
                    Để sau
                  </button>
                </div>
              </div>
            ) : (
              <div className="wish-jar-saved">
                <blockquote className="wish-jar-quote">“{wish?.text}”</blockquote>
                <p className="wish-jar-date">
                  <Check size={12} strokeWidth={3} aria-hidden />
                  Cất ngày {wish ? formatWishDate(wish.createdAt) : ''}
                </p>
                {note && (
                  <p className="wish-jar-note" role="status" aria-live="polite">
                    {note}
                  </p>
                )}
                <div className="wish-jar-actions">
                  <button
                    type="button"
                    className="wish-jar-primary"
                    onClick={() => {
                      setEditing(true)
                      setDraft(wish?.text ?? '')
                      setNote('')
                    }}
                  >
                    <Pencil size={14} strokeWidth={2.6} aria-hidden />
                    Viết điều ước mới
                  </button>
                  <button type="button" className="wish-jar-secondary" onClick={remove}>
                    <Trash2 size={13} strokeWidth={2.6} aria-hidden />
                    Xoá
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>,
          document.body,
        )}
    </>
  )
}
