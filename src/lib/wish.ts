// Hũ điều ước: lưu trên máy của Dương (localStorage) và gửi một bản ghi sang
// Firebase Realtime Database để chủ project còn đọc lại (xem `wishSync.ts`).
// Chữ trên giao diện vẫn giữ giọng "của riêng em": không nói gì về việc sao lưu.
// Nếu trình duyệt chặn localStorage (chế độ riêng tư), vẫn giữ trong bộ nhớ
// của phiên hiện tại để màn thổi nến không bị chặn.

import { queueWishDeleted, queueWishSync } from './wishSync'

export const WISH_MAX = 120
const WISH_KEY = 'chanh:wish:v1'

export interface Wish {
  text: string
  createdAt: string
}

export interface SaveWishResult {
  wish: Wish
  persisted: boolean
}

let memoryWish: Wish | null = null

export function normalizeWish(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, WISH_MAX)
}

function isWish(value: unknown): value is Wish {
  if (!value || typeof value !== 'object') return false
  const wish = value as Partial<Wish>
  return typeof wish.text === 'string' && wish.text.length > 0 && typeof wish.createdAt === 'string'
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function loadWish(): Wish | null {
  if (memoryWish) return memoryWish
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(WISH_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isWish(parsed)) return null
    const text = normalizeWish(parsed.text)
    if (!text) return null
    memoryWish = { text, createdAt: parsed.createdAt }
    return memoryWish
  } catch {
    return null
  }
}

export function saveWish(value: string): SaveWishResult | null {
  const text = normalizeWish(value)
  if (!text) return null
  const wish: Wish = { text, createdAt: new Date().toISOString() }
  memoryWish = wish
  // Sao lưu lên Firebase: gọi rồi đi tiếp, mạng lỗi thì nằm lại trong hàng đợi.
  queueWishSync(wish)
  const store = storage()
  if (!store) return { wish, persisted: false }
  try {
    store.setItem(WISH_KEY, JSON.stringify(wish))
    return { wish, persisted: true }
  } catch {
    return { wish, persisted: false }
  }
}

export function clearWish(): void {
  // Lấy bản hiện tại trước khi xoá để Firebase giữ lại đúng điều ước vừa xoá.
  const current = memoryWish ?? loadWish()
  memoryWish = null
  const store = storage()
  try {
    store?.removeItem(WISH_KEY)
  } catch {
    // localStorage bị chặn: bộ nhớ phiên đã được xoá ở trên là đủ.
  }
  if (current) queueWishDeleted(current)
}

export function formatWishDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}
