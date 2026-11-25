import { Check, Heart } from 'lucide-react'
import { content } from '../data/content'
import { birthdayStatus } from '../lib/birthday'

// Tấm vé vào tiệc thay cho câu đố kỷ niệm. Momonga soát vé, Usagi dẫn khách
// vào. Vé có cuống xé, mã vé và dấu "đã check-in" để màn cổng vẫn có một
// khoảnh khắc chạm thật, nhưng không còn cảm giác "bài kiểm tra".
export function BirthdayTicket({
  checkedIn,
  onCheckIn,
  disabled = false,
}: {
  checkedIn: boolean
  onCheckIn: () => void
  disabled?: boolean
}) {
  const status = birthdayStatus(content.birthdayISO)
  const [day, month] = status.short.split('.')

  return (
    <div className={`ticket ${checkedIn ? 'is-checked' : ''}`}>
      <div className="ticket-main">
        <div className="ticket-topline">
          <span className="ticket-eyebrow">
            <Heart size={10} strokeWidth={0} fill="currentColor" aria-hidden />
            {content.ticket.eyebrow}
          </span>
          <span className="ticket-status" aria-live="polite">
            {status.label}
          </span>
        </div>

        <h2 className="ticket-title">{content.ticket.title}</h2>
        <p className="ticket-sub">{content.ticket.subtitle}</p>

        <div className="ticket-body">
          <div className="ticket-date" aria-label={`Ngày ${status.full}`}>
            <span className="ticket-date-day">{day}</span>
            <span className="ticket-date-month">tháng {Number(month)}</span>
          </div>

          <div className="ticket-info">
            <span className="ticket-info-label">Khách mời</span>
            <span className="ticket-info-value">{content.nickname}</span>
            <span className="ticket-info-label">Hạng vé</span>
            <span className="ticket-info-value">VIP · tuổi {content.age}</span>
          </div>
        </div>

        {!checkedIn ? (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={disabled}
            className="ticket-checkin"
          >
            <Check size={16} strokeWidth={3} aria-hidden />
            Check-in
          </button>
        ) : (
          <div className="ticket-stamp" role="status">
            <Check size={15} strokeWidth={3.2} aria-hidden />
            Đã check-in
          </div>
        )}

        <p className="ticket-note">{content.ticket.note}</p>
        <span className="sr-only">{content.ticket.code}</span>
      </div>

      <div className="ticket-stub" aria-hidden>
        <span className="ticket-stub-title">ADMIT ONE</span>
        <span className="ticket-stub-code">{content.age}</span>
        <span className="ticket-stub-code-label">tuổi</span>
        <span className="ticket-barcode" />
        <span className="ticket-stub-meta">{content.ticket.code}</span>
      </div>
    </div>
  )
}
