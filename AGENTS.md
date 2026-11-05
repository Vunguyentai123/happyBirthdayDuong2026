# AGENTS.md: quy tắc cố định cho dự án "Usagi & Momonga có quà cho Chanh!"

## Bối cảnh
Web chúc mừng sinh nhật tặng một bạn 17 tuổi (Dương, biệt danh Chanh). Nội dung phải trong sáng, ấm áp, dễ thương. Fan project làm tặng riêng, không thương mại.

## Ngôn ngữ
- Giao tiếp với tôi bằng tiếng Việt. Code, tên biến, comment kỹ thuật bằng tiếng Anh. Nội dung hiển thị trên web bằng tiếng Việt có dấu đầy đủ.

## Stack và version (BẮT BUỘC khớp nhau, tránh lỗi lệch version)
- Vite 5.x, @vitejs/plugin-react 4.x, React 18.3.x, TypeScript.
- three, @react-three/fiber 8.x, @react-three/drei 9.x, @react-three/postprocessing 2.x (nếu dùng). Đây là bộ đi cùng React 18. KHÔNG dùng fiber 9.x/drei 10.x vì chúng đi với React 19.
- @types/three phải cùng phiên bản với three.
- framer-motion 11.x, Tailwind CSS 3.4.x, zustand 4.5.x, canvas-confetti 1.9.x, sharp 0.33.x (chỉ cho script xử lý ảnh).
- Trước khi cài MỌI package: chạy `node -v` và `npm view <pkg> peerDependencies engines`, chọn version thỏa tất cả peer deps. Ghim version chính xác trong package.json (không dùng `^` hay `~` cho three, @react-three/*, @types/three).
- Nếu có xung đột peer dependency: DỪNG và báo tôi. Không dùng `--force` hay `--legacy-peer-deps`.

## Quyền riêng tư (rất quan trọng)
- Không analytics, không tracker, không gửi dữ liệu ra ngoài. Tự host font và asset khi có thể.
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