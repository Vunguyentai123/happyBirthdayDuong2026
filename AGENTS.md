# AGENTS.md: quy tắc cố định cho dự án "Usagi & Momonga có quà cho Chanh!"

## Bối cảnh
Web chúc mừng sinh nhật tặng một bạn 17 tuổi (Dương, biệt danh Chanh). Nội dung phải trong sáng, ấm áp, dễ thương. Fan project làm tặng riêng, không thương mại.

## Ngôn ngữ
- Giao tiếp với tôi bằng tiếng Việt. Code, tên biến, comment kỹ thuật bằng tiếng Anh. Nội dung hiển thị trên web bằng tiếng Việt có dấu đầy đủ.

## Stack và version (BẮT BUỘC khớp nhau, tránh lỗi lệch version)
- Node `^20.19.0 || >=22.12.0` (Vite 8). Máy hiện tại: Node 22.20.0.
- Vite 8.3.x, @vitejs/plugin-react 6.1.x, React 19.3.x, TypeScript 7.0.x.
- three 0.186.x, @react-three/fiber 9.8.x, @react-three/drei 10.7.x. Đây là bộ đi cùng React 19; fiber yêu cầu `react >=19 <19.4`.
- @types/three phải cùng phiên bản với three (0.186.x).
- Tailwind CSS 4.3.x + @tailwindcss/vite 4.3.x, zustand 5.0.x, canvas-confetti 1.9.x, sharp 0.35.x (chỉ cho script xử lý ảnh), lucide-react 1.57.x.
- Font tự host: @fontsource/baloo-2 5.2.5, @fontsource/playfair-display 5.3.0, @fontsource/caveat 5.3.0.
- framer-motion và @react-three/postprocessing hiện KHÔNG dùng. Nếu thêm, phải kiểm tra peer React 19 trước.
- KHÔNG nâng React lên 19.4+ khi fiber chưa hỗ trợ.
- Trước khi cài MỌI package: chạy `node -v` và `npm view <pkg> peerDependencies engines`, chọn version thỏa tất cả peer deps. Ghim version chính xác trong package.json (không dùng `^` hay `~`).
- Nếu có xung đột peer dependency: DỪNG và báo tôi. Không dùng `--force` hay `--legacy-peer-deps`.

## Quyền riêng tư (rất quan trọng)
- Không analytics, không tracker, không gửi dữ liệu ra ngoài. Tự host font và asset khi có thể.
- Ngoại lệ duy nhất, do chủ project yêu cầu: nội dung hũ điều ước được ghi thêm một bản sao lưu
  riêng tư lên Firebase Realtime Database (`src/lib/wishSync.ts`, `database.rules.json`). Client
  chỉ ghi, rules chặn đọc. Không mở rộng ngoại lệ này sang dữ liệu nào khác.
- Có `<meta name="robots" content="noindex,nofollow">`.
- Ảnh cá nhân luôn đi qua `scripts/prepare-photos.mjs` (xóa EXIF/GPS, resize, đổi tên ngẫu nhiên). Thư mục `photos-source/` nằm trong `.gitignore`.
- Không bao giờ commit mật khẩu dạng chữ thường; chỉ lưu SHA-256 hash. Màn khóa chỉ là chắn nhẹ, không phải bảo mật thật.

## Asset nhân vật
- Dùng đúng các file có sẵn trong `public/characters/` (usagi-01..09.png, momonga-01..07.png). KHÔNG tự vẽ, tải hay tạo lại nhân vật.
- Ảnh độ phân giải thấp: không hiển thị lớn hơn `naturalWidth / 1.5` CSS px.

## Chất lượng
- TypeScript chặt, không dùng `any` bừa bãi, không để TODO bỏ lửng, code chia component rõ ràng.
- Mobile-first (khung dọc khoảng 360x640). Vùng bấm tối thiểu 44px.
- Tôn trọng `prefers-reduced-motion`. Có alt text và aria-label.
- Mục tiêu 60 FPS trên điện thoại tầm trung. Khi có xung đột giữa hiệu ứng đẹp và độ mượt trên điện thoại, ưu tiên độ mượt.

## Cách làm việc
- Với nhiệm vụ lớn: lập kế hoạch trước (Planning), nêu rõ rủi ro và bảng version đã kiểm tra.
- Sau khi làm xong mỗi màn: chạy dev server, mở bằng browser agent ở viewport điện thoại (khoảng 390x844) và desktop, chụp ảnh màn hình làm bằng chứng, báo lỗi console nếu có.
- Nếu yêu cầu mâu thuẫn hoặc rủi ro (hiệu năng, version, ảnh quá nhỏ), nêu rõ và đề xuất cách xử lý, không tự đổi im lặng.