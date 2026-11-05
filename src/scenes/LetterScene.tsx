import { useState } from 'react'
import { Heart } from 'lucide-react'
import { content } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { Character } from '../components/Character'
import { NextButton, PageFrame, PageHead } from '../components/PaperPage'
import { useTypewriter } from '../hooks/hooks'

// Trang 5: LÁ THƯ — phong bì dán sáp ong, mở ra thành trang giấy kẻ dòng.
// Chữ hiện dần như đang viết; có nút "Hiện hết" cho ai muốn đọc nhanh.
export function LetterScene() {
  const next = useSceneStore((s) => s.next)
  const [open, setOpen] = useState(false)
  const { visible, done, showAll } = useTypewriter(open ? content.letterBody : '', 45)

  return (
    <PageFrame>
      <PageHead title={content.letterTitle} sub="Momonga thức cả đêm để viết đó." />

      {!open ? (
        <div className="letter-stage">
          <div className="letter-cast">
            <Character name="momonga" role="writing" maxWidth={126} alt="Momonga đang viết thư" />
            <Character name="usagi" role="waiting" maxWidth={104} alt="Usagi nằm chờ" />
          </div>

          <button
            type="button"
            className="letter-envelope"
            onClick={() => setOpen(true)}
            aria-label="Mở lá thư"
          >
            <span aria-hidden className="letter-envelope-flap" />
            <span aria-hidden className="letter-envelope-stamp">
              <Heart size={11} fill="currentColor" strokeWidth={0} />
            </span>
            <span aria-hidden className="letter-envelope-seal">
              <Heart size={18} fill="currentColor" strokeWidth={0} />
            </span>
          </button>

          <p className="letter-tap">
            <Heart size={9} fill="currentColor" strokeWidth={0} aria-hidden />
            Chạm vào phong bì nhé
          </p>
        </div>
      ) : (
        <article className="letter-paper anim-pop">
          <p className="letter-body">{visible}</p>
          {!done && (
            <button type="button" className="letter-more" onClick={showAll}>
              Hiện hết
            </button>
          )}
        </article>
      )}

      {open && done && <NextButton onClick={next} label="Món quà cuối" />}
    </PageFrame>
  )
}
