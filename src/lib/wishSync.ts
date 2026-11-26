// Đồng bộ hũ điều ước lên Firebase Realtime Database qua REST (không dùng SDK,
// để bundle nhẹ và không thêm dependency).
//
// Hướng dữ liệu là một chiều: trình duyệt chỉ PUT, không bao giờ đọc. Rules trong
// `database.rules.json` chặn `.read` ở mọi nhánh, nên người lạ mở web cũng không
// xem được điều ước của ai (chủ project đọc bằng Firebase Console, nơi bỏ qua rules).
//
// Nguyên tắc an toàn: nếu chưa cấu hình URL, hoặc mạng lỗi, hàm ở đây im lặng thất
// bại và giữ bản ghi trong hàng đợi localStorage để lần sau gửi tiếp. Không bao giờ
// ném lỗi ra UI, không chặn thao tác thả điều ước vào hũ.

import type { Wish } from './wish'

const CLIENT_KEY = 'chanh:wish:client:v1'
const QUEUE_KEY = 'chanh:wish:queue:v1'
const DEFAULT_PATH = 'wishes'
const REQUEST_TIMEOUT_MS = 10_000
const QUEUE_LIMIT = 8
const CLIENT_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/

interface WishRecord {
  text: string
  createdAt: string
  updatedAt: string
  client: string
  deletedAt?: string
}

interface QueuedRecord {
  /** Khoá trên Firebase: một máy = một nút, sửa lại thì ghi đè chứ không nhân bản. */
  key: string
  record: WishRecord
}

function readDatabaseUrl(): string {
  const raw = (import.meta.env.VITE_FIREBASE_DB_URL ?? '').trim()
  if (!raw) return ''
  if (!/^https:\/\/[a-z0-9.-]+\.(firebasedatabase\.app|firebaseio\.com)$/i.test(raw)) {
    if (import.meta.env.DEV) {
      console.warn('[wishSync] VITE_FIREBASE_DB_URL không hợp lệ, tạm tắt đồng bộ.')
    }
    return ''
  }
  return raw.replace(/\/+$/, '')
}

function readPath(): string {
  const raw = (import.meta.env.VITE_FIREBASE_WISH_PATH ?? '').trim().replace(/^\/+|\/+$/g, '')
  return /^[A-Za-z0-9_-]{1,40}$/.test(raw) ? raw : DEFAULT_PATH
}

const DATABASE_URL = readDatabaseUrl()
const WISH_PATH = readPath()

export function isWishSyncEnabled(): boolean {
  return DATABASE_URL.length > 0
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function createClientId(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof cryptoApi?.getRandomValues === 'function') cryptoApi.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

let cachedClientId: string | null = null

/** Id ngẫu nhiên của máy này, dùng làm khoá ghi trên Firebase. */
function clientId(): string {
  if (cachedClientId) return cachedClientId
  const store = storage()
  if (store) {
    try {
      const saved = store.getItem(CLIENT_KEY)
      if (saved && CLIENT_ID_PATTERN.test(saved)) {
        cachedClientId = saved
        return saved
      }
    } catch {
      // localStorage bị chặn: rơi xuống tạo id mới cho phiên này.
    }
  }
  const id = createClientId().replace(/[^A-Za-z0-9-]/g, '').slice(0, 64)
  cachedClientId = id
  try {
    store?.setItem(CLIENT_KEY, id)
  } catch {
    // Không lưu được thì vẫn dùng id trong bộ nhớ phiên.
  }
  return id
}

function readQueue(): QueuedRecord[] {
  const store = storage()
  if (!store) return []
  try {
    const raw = store.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isQueuedRecord).slice(-QUEUE_LIMIT)
  } catch {
    return []
  }
}

function isQueuedRecord(value: unknown): value is QueuedRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<QueuedRecord>
  return typeof item.key === 'string' && CLIENT_ID_PATTERN.test(item.key) && isRecord(item.record)
}

function isRecord(value: unknown): value is WishRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<WishRecord>
  return (
    typeof record.text === 'string' &&
    record.text.length > 0 &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string' &&
    typeof record.client === 'string'
  )
}

function writeQueue(items: QueuedRecord[]): void {
  const store = storage()
  if (!store) return
  try {
    if (items.length === 0) store.removeItem(QUEUE_KEY)
    else store.setItem(QUEUE_KEY, JSON.stringify(items.slice(-QUEUE_LIMIT)))
  } catch {
    // Hàng đợi chỉ là lớp đệm; mất cũng không ảnh hưởng điều ước trên máy.
  }
}

function enqueue(key: string, record: WishRecord): void {
  const others = readQueue().filter((item) => item.key !== key)
  writeQueue([...others, { key, record }].slice(-QUEUE_LIMIT))
}

async function put(item: QueuedRecord): Promise<boolean> {
  const url = `${DATABASE_URL}/${WISH_PATH}/${item.key}.json?print=silent`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.record),
      signal: controller.signal,
      // keepalive: ghi vẫn đi tiếp nếu Dương đóng tab ngay sau khi bấm.
      keepalive: true,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok && import.meta.env.DEV) {
      console.warn('[wishSync] Firebase trả về', response.status)
    }
    return response.ok
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[wishSync] Không gửi được điều ước.', error)
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

let flushing: Promise<void> | null = null

/** Gửi lại các bản ghi còn nợ trong hàng đợi. Gọi lúc mở app là đủ. */
export function flushWishQueue(): Promise<void> {
  if (!isWishSyncEnabled()) return Promise.resolve()
  if (flushing) return flushing
  flushing = (async () => {
    while (true) {
      const queue = readQueue()
      if (queue.length === 0) return
      const sent = queue[0]
      const ok = await put(sent)
      if (!ok) return
      // Đọc lại hàng đợi: trong lúc chờ mạng có thể đã có bản mới hơn được xếp vào.
      writeQueue(
        readQueue().filter(
          (item) => item.key !== sent.key || item.record.updatedAt !== sent.record.updatedAt,
        ),
      )
    }
  })().finally(() => {
    flushing = null
  })
  return flushing
}

function buildRecord(wish: Wish, deleted: boolean): WishRecord {
  const now = new Date().toISOString()
  return {
    text: wish.text,
    createdAt: wish.createdAt,
    updatedAt: now,
    client: clientId(),
    ...(deleted ? { deletedAt: now } : {}),
  }
}

/** Cất điều ước lên Firebase rồi trả về ngay; lỗi mạng chỉ nằm lại trong hàng đợi. */
export function queueWishSync(wish: Wish): void {
  if (!isWishSyncEnabled()) return
  const record = buildRecord(wish, false)
  enqueue(record.client, record)
  void flushWishQueue()
}

/**
 * Dương bấm xoá: bản trên máy mất, nhưng bản lưu vẫn ở lại Firebase kèm `deletedAt`
 * để chủ project còn đọc được. Không hiện gì khác trên giao diện.
 */
export function queueWishDeleted(wish: Wish): void {
  if (!isWishSyncEnabled()) return
  const record = buildRecord(wish, true)
  enqueue(record.client, record)
  void flushWishQueue()
}
