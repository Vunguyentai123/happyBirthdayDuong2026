import { Heart } from 'lucide-react'
import { content } from '../../data/content'

const motes = [
  { left: '6%', top: '20%', size: 3, delay: '0s', duration: '7.5s' },
  { left: '13%', top: '58%', size: 2, delay: '1.4s', duration: '8.5s' },
  { left: '84%', top: '30%', size: 2.5, delay: '0.8s', duration: '7s' },
  { left: '91%', top: '66%', size: 3, delay: '2.2s', duration: '9s' },
  { left: '25%', top: '78%', size: 2, delay: '1.9s', duration: '8s' },
  { left: '72%', top: '83%', size: 2.5, delay: '0.4s', duration: '9.5s' },
] as const

// Cánh cổng vòm sơn mài: khung vàng nhiều lớp, cánh cửa mở bằng rotateY,
// bên trong là ánh sáng ấm của tuổi mới. Toàn bộ vẽ bằng CSS.
export function GateDoor({ opened }: { opened: boolean }) {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[420px] select-none flex-col items-center"
      aria-hidden
    >
      <div className={`gate-halo ${opened ? 'is-open' : ''}`} />
      <div className={`gate-spill ${opened ? 'is-open' : ''}`} />

      {motes.map((mote, index) => (
        <span
          key={index}
          className="gate-mote"
          style={{
            left: mote.left,
            top: mote.top,
            width: mote.size,
            height: mote.size,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}

      <div className="relative mt-3">
        {/* Đường vòm khắc trên tường, tạo chiều sâu cho hốc cửa */}
        <div className="gate-arch-shape pointer-events-none absolute -inset-[25px] border border-[#C9A25D]/20" />

        {/* Khung vòm: vàng -> kem -> vàng mảnh */}
        <div className="gate-arch-shape gate-frame absolute -inset-[13px]" />
        <div className="gate-arch-shape gate-frame-inner absolute -inset-[6px]" />

        {/* Đá khóa trên đỉnh vòm */}
        <div className="absolute -top-[22px] left-1/2 z-30 -translate-x-1/2">
          <div className="grid h-8 w-8 rotate-45 place-items-center rounded-[3px] border border-[#C9A25D]/80 bg-[linear-gradient(135deg,#FFF8E2_0%,#E2C68C_45%,#B08343_100%)] shadow-[0_8px_16px_-8px_rgba(80,45,30,.7)]">
            <Heart size={9} className="-rotate-45 text-[#783445]" fill="currentColor" />
          </div>
        </div>

        <div className="relative h-[240px] w-[160px] sm:h-[372px] sm:w-[244px]">
          <div
            className="gate-arch-shape absolute inset-0 overflow-hidden border-[3px] border-[#F0DEBC] bg-[#38141F] shadow-[inset_0_10px_26px_rgba(30,8,15,.8)]"
            style={{ perspective: '900px' }}
          >
            {/* Không gian bên trong cửa */}
            <div className="gate-interior absolute inset-0" />
            <div
              className={`gate-interior-glow absolute inset-0 ${opened ? 'is-open' : ''}`}
            />
            <div className="gate-rays pointer-events-none absolute inset-0" />

            {/* Vòm trong: tạo cảm giác chiều sâu cho lối vào */}
            <div className="pointer-events-none absolute inset-x-[13%] bottom-0 top-[13%] rounded-t-full border border-[#B5834A]/40 bg-[linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0)_55%)] shadow-[inset_0_0_26px_rgba(255,255,255,.25)]" />
            <div className="pointer-events-none absolute inset-x-[19%] bottom-[7%] h-[9%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,255,255,.5),transparent_72%)]" />

            <div
              className={`gate-welcome absolute inset-0 z-0 flex flex-col items-center justify-center ${
                opened ? 'is-open' : ''
              }`}
            >
              <span className="font-editorial text-[9px] italic tracking-[0.16em] text-[#803044]/80 sm:text-[11px]">
                Chúc mừng sinh nhật
              </span>
              <span className="font-editorial text-[4.4rem] font-semibold leading-[0.85] text-[#6B2336] drop-shadow-[0_2px_0_rgba(255,245,215,.6)] sm:text-[5.4rem]">
                {content.age}
              </span>
            </div>

            {/* Ánh sáng ấm rỉ ra ở khe cửa khi còn đóng */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#FFE9B4] to-transparent transition-opacity duration-700 ${
                opened ? 'opacity-0' : 'opacity-80'
              }`}
            />

            {/* Cánh trái */}
            <div
              className={`door-leaf door-leaf-left absolute inset-y-0 left-0 z-20 w-1/2 ${
                opened ? 'is-open' : ''
              }`}
            >
              <div className="gate-leaf gate-leaf-left relative h-full w-full overflow-hidden">
                <div className="gate-leaf-panel gate-leaf-panel-left absolute bottom-[41%] left-2.5 right-2.5 top-3" />
                <div className="gate-leaf-panel absolute bottom-3 left-3 right-2.5 top-[63%] rounded-[4px]" />
                <span className="absolute left-1/2 top-4 h-1 w-1 -translate-x-1/2 rotate-45 bg-[#E3C892]/80" />
                <span className="absolute bottom-[37%] left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-[#E3C892]/60" />
                <span className="gate-leaf-sheen absolute inset-0" />
                <span className="absolute left-1 top-[16%] h-4 w-[5px] rounded-[2px] bg-[linear-gradient(180deg,#F4E2B8,#C9A25D_50%,#8F682F)] shadow-[0_1px_3px_rgba(40,15,20,.5)]" />
                <span className="absolute bottom-[14%] left-1 h-4 w-[5px] rounded-[2px] bg-[linear-gradient(180deg,#F4E2B8,#C9A25D_50%,#8F682F)] shadow-[0_1px_3px_rgba(40,15,20,.5)]" />
                <span className="gate-handle absolute right-2.5 top-[58%] h-9 w-[3px] -translate-y-1/2 rounded-full" />
              </div>
            </div>

            {/* Cánh phải */}
            <div
              className={`door-leaf door-leaf-right absolute inset-y-0 right-0 z-20 w-1/2 ${
                opened ? 'is-open' : ''
              }`}
            >
              <div className="gate-leaf gate-leaf-right relative h-full w-full overflow-hidden">
                <div className="gate-leaf-panel gate-leaf-panel-right absolute bottom-[41%] left-2.5 right-2.5 top-3" />
                <div className="gate-leaf-panel absolute bottom-3 left-2.5 right-3 top-[63%] rounded-[4px]" />
                <span className="absolute left-1/2 top-4 h-1 w-1 -translate-x-1/2 rotate-45 bg-[#E3C892]/80" />
                <span className="absolute bottom-[37%] left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-[#E3C892]/60" />
                <span className="gate-leaf-sheen absolute inset-0" />
                <span className="absolute right-1 top-[16%] h-4 w-[5px] rounded-[2px] bg-[linear-gradient(180deg,#F4E2B8,#C9A25D_50%,#8F682F)] shadow-[0_1px_3px_rgba(40,15,20,.5)]" />
                <span className="absolute bottom-[14%] right-1 h-4 w-[5px] rounded-[2px] bg-[linear-gradient(180deg,#F4E2B8,#C9A25D_50%,#8F682F)] shadow-[0_1px_3px_rgba(40,15,20,.5)]" />
                <span className="gate-handle absolute left-2.5 top-[58%] h-9 w-[3px] -translate-y-1/2 rounded-full" />
              </div>
            </div>

            {/* Huy hiệu tim ở giữa hai cánh cửa */}
            <div
              className={`absolute left-1/2 top-[44%] z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-450 ${
                opened ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
              }`}
            >
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,#F9EBC6,#D6B273_28%,#8F682F_52%,#E8D1A0_74%,#B08343_100%)] shadow-[0_12px_22px_-10px_rgba(45,12,25,.8)]" />
                <div className="absolute inset-[4px] rounded-full border border-[#7E5A28]/60 bg-[radial-gradient(circle_at_38%_30%,#A14C60_0%,#762E42_52%,#4A1927_100%)] shadow-[inset_0_1px_2px_rgba(255,255,255,.35),inset_0_-2px_4px_rgba(0,0,0,.4)]" />
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 64 64"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="32" cy="32" r="25" stroke="rgba(244,220,166,.45)" strokeWidth="0.8" strokeDasharray="1 3.2" />
                </svg>
                <Heart
                  size={17}
                  fill="#F3D9A4"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F3D9A4]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bậc đá dưới chân cửa */}
      <div className="relative mt-[-1px] flex flex-col items-center">
        <span className="gate-step h-2 w-[70%] rounded-full" />
        <span className="gate-step -mt-0.5 h-2.5 w-[86%] rounded-full" />
      </div>

      {/* Bảng tên đồng */}
      <div className="relative mt-2.5 flex items-center gap-2 rounded-full border border-[#C9A25D]/45 bg-[#FFFBF1]/85 px-3.5 py-1.5 shadow-[0_12px_26px_-18px_rgba(90,45,45,.6),inset_0_1px_0_rgba(255,255,255,.85)] sm:mt-4 sm:gap-2.5 sm:px-4">
        <span className="h-px w-4 bg-[#C9A25D]/60" />
        <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#8C6435] sm:text-[9px]">
          {content.nickname}
        </span>
        <span className="h-1 w-1 rotate-45 bg-[#C9A25D]/70" />
        <span className="font-editorial text-[11px] italic text-[#9C3F56] sm:text-[12px]">
          tuổi {content.age}
        </span>
        <span className="h-px w-4 bg-[#C9A25D]/60" />
      </div>
    </div>
  )
}
