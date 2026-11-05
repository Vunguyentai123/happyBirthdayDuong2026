// Đường dẫn tới file trong thư mục public/. Luôn cộng thêm BASE_URL để web chạy
// đúng cả khi deploy dưới một thư mục con (GitHub Pages: /ten-repo/) lẫn khi chạy
// ở gốc tên miền. Không dùng chuỗi '/...' trực tiếp trong code nữa.
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
