import { useMemo, useState } from 'react'
import { content, pickRandom } from '../data/content'
import { useSceneStore } from '../store/useSceneStore'
import { CompanionStrip } from './lock/CompanionStrip'
import { GateDoor } from './lock/GateDoor'
import { GateOpened } from './lock/GateOpened'
import { GateQuestion } from './lock/GateQuestion'

// Trang 1: CỔNG TÌNH YÊU — sân khấu cửa vòm + thiệp câu hỏi.
// Không còn màn giới thiệu/nhiệm vụ; cửa là tâm điểm của trang.
export function LockScene() {
  // Mỗi lượt chỉ bốc ngẫu nhiên 1 trong 3 câu trắc nghiệm.
  const [picked] = useState(() => Math.floor(Math.random() * content.gateQuiz.questions.length))
  const [shake, setShake] = useState(0)
  const [choiceMsg, setChoiceMsg] = useState<'almost' | 'scold' | null>(null)
  const gatePassed = useSceneStore((s) => s.gatePassed)
  const setGatePassed = useSceneStore((s) => s.setGatePassed)
  const [opened, setOpened] = useState(gatePassed)
  const setUnlocked = useSceneStore((s) => s.setUnlocked)
  const next = useSceneStore((s) => s.next)

  const question = content.gateQuiz.questions[picked]
  const blockLine = useMemo(() => pickRandom(content.momongaLines.gateBlock), [])
  const unlockLine = useMemo(() => pickRandom(content.momongaLines.unlock), [])

  const openDoor = () => {
    setOpened(true)
    setUnlocked(true)
    setGatePassed(true)
  }

  const choose = (option: string) => {
    if (option === question.correct) {
      setChoiceMsg(null)
      openDoor()
    } else if (question.almostOption && option === question.almostOption) {
      setChoiceMsg('almost')
    } else {
      setChoiceMsg('scold')
      setShake((s) => s + 1)
    }
  }

  const momongaLine = opened ? unlockLine : blockLine
  const usagiLine = opened
    ? 'Yaha! Chanh giỏi quá, mở được cửa rồi!'
    : `Chọn đáp án đúng nhất nha ${content.nickname}!`

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_26%,rgba(255,250,242,.78)_0%,rgba(255,247,240,.42)_52%,rgba(255,247,240,.1)_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-1 flex-col">
        <header className="mx-auto max-w-[760px] text-center">
          <h1 className="font-editorial text-balance text-[clamp(1.95rem,7vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-[#6B2B41]">
            Một cánh cửa nhỏ
            <span className="mt-1.5 block italic text-[#C05070]">dành cho {content.nickname}</span>
          </h1>

          {opened && (
            <p className="mx-auto mt-3 max-w-[32ch] font-editorial text-[13px] italic leading-relaxed text-[#8A626E] sm:mt-4 sm:text-sm">
              Mở rồi, vào thôi!
            </p>
          )}
        </header>

        <div className={`grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 ${opened ? 'mt-4 sm:mt-9' : 'mt-5 sm:mt-9'}`}>
          {/* Sân khấu cửa */}
          <div className="gate-alcove relative overflow-hidden rounded-[1.6rem] px-3 pb-4 pt-8 sm:rounded-[2rem] sm:px-6 sm:pb-8 sm:pt-12">
            <div className="gate-spotlight" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-5 top-4 flex items-center justify-between"
            >
              <span className="h-px w-9 bg-[#C9A25D]/35" />
              <span className="h-1 w-1 rotate-45 bg-[#C9A25D]/45" />
              <span className="h-px w-9 bg-[#C9A25D]/35" />
            </div>

            <GateDoor opened={opened} />
          </div>

          {/* Thiệp câu hỏi */}
          <div className={`gate-invitation relative flex flex-col overflow-hidden rounded-[2rem] ${opened ? 'p-4 sm:p-7' : 'p-5 sm:p-7'}`}>
            {/* Khung trong đồng tâm: bán kính = bán kính thẻ (2rem) - inset (0.625rem). */}
            <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[calc(2rem-0.625rem)] border border-[#C9A25D]/25" />

            <div className="relative">
              {opened ? (
                <GateOpened
                  usagiLine={usagiLine}
                  momongaLine={momongaLine}
                  onNext={next}
                />
              ) : (
                <>
                  <GateQuestion
                    question={question}
                    shake={shake}
                    choiceMsg={choiceMsg}
                    onChoose={choose}
                  />

                  <CompanionStrip momongaLine={momongaLine} usagiLine={usagiLine} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
