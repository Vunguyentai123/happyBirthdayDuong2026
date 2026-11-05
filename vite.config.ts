import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Đường dẫn tương đối: chạy được ở gốc tên miền lẫn thư mục con
  // (GitHub Pages /happyBirthdayDuong2026/), không cần sửa khi đổi nơi deploy.
  base: './',
  plugins: [react(), tailwindcss()],
  publicDir: 'public',
})
