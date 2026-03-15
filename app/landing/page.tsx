"use client"

import { AvatarGroupCountExample } from "@/components/avatar-groups"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react"
import { useState } from "react"
import Image from "next/image";
import { LessonFormat } from "../types/lesson-formats.types";

export default function LandingPage() {
  const steps = [
    {
      number: "01",
      color: "bg-cyan-400",
      title: "Речевая диагностика",
      text: "В игровой форме проверяем речь, понимание, внимание и моторику.",
    },
    {
      number: "02",
      color: "bg-orange-400",
      title: "Персональная программа",
      text: "Составляем план именно под вашего ребёнка: диагноз, характер, темп развития.",
    },
    {
      number: "03",
      color: "bg-cyan-400",
      title: "Игровые занятия + нейроподход",
      text: "Через игры, артикуляцию, дыхание и упражнения ребёнок начинает говорить легче.",
    },
    {
      number: "04",
      color: "bg-orange-400",
      title: "Вы — часть команды",
      text: "После каждого занятия вы получаете обратную связь и рекомендации для дома.",
    },
  ];

  const lessonFormats: LessonFormat[] = [
    {
      id: "individual",
      section1: {
        badge: "Занятие",
        title:
          "Индивидуальные занятия помогают ребёнку говорить чётко, свободно и без стеснения.",
        cta: "Подробнее о занятиях",
      },
      section2: {
        badge: "Индивидуальные занятия",
        overlayText:
          "Занятия, разработанные под возраст, характер и особенности развития ребёнка.",
        image: "/img1.png",
      },
      section3: {
        badge: "Форматы занятий",
        formatTitle: "Индивидуальные",
        description:
          "Персональная работа один-на-один с логопедом — максимум внимания и быстрый прогресс.",
      },
    },
    {
      id: "group",
      section1: {
        badge: "Занятие",
        title:
          "Мини-группы развивают речь в общении со сверстниками и помогают преодолеть стеснение.",
        cta: "Подобрать группу",
      },
      section2: {
        badge: "Мини-группа",
        overlayText:
          "Развиваем диалог, словарь и уверенность через игровые задания в мини-группах.",
        image: "/group.png",
      },
      section3: {
        badge: "Форматы занятий",
        formatTitle: "Мини-группа",
        description:
          "Небольшие группы 2–4 ребёнка: баланс внимания логопеда и живой речевой практики.",
      },
    },
    {
      id: "online",
      section1: {
        badge: "Занятие",
        title:
          "Онлайн-формат позволяет заниматься регулярно из дома и сохранять стабильный прогресс.",
        cta: "Выбрать онлайн",
      },
      section2: {
        badge: "Онлайн-занятия",
        overlayText:
          "Интерактивные занятия с обратной связью для родителей после каждого урока.",
        image: "/online.png",
      },
      section3: {
        badge: "Форматы занятий",
        formatTitle: "Онлайн",
        description:
          "Удобный формат для семей с плотным графиком: подключайтесь из любой точки.",
      },
    },
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const activeFormat = lessonFormats[activeIndex]

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + lessonFormats.length) % lessonFormats.length)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % lessonFormats.length)
  }
  return (
    <>
      <div className="relative overflow-hidden rounded-[74px] mb-[72px]">
        <img
          src="/main.png"
          alt=""
          className="h-[724px] w-full object-cover"
        />

        <div className="absolute inset-0 bg-[rgba(116,116,116,0.18)] backdrop-blur-[10px]">
          <div className="flex h-full flex-col px-8 pt-[150px] pb-10 text-white">
            <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
              <h1 className="w-full max-w-[960px] pb-4 text-[38px] font-bold leading-[1.2]">
                Каждый ребёнок достоин быть услышанным.
                <br />
                Мы помогаем найти свой голос
              </h1>

              <p className="w-full max-w-[697px] pb-8 text-[19px] leading-[1.5] text-white/70">
                Безопасное и радостное пространство для развития речи — где опытные
                логопеды и современные методы превращают первые звуки в уверенные фразы.
              </p>

              <Button className="rounded-3xl bg-[#FF7857] px-6 py-5 text-xl text-white hover:bg-[#ff6b46]">
                Записаться
              </Button>
            </div>

            <div className="mt-auto flex w-full items-end justify-between text-white">
              <div className="flex items-center gap-3">
                <span className="text-left text-[14px] leading-[1.2]">
                  Опытные специалисты.
                  <br />
                  Заметный результат.
                </span>
                <AvatarGroupCountExample />
              </div>

              <div className="flex items-center gap-6">
                <a
                  href="https://instagram.com"
                  className="flex items-center gap-1 text-white"
                >
                  <span>instagram</span>
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href="https://wa.me/77000000000"
                  className="flex items-center gap-1 text-white"
                >
                  <span>whatsapp</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 md:flex-row md:justify-between md:items-start mb-[72px]">
        <span className="rounded-full border border-black/20 px-4 py-3 leading-none text-black">
          О центре
        </span>
        <p className="max-w-[492px] max-h-[128px] leading-[1.3] text-black px-14">
          В нашем центре мы не просто ставим звуки - мы помогаем детям
          полюбить говорить. С 2021 года мы стали местом, где помогают и
          малышам, и детям постарше.
        </p>
      </div>

      <div className="flex border-2 rounded-[71px] px-11 py-5 mb-[72px] border-[#E2E2E2] justify-between">
        <div className="flex flex-col max-w-[464px] gap-y-4">
          <h3 className="text-[48px]">
            Если вы замечаете это…
          </h3>
          <p className="text-[18px]">
            Речь ребёнка развивается постепенно, но есть ориентиры, помогающие понять, 
            всё ли идёт гармонично. Если малыш мало говорит или его трудно понять, 
            это может быть сигналом, что ему нужна поддержка. 
            Раннее внимание помогает скорректировать развитие.
          </p>
        </div>
        <div className="h-83 w-[4px] rounded-full bg-[#FF7857]" />
        <div className="flex flex-col gap-y-4 max-w-[468px]">
          <div>
            <span className="text-[32px]">01</span>
            <p>Использует 1–2 слова, не строит фразы, чаще показывает жестами.</p>
          </div>
          <div>
            <span className="text-[32px]">02</span>
            <p>«Р» не выговаривает, путает «ш» и «с», речь неразборчива.</p>
          </div>
          <div>
            <span className="text-[32px]">03</span>
            <p>Другие дети уже говорят предложениями, а вашему малышу трудно.</p>
          </div>
        </div>
      </div>

      <section className="mb-[72px] rounded-[71px] bg-[#F6F6F6] px-8 py-12 md:px-12 lg:px-16">
        <h2 className="mx-auto mb-14 max-w-[760px] text-center text-[34px] font-bold leading-[1.2] text-black md:text-[48px]">
          Как мы помогаем вашему малышу заговорить
        </h2>

        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4 xl:gap-8 mb-[72px]">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <span className="mb-5 text-[44px] leading-none text-black md:text-[54px]">
                {step.number}
              </span>

              <div className="mb-6 flex w-full items-center justify-center gap-4">
                <span className={`h-[18px] w-[18px] rounded-full ${step.color}`} />
              </div>

              <h3 className="mb-3 min-h-[56px] text-[22px] font-bold leading-[1.2] text-black">
                {step.title}
              </h3>

              <p className="max-w-[260px] text-[17px] leading-[1.45] text-black/75">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-8 flex items-start justify-between">
        <div className="flex flex-col items-start">
          <span className="rounded-full border border-black/20 px-4 py-3 leading-none text-black mb-8">
            Занятие
          </span>
          <p
            key={`${activeFormat.id}-s1-title`}
            className="max-w-[431px] mb-[60px] text-[22px] animate-lesson-text lesson-delay-2"
          >
            {activeFormat.section1.title}
          </p>
          <Button
            key={`${activeFormat.id}-s1-cta`}
            className="font-bold bg-[#FF7857] px-4 py-5 rounded-full text-white animate-lesson-text lesson-delay-3"
          >
            {activeFormat.section1.cta}
            <ArrowUpRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="relative h-[254px] w-[350px] overflow-hidden rounded-[29px]">
          <Image
            src="/img1.png"
            alt=""
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 flex flex-col p-3">
            <span className="inline-block w-fit rounded-full bg-[#dadada6d] px-3.5 py-1 text-[14px] text-white backdrop-blur-[10px]">
              <span
                key={`${activeFormat.id}-s2-badge-text`}
                className="inline-block animate-lesson-text lesson-delay-4"
              >
                {activeFormat.section2.badge}
              </span>
            </span>

            <div className="mt-auto flex items-end justify-between gap-4">
              <p
                key={`${activeFormat.id}-s2-overlay`}
                className="max-w-[242px] text-[14px] text-white animate-lesson-text lesson-delay-5"
              >
                {activeFormat.section2.overlayText}
              </p>

              <Button className="h-8 w-8 rounded-full bg-[#FF7857] p-0 text-white">
                <ArrowUpRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[350px]">
          <div className="flex flex-col items-start gap-2.5">
            <div className="relative w-[350px] h-[140px] rounded-[29px] ">
              <Image
                src="/formatLesson.png"
                alt="individual"
                fill
                className="object-cover"
              />
              <div className="absolute flex flex-col gap-[60px] items-start  inset-0 p-3">
                <span className="rounded-full bg-[#dadada6d] px-3.5 py-1 text-[14px] text-white backdrop-blur-[10px]">
                  <span
                    key={`${activeFormat.id}-s3-badge-text`}
                    className="inline-block animate-lesson-text lesson-delay-6"
                  >
                    {activeFormat.section3.badge}
                  </span>
                </span>
                <span
                  key={`${activeFormat.id}-s3-title`}
                  className="rounded-full text-[14px] text-white animate-lesson-text lesson-delay-7"
                >
                  {activeFormat.section3.formatTitle}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <p
                key={`${activeFormat.id}-s3-description`}
                className="text-[14px] animate-lesson-text lesson-delay-8"
              >
                {activeFormat.section3.description}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-[29px] w-[29px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black hover:bg-transparent"
                  aria-label="Предыдущий формат занятия"
                  onClick={goPrev}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-[29px] w-[29px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black hover:bg-transparent"
                  aria-label="Следующий формат занятия"
                  onClick={goNext}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>

  )
}
