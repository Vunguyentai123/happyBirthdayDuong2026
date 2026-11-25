/// <reference types="vite/client" />

// Biến môi trường dùng cho hũ điều ước. Xem `.env.example`.
interface ImportMetaEnv {
  /** URL Realtime Database, ví dụ https://abc-default-rtdb.asia-southeast1.firebasedatabase.app */
  readonly VITE_FIREBASE_DB_URL?: string
  /** Nhánh chứa điều ước, mặc định `wishes`. */
  readonly VITE_FIREBASE_WISH_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
