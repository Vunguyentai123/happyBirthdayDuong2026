import type { ReactNode } from 'react'
import { ArrowRight, Heart } from 'lucide-react'

// Khung chung cho ba trang giấy (album, thư, quà): cùng nền ambient, cùng nhịp
// tiêu đề serif và cùng kiểu nút giấy để ba trang không bị lệch tông với
// cổng/thiệp chào/bánh nến.
export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="page-scene">
      <div aria-hidden className="page-ambient" />
      <div className="page-shell">{children}</div>
    </div>
  )
}

export function PageHead({
  title,
  accent,
  sub,
}: {
  title: string
  accent?: string
  sub?: string
}) {
  return (
    <header className="page-head">
      <h1 className="page-title">
        {title}
        {accent && <em>{accent}</em>}
      </h1>
      {sub && <p className="page-sub">{sub}</p>}
    </header>
  )
}

export function NextButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button type="button" onClick={onClick} className="paper-cta group">
      <span className="paper-cta-heart" aria-hidden>
        <Heart size={11} fill="currentColor" strokeWidth={0} />
      </span>
      <span>{label}</span>
      <ArrowRight
        size={16}
        strokeWidth={2.6}
        className="paper-cta-arrow"
        aria-hidden
      />
    </button>
  )
}
