import { CircleAlert, Lightbulb } from 'lucide-react'
import type { GateChoiceQuestion } from '../../data/content'

interface GateQuestionProps {
  question: GateChoiceQuestion
  shake: number
  choiceMsg: 'almost' | 'scold' | null
  onChoose: (option: string) => void
}

// Thiệp câu hỏi trắc nghiệm: một câu hỏi ngẫu nhiên, chọn 1 trong 4 đáp án.
// Trình bày như giấy mỹ thuật: đường kẻ vàng, chữ serif, nút màu rượu vang.
export function GateQuestion({ question, shake, choiceMsg, onChoose }: GateQuestionProps) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <span className="h-px w-6 bg-[#C9A25D]/60" />
        <span className="text-[8.5px] font-extrabold uppercase tracking-[0.22em] text-[#8A5F22] sm:text-[9px]">
          Câu hỏi nhỏ của Momonga
        </span>
      </div>

      <p className="mt-2.5 font-editorial text-[1.4rem] font-medium leading-[1.25] text-[#5E2439] sm:text-[1.6rem]">
        {question.question}
      </p>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2.5">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => onChoose(option)}
              className="group flex min-h-[52px] items-center gap-2.5 rounded-xl border border-[#DCC9AE] bg-[#FFFDF8]/80 px-3 py-2.5 text-left text-[13px] font-extrabold text-[#4B2B38] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition hover:-translate-y-0.5 hover:border-[#B58A4E] hover:bg-[#FFF9EE] hover:shadow-[0_16px_26px_-20px_rgba(120,70,60,.55)] active:scale-[0.985]"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border border-[#C9A25D]/40 bg-[#FBF2E2] font-editorial text-[11px] font-semibold text-[#8A5F22] transition group-hover:border-[#B58A4E]/60 group-hover:bg-[#F6E8CE]">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {choiceMsg === 'scold' && (
            <div
              key={`scold-${shake}`}
              className="anim-shake mt-2.5 flex items-start gap-2 rounded-lg border border-[#EBC9CE] bg-[#FCF0F1] px-3 py-2 text-xs font-bold leading-relaxed text-[#A33F52]"
            >
              <CircleAlert size={14} className="mt-0.5 shrink-0" />
              {question.scold}
            </div>
          )}
          {choiceMsg === 'almost' && question.almost && (
            <div className="anim-pop mt-2.5 flex items-start gap-2 rounded-lg border border-[#E7D5B3] bg-[#FBF4E4] px-3 py-2 text-xs font-bold leading-relaxed text-[#8B6127]">
              <Lightbulb size={14} className="mt-0.5 shrink-0" />
              {question.almost}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
