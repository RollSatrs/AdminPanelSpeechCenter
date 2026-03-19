"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { LiveAudioWaveform } from "@/components/live-audio-waveform"
import { Button } from "../button"

const progressCases = [
  {
    id: "case-01",
    tag: "Кейс #01 · 6 лет",
    request: "Запрос: заикание",
    summary:
      "Речь была рывками: сложно начать предложение, много остановок на первых словах.",
    period: "Период работы: 12 недель · 2 раза в неделю · домашние задания с родителями.",
    image: "/child1.png",
    beforeAudio: "/audio/case-01-before.mp3",
    afterAudio: "/audio/case-01-after.mp3",
  },
  {
    id: "case-02",
    tag: "Кейс #02 · 5 лет",
    request: "Запрос: звуки «р» и «ш»",
    summary:
      "Речь была неразборчива для незнакомых людей, ребёнок избегал длинных слов.",
    period: "Период работы: 10 недель · 2 раза в неделю · ежедневная артикуляционная практика.",
    image: "/child2.png",
    beforeAudio: "/audio/case-02-before.mp3",
    afterAudio: "/audio/case-02-after.mp3",
  },
  {
    id: "case-03",
    tag: "Кейс #03 · 7 лет",
    request: "Запрос: запуск фразовой речи",
    summary:
      "Были короткие односложные ответы, ребёнку сложно было строить последовательный рассказ.",
    period: "Период работы: 14 недель · 2 раза в неделю · нейроигры и домашние сценарии речи.",
    image: "/child3.png",
    beforeAudio: "/audio/case-03-before.mp3",
    afterAudio: "/audio/case-03-after.mp3",
  },
  {
    id: "case-04",
    tag: "Кейс #04 · 6 лет",
    request: "Запрос: тихая, неуверенная речь",
    summary:
      "Ребёнок говорил очень тихо и редко вступал в диалог с новыми людьми.",
    period: "Период работы: 9 недель · 2 раза в неделю · голосовые упражнения дома.",
    image: "/child4.png",
    beforeAudio: "/audio/case-04-before.mp3",
    afterAudio: "/audio/case-04-after.mp3",
  },
] as const

export default function BlockSix() {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0)
  const activeCase = progressCases[activeCaseIndex]

  const goPrevCase = () => {
    setActiveCaseIndex((prev) => (prev - 1 + progressCases.length) % progressCases.length)
  }

  const goNextCase = () => {
    setActiveCaseIndex((prev) => (prev + 1) % progressCases.length)
  }

  return (
    <section id="results" className="scroll-mt-28 rounded-[48px] bg-white px-8 py-8 md:px-10 md:py-10">
      <div className="mb-14 flex flex-col items-center gap-3 text-center">
        <h2 className="text-[36px] font-bold leading-[1.15] text-black">
          Результаты
          <br />
          До и после
        </h2>
      </div>

      <div className="flex gap-x-11 lg:grid-cols-[360px_1fr]">
        <div className="relative h-[460px] w-[392px] overflow-hidden rounded-[32px]">
          <Image
            key={`${activeCase.id}-image`}
            src={activeCase.image}
            alt="Кейс ребёнка"
            fill
            className="object-cover transition-transform duration-500 ease-out hover:scale-105"
          />
        </div>

        <div className="flex items-start justify-center gap-4">
          <div className="flex flex-col items-start gap-4">
            <span
              key={`${activeCase.id}-tag`}
              className="rounded-full border border-black/15 px-4 py-2 text-[14px] text-black/70 animate-lesson-text lesson-delay-1"
            >
              {activeCase.tag}
            </span>

            <p
              key={`${activeCase.id}-summary`}
              className="max-w-[720px] text-[22px] leading-[1.35] text-black animate-lesson-text lesson-delay-2"
            >
              {activeCase.summary}
            </p>
            <span
              key={`${activeCase.id}-request`}
              className="w-fit rounded-full bg-[#FF7857]/20 px-3 py-1 text-[14px] font-medium text-[#E15D3B] animate-lesson-text lesson-delay-3"
            >
              {activeCase.request}
            </span>
            <p
              key={`${activeCase.id}-period`}
              className="text-[15px] text-black/70 animate-lesson-text lesson-delay-4"
            >
              {activeCase.period}
            </p>

            <div
              key={`${activeCase.id}-audio`}
              className="grid gap-4 animate-lesson-text lesson-delay-5 md:grid-cols-2"
            >
              <LiveAudioWaveform title="До" src={activeCase.beforeAudio} />
              <LiveAudioWaveform title="После" src={activeCase.afterAudio} />
            </div>

            <div className="items-center justify-between">
              <p className="text-[14px] text-black/55">
                Публикуется с согласия семьи. Персональные данные ребёнка скрыты.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-[32px] w-[32px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black transition-all duration-300 ease-out hover:scale-105 hover:border-[#BDBDBD] hover:bg-transparent"
                onClick={goPrevCase}
                aria-label="Предыдущий кейс"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-[32px] w-[32px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black transition-all duration-300 ease-out hover:scale-105 hover:border-[#BDBDBD] hover:bg-transparent"
                onClick={goNextCase}
                aria-label="Следующий кейс"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
