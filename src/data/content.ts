import { asset } from './assets'

export interface DialogueSet {
  gateBlock: string[]
  unlock: string[]
  greeting: string[]
  blowCandle: string[]
  momongaSneaksCake: string[]
  photoComment: string[]
  letter: string[]
  gift: string[]
  goodbye: string[]
}

export interface GateChoiceQuestion {
  question: string
  options: string[]
  /** Đáp án đúng duy nhất để mở cửa */
  correct: string
  /** Đáp án "gần đúng" (tuỳ chọn) — hiện lời nhắc thay vì lời mắng */
  almostOption?: string
  almost?: string
  /** Chọn sai */
  scold: string
}

export interface GateQuiz {
  questions: GateChoiceQuestion[]
}

export interface GiftCoupon {
  code: string
  title: string
  body: string
}

export interface BirthdayTicket {
  eyebrow: string
  title: string
  subtitle: string
  code: string
  note: string
}

export interface BirthdayContent {
  name: string
  nickname: string
  age: number
  /** Ngày sinh nhật dạng YYYY-MM-DD, dùng để tính "còn X ngày" theo giờ máy. */
  birthdayISO: string
  birthdayLabel: string
  ticket: BirthdayTicket
  gateQuiz: GateQuiz
  usagiLines: DialogueSet
  momongaLines: DialogueSet
  photoCaptions: string[]
  /** Câu dài cho alt text / khung phóng to / ảnh kỷ niệm cuối. */
  photoNotes: string[]
  letterTitle: string
  letterBody: string
  giftTitle: string
  giftBody: string
  giftCoupons: GiftCoupon[]
  musicSrc: string
  /** Danh sách nhạc nền; rỗng/không có thì dùng musicSrc */
  musicPlaylist?: string[]
  /** Nhãn bài hát, hiện trong tooltip/aria-label của nút nhạc. */
  musicTitles?: string[]
}

