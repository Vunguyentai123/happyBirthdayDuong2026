import { useEffect, useRef } from 'react'
import { Hand, Mic, RotateCw, X } from 'lucide-react'
import { micPlatform, type MicProblem } from '../hooks/hooks'

// Bảng trượt từ đáy lên, chỉ hiện khi micro không mở được: bị chặn quyền, mở
// trong Zalo/Facebook, web chạy http, hoặc máy không có micro. Nội dung chia
// bước theo từng loại máy để người lớn tuổi cũng làm theo được.

const TITLES: Record<Exclude<MicProblem, ''>, string> = {
  insecure: 'Cần mở bằng https mới dùng được micro',
  'in-app': 'Ứng dụng đang mở chặn micro',
  denied: 'Micro đang bị chặn',
  'no-device': 'Máy chưa thấy micro nào',
  failed: 'Chưa mở được micro',
}

function stepsFor(problem: Exclude<MicProblem, ''>): string[] {
  if (problem === 'in-app') {
    return [
      'Bạn đang mở link trong một ứng dụng (Zalo, Facebook, Messenger…). Các app này thường chặn micro.',
      'Chạm nút “…” hoặc “⋮” ở góc trên bên phải.',
      'Chọn “Mở bằng trình duyệt” (Chrome hoặc Safari), rồi bấm lại “Thổi bằng micro”.',
    ]
  }

  if (problem === 'insecure') {
    return [
      'Trình duyệt chỉ mở micro khi web chạy https:// (hoặc localhost).',
      'Nếu bạn đang mở địa chỉ dạng http://192.168…, hãy dùng link https://vunguyentai123.github.io/happyBirthdayDuong2026/',
    ]
  }

  if (problem === 'no-device') {
    return [
      'Máy không báo có micro nào đang dùng được.',
      'Bạn vẫn có thể tắt nến bằng cách giữ nút “Giữ để thổi điều ước”.',
    ]
  }

  if (problem === 'failed') {
    return [
      'Có ứng dụng khác đang giữ micro, hoặc trình duyệt vừa chặn tạm thời.',
      'Đóng ứng dụng đó rồi bấm “Thử lại”.',
      'Không được thì giữ nút để thổi bằng tay nhé.',
    ]
  }

  // denied: chỉ đường bật lại quyền theo từng máy
  const platform = micPlatform()
  if (platform === 'ios') {
    return [
      'Chạm nút “aA” (hoặc biểu tượng ổ khoá) trên thanh địa chỉ.',
      'Chọn “Cài đặt trang web” → “Micro” → “Cho phép”.',
      'Tải lại trang rồi bấm “Thổi bằng micro” lần nữa.',
    ]
  }
  if (platform === 'android') {
    return [
      'Chạm ổ khoá (hoặc nút “⋮”) cạnh địa chỉ web.',
      'Chọn “Quyền” → “Micro” → “Cho phép”.',
      'Tải lại trang rồi bấm “Thổi bằng micro” lần nữa.',
    ]
  }
  return [
    'Chạm biểu tượng ổ khoá cạnh địa chỉ.',
    'Bật “Micro” rồi tải lại trang.',
    'Bấm “Thổi bằng micro” lần nữa.',
  ]
}

export function MicHelpSheet({
  open,
  problem,
  onRetry,
  onClose,
}: {
  open: boolean
  problem: MicProblem
  onRetry: () => void
  onClose: () => void
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Khoá cuộn nền để bảng không bị trôi theo trang phía sau.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !problem) return null

  const steps = stepsFor(problem)
  const canRetry = problem !== 'in-app' && problem !== 'insecure'

  return (
    <>
      <div className="mic-sheet-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mic-sheet-title"
        className="mic-sheet"
      >
        <span aria-hidden className="mic-sheet-grip" />
        <button type="button" className="mic-sheet-close" onClick={onClose} aria-label="Đóng hướng dẫn">
          <X size={16} strokeWidth={2.6} aria-hidden />
        </button>

        <div className="mic-sheet-head">
          <span aria-hidden className="mic-sheet-icon">
            <Mic size={18} strokeWidth={2.4} />
          </span>
          <h2 id="mic-sheet-title" className="mic-sheet-title">
            {TITLES[problem]}
          </h2>
        </div>

        <ol className="mic-sheet-steps">
          {steps.map((step, i) => (
            <li key={step}>
              <span aria-hidden className="mic-sheet-num">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mic-sheet-alt">
          <Hand size={13} strokeWidth={2.4} aria-hidden />
          Không cần micro cũng được: cứ giữ nút “Giữ để thổi điều ước”.
        </p>

        <div className="mic-sheet-actions">
          {canRetry && (
            <button type="button" className="paper-cta" onClick={onRetry}>
              <RotateCw size={15} strokeWidth={2.6} aria-hidden />
              Thử lại
            </button>
          )}
          <button type="button" className="paper-cta paper-cta--soft" onClick={onClose}>
            Thổi bằng tay
          </button>
        </div>
      </div>
    </>
  )
}
