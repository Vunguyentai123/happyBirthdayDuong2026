import { ArrowRight } from 'lucide-react'
import { Character } from '../../components/Character'

// Trạng thái sau khi trả lời đúng: một chặng mới của tấm thiệp.
// Usagi giữ vai chính (lời reo), Momonga là lời bình phụ; hai mẩu giấy nhắn
// nhẹ thay cho dải hội thoại đều nhau, để panel không còn trống mà vẫn gọn.
export function GateOpened({
  usagiLine,
  momongaLine,
  onNext,
}: {
  usagiLine: string
  momongaLine: string
  onNext: () => void
}) {
  return (
    <div className="anim-pop">
      <div className="mt-1 grid gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,0.85fr)] sm:items-start sm:gap-3">
        <div className="relative rounded-[1.05rem] border border-[#D8C39F]/55 bg-[#FFFDF8]/75 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] sm:-rotate-[0.6deg] sm:px-3.5 sm:py-3">
          <span
            aria-hidden
            className="absolute left-5 top-0 h-2 w-9 -translate-y-1/2 -rotate-3 rounded-[2px] bg-[#E8C7CE]/80"
          />
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C9A25D]/45 bg-[#FBF1DD] shadow-[0_8px_16px_-12px_rgba(120,70,80,.5)] sm:h-14 sm:w-14">
              <Character
                name="usagi"
                role="cheer"
                maxWidth={52}
                className="drop-shadow-[0_6px_8px_rgba(120,70,80,.18)]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#8A5F22]">
                  Usagi
                </span>
                <span className="h-px w-4 bg-[#C9A25D]/40" />
              </div>
              <p className="mt-1 font-editorial text-[13px] italic leading-[1.45] text-[#5C3A45] sm:text-[14.5px]">
                {usagiLine}
              </p>
            </div>
          </div>
        </div>

        <span
          aria-hidden
          className="hidden self-stretch sm:flex sm:flex-col sm:items-center sm:gap-2"
        >
          <span className="h-2 w-px flex-1 bg-gradient-to-b from-transparent to-[#C9A25D]/45" />
          <span className="h-1.5 w-1.5 rotate-45 border border-[#C9A25D]/60 bg-[#FBF1DD]" />
          <span className="h-2 w-px flex-1 bg-gradient-to-t from-transparent to-[#C9A25D]/45" />
        </span>

        <div className="relative rounded-[1.05rem] border border-[#D8C39F]/45 bg-[#FFF9F4]/60 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] sm:mt-5 sm:rotate-[0.4deg] sm:px-3.5 sm:py-3">
          <span
            aria-hidden
            className="absolute right-5 top-0 h-2 w-8 -translate-y-1/2 rotate-2 rounded-[2px] bg-[#D8C39F]/55"
          />
          <div className="flex items-start gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C9A25D]/40 bg-[#F8E9ED] shadow-[0_8px_16px_-12px_rgba(120,70,80,.45)] sm:h-11 sm:w-11">
              <Character
                name="momonga"
                role="magic"
                maxWidth={40}
                className="drop-shadow-[0_6px_8px_rgba(120,70,80,.18)]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#B06A7E]">
                  Momonga
                </span>
                <span className="h-px w-4 bg-[#C9A25D]/35" />
              </div>
              <p className="mt-1 font-editorial text-[12px] italic leading-[1.45] text-[#6B4B55] sm:text-[13px]">
                {momongaLine}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5 sm:mt-4 sm:gap-4">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A25D]/40" />
        <button
          type="button"
          onClick={onNext}
          className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/80 bg-[#FFB4CB] px-4 text-[12px] font-extrabold text-[#5C1B33] shadow-[0_16px_30px_-16px_rgba(214,92,128,.9),inset_0_1px_0_rgba(255,255,255,.9)] transition hover:bg-[#FFC6D8] active:scale-[0.985] sm:h-11 sm:px-6 sm:text-[12.5px]"
        >
          Vào tiệc thôi
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A25D]/40" />
      </div>
    </div>
  )
}