export const content: BirthdayContent = {
  name: 'Duong',
  nickname: 'Chanh',
  age: 17,
  birthdayISO: '2026-11-27',
  birthdayLabel: '27.11.2026',

  ticket: {
    eyebrow: 'Thiệp mời',
    title: 'Bữa tiệc của Chanh',
    subtitle: 'VIP · 17 tuổi · Một người duy nhất',
    code: 'Mã vé: 17',
    note: 'Xuất trình vé cho Momonga ở cửa nhé.',
  },

  // Giữ lại bộ câu hỏi cũ để sau này dùng như một "câu đố phụ" trong album.
  gateQuiz: {
    questions: [
      {
        question: 'Ngày anh và em lần đầu gặp nhau?',
        options: ['14/02/2026', '05/11/2025', '16/07/2026', '20/10/2025'],
        correct: '16/07/2026',
        scold: 'Sai ngày rồi! Nghĩ kỹ lại xem nào, Chanh!',
      },
      {
        question: 'Ngày anh và em bắt đầu yêu nhau?',
        options: ['16/07/2026', '05/11/2025', '20/10/2025', '14/02/2026'],
        correct: '05/11/2025',
        scold: 'Chưa đúng đâu! Nhớ lại ngày hôm đó đi nha.',
      },
      {
        question: 'Chanh có xinh gái đáng yêu không?',
        options: ['Có', 'Cũng cũng', 'Không', 'Siêu cấp luôn'],
        correct: 'Siêu cấp luôn',
        almostOption: 'Có',
        almost: 'Gần đúng rồi, còn một đáp án đúng hơn nữa đó!',
        scold: 'Chan cho phát! Chọn lại mau!',
      },
    ],
  },

  usagiLines: {
    gateBlock: [
      'Yaha! Dừng lại! Muốn qua thì phải trả lời đúng câu hỏi!',
      'Yaha! Cửa này chỉ mở cho Chanh thôi nhá!',
    ],
    unlock: ['YAHA! Đúng rồi! Cửa mở! Vào nhanh!', 'Yaha! Chanh giỏi quá! Đi tiếp thôi!'],
    greeting: [
      'Chúc mừng sinh nhật Chanh 17 tuổi! Yaha!',
      'Yaha! Hôm nay Chanh là nhất rồi!',
    ],
    blowCandle: [
      'Nhấn và giữ để thổi nến nào! 1... 2... Yaha!',
      'Thổi mạnh lên Chanh! Ước một điều thật to nha!',
    ],
    momongaSneaksCake: ['Momonga! Bị bắt quả tang ăn vụng bánh rồi nhá!'],
    photoComment: ['Tấm này dễ thương quá!', 'Yaha! Nhớ hôm nay ghê!'],
    letter: ['Thư này Momonga viết bằng cả tâm lòng đó!', 'Đọc chậm thôi, cảm động lắm đó!'],
    gift: ['Mở quà thôi! Momonga làm phép rồi nè!', 'Yaha! Quà xịn cho Chanh 17 tuổi!'],
    goodbye: ['Tạm biệt Chanh! Hẹn gặp lại sớm nha! Yaha!', 'Chúc Chanh tuổi 17 thật rực rỡ! Yaha!'],
  },

  momongaLines: {
    gateBlock: [
      'Hehe! Muốn lấy quà của tôi à?',
      'Cửa này tôi giữ. Trả lời sai là đừng hòng vào nha.',
    ],
    unlock: ['Rồi rồi! Cho qua đó. Nhớ chia bánh cho tui nha.', 'Hẹn gì... Thôi, vào đi, nhanh lên!'],
    greeting: ['Sinh nhật vui vẻ nha. Nhớ phần bánh cho tui.', '17 tuổi rồi, lớn rồi, chia bánh cũng phải lớn nha.'],
    blowCandle: ['Thổi nến đi, sắp hết nến rồi, tui đói ăn bánh kia.', 'Ước xong nhớ kể tui nghe với nha.'],
    momongaSneaksCake: ['Bị phát hiện rồi à? Vậy chia nhau nha?'],
    photoComment: ['Tấm này nhìn Chanh cười tươi ghê.', 'Lưu lại hết đi, mai mốt còn khoe nữa.'],
    letter: ['Tui thức cả đêm viết thư này đó, đọc kỹ vào.', 'Đừng khóc nha, tui không đưa khăn đâu.'],
    gift: ['Tui yểm bùa rồi, mở là bất ngờ liền!', 'Quà này xịn lắm, mở nhẹ tay thôi nha.'],
    goodbye: ['Về nhớ mở quà ra xem lại nha. Bye bye.', 'Sinh nhật vui vẻ, ăn ngon ngủ ngon nha Chanh.'],
  },

  photoCaptions: [
    'Có em là đủ.',
    'Cười là cả ngày sáng.',
    'Chiều không hẹn trước.',
    'Chanh tuổi 17.',
    'Chụp lén mà thương.',
    'Thêm một mùa, vẫn em.',
    'Đẹp nhất khung hình.',
    'Trong ảnh có em.',
    'Ngày thường đáng nhớ.',
    'Để dành chụp cùng em.',
  ],
  photoNotes: [
    'Ngày đầu tiên anh biết, có một người làm mọi thứ dịu lại.',
    'Cười thế này thôi, cả ngày của anh đã sáng rồi.',
    'Một buổi chiều không hẹn trước, mà anh nhớ mãi.',
    'Chanh của tuổi 17, và là người anh thương nhất.',
    'Tấm này anh chụp lén, vì không nỡ bỏ lỡ.',
    'Thêm một mùa nữa, anh vẫn chọn đi cùng em.',
    'Không cần dàn dựng, em đã là điều đẹp nhất trong khung hình.',
    'Nhìn lại vẫn thấy vui, vì trong ảnh có em.',
    'Một ngày rất đỗi bình thường, có em là thành ngày anh nhớ.',
    'Còn nhiều tấm nữa, anh để dành chụp cùng em thật lâu.',
  ],
  letterTitle: 'Gửi Chanh tuổi 17',
  letterBody: `Chanh thân mến,

Hôm nay em 17 tuổi rồi. Anh chẳng biết viết gì cho thật hay, chỉ biết là anh rất vui vì được ở đây, cùng em đi qua thêm một mùa sinh nhật nữa.

Cảm ơn em vì những ngày bình thường cũng hoá đáng nhớ. Cảm ơn em đã cười thật nhiều, đã ở lại, và đã là Chanh của anh.

Tuổi 17, chúc em thật khoẻ, thật vui, học hành thuận lợi và gặp được nhiều điều tử tế. Có chuyện gì buồn thì cứ kể anh nghe nhé.

Sinh nhật vui vẻ, Chanh của anh.`,
  giftTitle: 'Sổ quà của Chanh',
  giftBody: `Ba tấm coupon nhỏ, đổi lúc nào cũng được.
Hạn dùng: mãi mãi.`,
  giftCoupons: [
    {
      code: 'Q17-01',
      title: 'Một buổi đi chơi',
      body: 'Chanh chọn địa điểm, anh lo phần còn lại.',
    },
    {
      code: 'Q17-02',
      title: 'Một bữa ăn thật ngon',
      body: 'Anh bao, Chanh chỉ cần chọn món.',
    },
    {
      code: 'Q17-03',
      title: 'Một điều ước để dành',
      body: 'Giữ đến lúc Chanh cần nhất.',
    },
  ],
  musicSrc: asset('/audio/bai1.mp3'),
  musicPlaylist: [asset('/audio/bai1.mp3'), asset('/audio/bai2.mp3')],
  musicTitles: ['Bài 1', 'Bài 2'],
}

export function pickRandom(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? ''
}
