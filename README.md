Usagi & Momonga có quà cho Chanh
Web chúc mừng sinh nhật Chanh (Dương), 17 tuổi. Hành trình gồm 6 màn đi một chiều, hai nhân vật
Usagi và Momonga dẫn chuyện suốt. Đi hết là nhận đủ quà. Toàn bộ nội dung (lời thoại, chú thích
ảnh, thư, quà, nhạc) nằm trong một file: `src/data/content.ts`.
Trình tự màn hình
#	Màn	id (store)	Việc chính
1	Cổng	`lock`	Trả lời đúng câu hỏi để mở cửa
2	Thiệp chúc	`greeting`	Lời chúc từ hai nhân vật, bật nhạc
3	Thổi nến	`candle`	Bánh 3D, giữ nút hoặc thổi micro để ước
4	Album	`photos`	Polaroid tự trượt, bấm để phóng to
5	Thư	`letter`	Mở phong bì, chữ hiện dần
6	Hộp quà	`gift`	Hộp quà 3D mở nắp, lời tạm biệt, chơi lại
Chỉ đi tiếp bằng nút trên từng màn, không có nút quay lại. "Xem lại từ đầu" ở màn 6 là điểm
restart duy nhất. State chỉ sống trong bộ nhớ tab (Zustand, không dùng localStorage), tải lại trang
là về màn 1.
Chạy và build
```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build
npm run preview
```
Deploy thư mục `dist/` lên Netlify, Vercel, Cloudflare hoặc hosting tĩnh bất kỳ. Micro chỉ hoạt
động trên `https://` hoặc `localhost`.
---
Nguyên tắc giao diện (áp dụng cho cả 6 màn)
Mục tiêu: cả web nhìn như một thế giới 3D đồ chơi sinh nhật của hai nhân vật, không phải một
trang giới thiệu sản phẩm. Mọi thứ trên màn hình phải trả lời được câu hỏi "Chanh cần đọc hoặc bấm
cái này để làm gì?". Cái nào không có câu trả lời thì bỏ.
1. Bảng token dùng chung
Lấy theo giao diện màn 4-6 hiện có làm chuẩn, các màn 1-3 chỉnh về cho khớp.
Token	Giá trị gợi ý	Dùng cho
`--ink`	`#4A2F27` (nâu sô-cô-la)	Chữ, viền, icon
`--paper`	`#FFF8EA` (kem)	Nền thẻ
`--butter`	`#FFC21A`	Nút chính
`--pink`	`#FF8FB1`	Điểm nhấn, tim
`--mint`	`#D6F5E8`	Bubble Momonga
`--sun`	`#FFF1B8`	Bubble Usagi
Bo góc	24px (thẻ), 999px (nút)	Chỉ hai cỡ này
Bóng	một kiểu duy nhất, mềm, màu nâu mờ	Mọi thẻ
Bỏ hẳn đỏ rượu (burgundy), vàng gold kim loại và xanh rêu đậm. Không có gradient trên nút.
2. Chữ
Baloo 2 cho toàn bộ giao diện: tiêu đề, lời thoại, nút, chú thích.
Playfair Display (italic) chỉ dùng ở 3 chỗ: tên "Chanh" ở màn 2, dòng khắc trên bánh, tiêu
đề lá thư. Ở đâu khác cũng không dùng.
Không dùng chữ viết hoa giãn chữ (letter-spacing) cho nhãn nhỏ. Chữ phụ viết thường, cỡ tối
thiểu 14px.
Mỗi màn có một tiêu đề và một dòng phụ là tối đa.
3. Nút
Chỉ một kiểu nút chính cho cả hành trình: nền `--butter`, chữ `--ink` đậm, viền `--ink` 2px, bo
tròn hoàn toàn, bóng đổ cứng lệch xuống 3px. Bấm thì lún xuống. Cùng một kích thước và cùng một vị
trí ở mọi màn (giữa, cách đáy 24px).
Nút phụ (micro, mũi tên trước/sau, tắt nhạc): tròn, nền kem, viền `--ink`, không chữ hoặc chữ rất
ngắn.
Bỏ: nút xanh rêu (màn 2), nút tím đậm (màn 2 và 3), vé CTA có số trang (màn 3), nút vàng gradient
có icon lửa (màn 3).
4. Thẻ và bố cục
Mỗi thẻ có một viền, một bo góc, một bóng. Bỏ khung đôi, góc trang trí, đường kẻ có hạt kim
cương và đường chỉ vàng.
Thẻ chỉ chứa nội dung chính (câu hỏi, lời chúc, ảnh, thư). Nhân vật và bubble thoại đứng ngoài
thẻ, đè lên mép thẻ hoặc đứng cạnh, không nhét vào avatar tròn.
Vùng giữa màn hình dành cho nội dung. Vật thể 3D chỉ thưa ra ở vùng đó.
5. Nhân vật
Usagi bên phải, Momonga bên trái (hoặc theo vai trong từng màn). Cố định vị trí để Chanh quen.
Lời thoại dùng bubble kiểu truyện tranh: Usagi nền `--sun`, Momonga nền `--mint`, tên nhân vật
in đậm một dòng nhỏ phía trên, không có chip hay tag đi kèm.
Mỗi lượt thoại ngắn, một hai câu, giọng thân mật ("tui", "nha", "nhé").
6. Nền 3D (`Backdrop3D`)
Bỏ vật thể hình nhẫn vàng (gợi đám cưới) và nấm hồng nếu không chủ ý dùng.
Còn lại: bóng bay, cupcake, quà, tim, sao, mũ sinh nhật, ruy băng.
Giảm khoảng 40% số vật thể ở màn 1 và 2, để thưa ở giữa, dày hơn ở rìa. Vật thể rìa rõ nét, không
phủ sương.
Màu nền đổi nhẹ giữa các màn, không đổi đột ngột (màn 4 mint, màn 5 hồng đậm hiện tại chênh quá
nhiều).
Giữ nguyên parallax, hạt bay và hiệu ứng đổi theo `progress`.
7. Thanh tiến độ
Bỏ mọi chữ dạng "02/06", "04/06", "CÒN 4 ĐIỀU BẤT NGỜ". Thay bằng 6 chấm nhỏ ở góc trên giữa
màn hình, chấm của màn đã qua tô `--pink`, màn hiện tại to hơn một chút. Không có chữ.
8. Danh sách đã bỏ (đừng thêm lại)
Nhãn nhỏ viết hoa: "CỔNG ĐANG KHÓA", "Lời mời số 01", "LỜI THÁCH ĐỐ CỦA NGƯỜI GIỮ CỔNG",
"CHẶNG TIẾP THEO", "THIỆP CHÚC", "HAPPY BIRTHDAY", "ĐIỀU ƯỚC SINH NHẬT", "ĐI TIẾP".
Dòng phụ đếm: "02 lời · 01 điều ước", "CÒN 4 ĐIỀU BẤT NGỜ".
Chân trang: "Made with love for Chanh · 17", "Gửi Chanh · Một chút ngọt ngào trước khi thổi
nến".
Chip trạng thái: "Usagi đang nhảy mừng", "Nến đang chờ", "Giữ 1,5 giây", "Bị bắt quả tang!"
(nội dung đó nằm trong lời thoại là đủ).
Icon: khóa nhỏ ở màn 1, ngọn lửa trên nút thổi nến, sparkle trên note Usagi, mũi tên → thừa trên
nút, hạt kim cương trang trí, nhẫn 3D, nấm 3D.
Khung vòm bao quanh Usagi ở màn 2, dải bunting nếu thấy rối.
---
Chi tiết từng màn
1. Cổng (`lock`): `src/scenes/LockScene.tsx`
Bố cục
Desktop (từ 1024px): cửa bên trái, thẻ câu hỏi bên phải. Mobile: một cột, thẻ nằm dưới cửa.
Cửa vòm giữ nguyên (`GateDoor.tsx`, vẽ bằng CSS), chỉnh khung vàng gold sang màu gỗ ấm hoặc vàng
bơ cho khớp bảng màu. Hai cánh mở bằng `rotateY`.
Tiêu đề:
Trước mở: "Khoan đã Chanh, trả lời đúng mới được vào!"
Sau mở: "Cửa mở rồi, sinh nhật vui vẻ nha!"
Dòng phụ trước mở: "Chỉ cần một câu trả lời đúng là cửa tự mở."
Bỏ: chip khóa, "Lời mời số 01", dòng chân trang, chip "DÀNH RIÊNG CHO CHANH · tuổi 17" dưới cửa.
Thẻ câu hỏi (`GateQuestion.tsx`)
Chỉ có câu hỏi và 4 đáp án A-D (nút phụ kiểu kem, viền nâu). Không có nhãn "lời thách đố".
Mỗi lần vào bốc ngẫu nhiên 1 trong 3 câu trong `content.gateQuiz.questions`.
Đúng: cửa mở. Gần đúng (`almostOption`): Momonga nhắc nhẹ. Sai: thẻ rung, Momonga mắng.
Nhân vật
Bỏ `CompanionStrip` ở đáy thẻ. Momonga (vai giữ cửa) đứng bên trái cửa, Usagi bên phải, mỗi bên
một bubble thoại.
Trước mở: Momonga dùng `gateBlock`, Usagi nói "Chọn đúng nha Chanh!".
Sau khi mở (`GateOpened.tsx`)
Thẻ câu hỏi biến mất. Hai bubble đổi thành lời reo của Usagi (`unlock`) và Momonga.
Một nút chính "Đi tiếp nè" ở giữa, bấm sang màn 2.
Bỏ hàng chapter, hai mẩu giấy băng keo và đường chỉ vàng.
Cần soi: animation mở cửa mượt; hai nhân vật không che thẻ ở bề ngang 433, 850, 1280; sau mở
không bị tràn cao trên mobile.
2. Thiệp chúc (`greeting`): `src/scenes/GreetingScene.tsx`
Usagi nhảy hoạt hình từng frame (`UsagiHop.tsx`) ngay trên nền, không có khung vòm và chip.
Có thể giữ số "17" mờ phía sau và bóng bay.
Tên "Chanh" cỡ lớn (Playfair italic), kèm một dòng nhỏ "tuổi 17, chương mới".
Hai lời chúc là hai bubble của Usagi và Momonga, nằm cạnh thẻ chính, không có dòng đếm.
Nhạc: giữ đĩa nhạc (`MusicToggle variant="disc"`) nhưng đặt ở góc màn hình, đồng thời xuất
hiện ở mọi màn sau (xem phần Nhạc).
Nút chính "Đi tiếp nè", bấm thì bắn confetti 2D rồi sang màn 3. Bỏ nhãn "Đi tiếp · 02/06".
Thống nhất cách gọi: dùng Chanh ở mọi lời thoại (hiện có chỗ ghi "Dương").
Cần soi: confetti nổ đúng lúc, không đè chữ; Usagi nhảy không khựng; nút nhạc và nút đi tiếp
không trùng điểm chạm.
3. Thổi nến (`candle`): `src/scenes/CandleScene.tsx`
Bố cục thẻ dọc (rộng 440-520px) trên nền 3D, giữ nguyên.
Trước khi ước
Tiêu đề: "Thổi nến, ước một điều thật to nhé." Bỏ nhãn nhỏ "ĐIỀU ƯỚC SINH NHẬT".
Một bubble Usagi ở trên (`blowCandle`).
Bánh 3D (`three/CakeScene.tsx`, `AvatarCake`) giữ nguyên. Nên giảm đầu thỏ khổng lồ ở đỉnh nếu
thấy lạ mắt, vì bánh đã có mặt nhân vật ở thân.
Khay điều khiển gọn lại:
Một nút chính "Giữ để thổi nến" có thanh fill theo tiến độ, bỏ icon lửa.
Một nút tròn nhỏ micro bên cạnh (`useMicBlow`), khi bật hiện thanh mức hơi.
Gợi ý "Kéo để xoay bánh" đặt thành dòng chữ nhỏ dưới khay.
Bỏ chip "Nến đang chờ" và "Giữ 1,5 giây".
Sau khi ước (`wishBlown = true`)
Nến tắt, confetti 3D và pháo hoa (`Confetti3D`, `Fireworks3D`) nổ, bánh giữ nguyên.
Tiêu đề khối kết: "Ước xong rồi nha!" cùng một câu chúc ngắn.
Hai lượt thoại cố định: Usagi (`usagiLines.momongaSneaksCake`) rồi Momonga
(`momongaLines.momongaSneaksCake`). Bỏ tag "Bị bắt quả tang!".
Nút chính "Đi tiếp nè" thay cho vé CTA có số trang.
Lite (không WebGL): bánh là emoji nổi, confetti 2D, giao diện khay không đổi.
Cần soi: giữ nút 1,5s nổ confetti đúng; kéo xoay không bị nút nuốt sự kiện; không bôi đen chữ
khi kéo.
4. Album (`photos`): `src/scenes/PhotosScene.tsx`
Màn này đã gần với phong cách mong muốn, chủ yếu cần đồng bộ.
Polaroid treo dây trượt ngang, tự trượt (`SLIDE_MS = 3000`, `HOLD_MS = 3000`). Vuốt ngang, hai
nút mũi tên, bấm ảnh để phóng to (autoplay tạm dừng khi zoom).
Chỉ số "n / tổng" giữ nhỏ trên đầu hoặc đổi thành chấm.
Chú thích dưới ảnh lấy từ `content.photoCaptions`.
Bubble thoại bên dưới đổi nhãn theo đúng nhân vật nói (hiện đang cố định "Momonga").
Nút chính "Đi tiếp nè". Bỏ "· 05/06".
Nền mint thu về cùng họ màu với các màn khác.
Dữ liệu ảnh: `src/data/photos.generated.ts`, tối đa 20 ảnh webp trong `public/photos/`. Chưa có ảnh
thì hiện 3 khung mẫu.
5. Thư (`letter`): `src/scenes/LetterScene.tsx`
Phong phong bì bấm "Mở thư", lá thư triển ra, chữ hiện dần (`useTypewriter`, khoảng 30 ký
tự/giây). Nút "Hiện hết" để nhảy tới cuối.
Tiêu đề thư dùng Playfair italic. Thân thư dùng Baloo 2 cỡ 17-18px cho dễ đọc trên mobile.
Nút "Đi tiếp nè" chỉ hiện khi chữ đã hiện xong.
Thẻ thư dùng cùng kiểu thẻ với các màn khác.
Nội dung thư hiện vẫn là placeholder trong `content.ts` (`letterTitle`, `letterBody`). Cần điền
thật trước khi gửi.
6. Hộp quà (`gift`): `src/scenes/GiftScene.tsx` + `src/three/GiftScene.tsx`
Hộp quà 3D: bấm hộp hoặc bấm nút đều mở được (`giftOpen`). Nắp bật lên, ánh sáng tỏa, kèm
`Confetti3D` và pháo hoa. Làm hộp quà có khối và bóng đổ rõ hơn để bớt phẳng.
Sau khi mở: một thẻ quà cùng kiểu thẻ chung (`giftBody`), hai nhân vật vẫy tay, hai bubble tạm
biệt, nút "Xem lại từ đầu" (bỏ icon xoay thừa).
Thẻ quà ngắn gọn, nội dung quà là chính. Không để nhiều chữ hướng dẫn.
`giftBody` hiện là placeholder, cần điền thật.
Lite: hộp quà là emoji, confetti 2D.
Cần soi: mở bằng cả hai cách; ánh sáng và confetti không che lời thoại; restart về màn 1 sạch.
---
Hệ thống dùng chung
Store (`src/store/useSceneStore.ts`)
Zustand, không persist. State: `scene`, `progress` (0..1, điều khiển nền), `wishBlown`, `giftOpen`,
`unlocked`, `gatePassed`, `musicOn`, `trackIndex`. API: `setScene`, `next`, `restart`,
`setProgress`, `setWishBlown`, `setGiftOpen`, `setUnlocked`, `setGatePassed`, `setMusicOn`,
`nextTrack`.
Canvas 3D (`src/three/CanvasRoot.tsx`)
Một canvas cố định toàn màn hình, nằm sau UI (`z-0`). Chỉ bật `pointer-events` ở màn `candle` và
`gift`.
`dpr [1, 1.5]`, `PerformanceMonitor` tự hạ chất lượng khi FPS thấp, tự dừng khi tab ẩn.
`Backdrop3D`: trời gradient theo palette từng màn, hạt bay, vật thể 3D rải, camera parallax, nhịp
đổi theo `progress` (xem mục 6 phần Nguyên tắc để biết vật thể nào bỏ).
`AvatarCake`: dựng bằng geometry và texture canvas, không dùng file GLB.
`Confetti3D`: 4 lớp InstancedMesh. `Fireworks3D`: 4 lớp, đặt vị trí nổ theo tọa độ màn hình
(-1..1) nên mobile dọc vẫn thấy pháo hoa hai bên bánh.
Fallback lite (`useLiteFallback`)
Chỉ có một giao diện (bản 3D), không có công tắc cho khách.
`lite = true` chỉ khi trình duyệt không tạo được WebGL. Khi đó không tải chunk `CanvasRoot`,
nền thay bằng `.lite-bg` phẳng, bánh và quà dùng emoji, confetti dùng canvas-confetti 2D. Màn 1,
2, 4, 5 không đổi.
Nhạc (`MusicPlayer.tsx` + `MusicToggle.tsx`)
`MusicPlayer` mount ở `App.tsx`, nhạc không đứt khi đổi màn. Chỉ phát sau khi người dùng bấm
(trình duyệt chặn autoplay).
Playlist 2 bài (`bai1.mp3`, `bai2.mp3`) sửa ở `content.musicPlaylist`. Hết bài tự chuyển, hết bài
cuối quay lại bài đầu.
Đổi so với trước: nút nhạc nay là một nút tròn nhỏ cố định ở góc màn hình, hiện từ màn 2 đến
hết hành trình, để Chanh tắt được bất cứ lúc nào. Nút chuyển bài chỉ hiện khi playlist có trên
1 bài.
Loader (`Loader.tsx`)
Preload ảnh nhân vật (`usagiHopFrames`, các role Momonga, vài khung Usagi). Thanh tiến độ chạy
theo, xong hoặc quá 4 giây thì vào màn 1.
---
Sửa nội dung
`src/data/content.ts` là nơi duy nhất sửa nội dung.
`name` / `nickname` / `age`: tên, biệt danh Chanh, tuổi. Dùng "Chanh" thống nhất trong mọi
lời thoại.
`gateQuiz.questions`: 3 câu trắc nghiệm (`question`, 4 `options`, `correct`, tùy chọn
`almostOption` + `almost`, và `scold` cho sai). Trường `praise` hiện chưa dùng.
`usagiLines` / `momongaLines`: thoại theo màn (`gateBlock`, `unlock`, `greeting`, `blowCandle`,
`momongaSneaksCake`, `photoComment`, `letter`, `gift`, `goodbye`).
`photoCaptions`: chú thích ảnh.
`letterTitle` / `letterBody` / `giftTitle` / `giftBody`: placeholder, cần điền.
`musicSrc` / `musicPlaylist`: bài hát trong `public/audio/`.
`passwordHash` / `passwordHint`: không còn dùng (cổng đã đổi sang trắc nghiệm). Script
`npm run hash -- <chuoi>` vẫn còn nếu cần quay lại màn mật khẩu.
Giọng thoại
Ngắn, thân mật, như bạn bè nói với nhau. Tránh văn quảng cáo.
Nên tránh	Nên dùng
Một cánh cửa, một điều bất ngờ.	Khoan đã Chanh, trả lời đúng mới được vào!
Tiếp tục hành trình	Đi tiếp nè
Điều ước đã bay lên trời	Ước xong rồi nha!
Chặng tiếp theo	(bỏ)
Đổi ảnh kỷ niệm
```bash
npm run photos     # scripts/prepare-photos.mjs
```
Đặt ảnh gốc (jpg/png, 1-20 tấm) vào `photos-source/` (không commit), rồi chạy lệnh trên. Script
resize, bỏ metadata, nén webp khoảng 80%, đổi tên ngẫu nhiên, ghi ra `public/photos/` và tự sinh
`src/data/photos.generated.ts`.
Nhân vật (`src/data/characters.ts` + `src/components/Character.tsx`)
Map role sang file trong `public/characters/`. `Character` tự kẹp chiều rộng theo ảnh gốc, có
placeholder tròn màu kem và log console nếu file 404. Thêm role mới bằng cách thêm PNG vào thư mục
và khai báo trong `characters.ts`.
---
Việc cần làm trước khi gửi cho Chanh
Đồng bộ giao diện
Gom về một kiểu nút, một bộ font, một bảng màu (mục 1-3 của phần Nguyên tắc).
Xóa các nhãn, chip, icon và dòng chân trang trong danh sách "Đã bỏ" (mục 8).
Đưa nhân vật ra ngoài thẻ ở màn 1 và 2, bỏ `CompanionStrip`.
Bỏ nhẫn và nấm khỏi `Backdrop3D`, giảm mật độ vật thể ở màn 1-2.
Thay số trang bằng 6 chấm tiến độ.
Đặt nút nhạc cố định ở góc, hiện từ màn 2.
Nội dung
Điền `letterBody`, `giftBody`.
Sửa "Dương" thành "Chanh" cho thống nhất.
Sửa nhãn bubble ở màn 4 theo đúng nhân vật.
Thay `momonga-03.png` vì còn watermark TikTok.
Kiểm tra
Xem thật trên điện thoại ở bề ngang 433px, nhất là màn 1 sau khi mở cửa.
Thử micro trên `https://` hoặc `localhost` thật (ngưỡng phát hiện hơi thổi, thông báo lỗi quyền).
Công nghệ
React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Three Fiber + drei, canvas-confetti,
lucide-react. Font tự host: Baloo 2 và Playfair Display.
> Chunk `CanvasRoot` (~1MB) được lazy-load riêng, chỉ tải khi trình duyệt có WebGL. Cảnh báo
> "chunk size > 500kB" của Vite là bình thường, không phải lỗi.