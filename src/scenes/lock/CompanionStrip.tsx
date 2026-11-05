import { Character } from '../../components/Character'

// Dải hội thoại trước khi mở cổng: chân dung nhỏ + lời thoại, ngăn bằng
// đường kẻ vàng mảnh thay cho các khối pill.
export function CompanionStrip({
  momongaLine,
  usagiLine,
}: {
  momongaLine: string
  usagiLine: string
}) {
  return (
    <div className="mt-5 grid gap-3 border-t border-[#C9A25D]/25 pt-4 sm:grid-cols-2 sm:gap-4">
      <div className="flex items-center gap-2.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C9A25D]/30 bg-[#F8E9ED] sm:h-12 sm:w-12">
          <Character
            name="momonga"
            role="guard"
            maxWidth={42}
            className="drop-shadow-[0_6px_8px_rgba(120,70,80,.18)]"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#B06A7E]">
              Momonga
            </span>
            <span className="h-px w-3 bg-[#C9A25D]/40" />
          </div>
          <p className="mt-0.5 font-editorial text-[12px] italic leading-[1.4] text-[#6B4B55] sm:text-[12.5px]">
            {momongaLine}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C9A25D]/30 bg-[#FBF1DD] sm:h-12 sm:w-12">
          <Character
            name="usagi"
            role="waiting"
            maxWidth={38}
            className="drop-shadow-[0_6px_8px_rgba(120,70,80,.18)]"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#8A5F22]">
              Usagi
            </span>
            <span className="h-px w-3 bg-[#C9A25D]/40" />
          </div>
          <p className="mt-0.5 font-editorial text-[12px] italic leading-[1.4] text-[#6B4B55] sm:text-[12.5px]">
            {usagiLine}
          </p>
        </div>
      </div>
    </div>
  )
}
