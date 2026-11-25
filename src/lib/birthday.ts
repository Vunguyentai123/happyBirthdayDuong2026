// Ngày sinh nhật tính theo giờ máy, không gọi mạng.
// Tách riêng để vé, hero và ảnh kỷ niệm dùng cùng một nguồn.

export type BirthdayPhase = 'before' | 'today' | 'after' | 'invalid'

export interface BirthdayStatus {
  phase: BirthdayPhase
  /** Số ngày còn lại (trước) hoặc đã qua (sau). */
  days: number
  /** Câu ngắn hiển thị cạnh ngày. */
  label: string
  short: string
  full: string
}

const DAY = 86_400_000

function localDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

export function birthdayStatus(iso: string, now = new Date()): BirthdayStatus {
  const parsed = parseISO(iso)
  if (!parsed) {
    return { phase: 'invalid', days: 0, label: 'Một ngày thật đặc biệt', short: '', full: '' }
  }

  const target = new Date(parsed.year, parsed.month - 1, parsed.day)
  const diff = Math.round((localDayNumber(target) - localDayNumber(now)) / DAY)

  const short = `${String(parsed.day).padStart(2, '0')}.${String(parsed.month).padStart(2, '0')}`
  const full = `${short}.${parsed.year}`

  if (diff > 0) {
    return {
      phase: 'before',
      days: diff,
      label: `Còn ${diff} ngày nữa`,
      short,
      full,
    }
  }
  if (diff === 0) {
    return { phase: 'today', days: 0, label: 'Hôm nay rồi!', short, full }
  }
  return {
    phase: 'after',
    days: Math.abs(diff),
    label: `Kỷ niệm ${short}`,
    short,
    full,
  }
}
