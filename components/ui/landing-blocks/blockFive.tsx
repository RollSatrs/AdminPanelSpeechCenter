"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import { Button } from "../button"
import { LessonFormat } from "@/app/types/lesson-formats.types"
import { useLanguage } from "@/components/language-provider"

const lessonFormatCopy = {
  ru: [
    {
      id: "individual",
      section1: {
        badge: "Формат: Индивидуальные занятия",
        title:
          "Индивидуальные занятия позволяют учитывать особенности развития ребёнка и работать над речью и когнитивными навыками в комфортном для него темпе.",
        cta: "Подробнее о формате",
      },
      section2: {
        badge: "Индивидуальные занятия",
        overlayText:
          "С ребёнком индивидуально работают логопед, дефектолог, нейропсихолог и психолог по программе, составленной после диагностики.",
        image: "/img1.png",
      },
      section3: {
        badge: "Форматы занятий",
        formatTitle: "Индивидуальные",
        description:
          "Подходит детям, которым нужен персональный подход и максимальное внимание специалиста для более точной коррекции и быстрого прогресса.",
      },
    },
    {
      id: "group",
      section1: {
        badge: "Формат: Групповые занятия",
        title:
          "Групповые занятия помогают детям развивать речь, навыки общения и учиться взаимодействовать со сверстниками.",
        cta: "Подобрать группу",
      },
      section2: {
        badge: "Групповые занятия",
        overlayText:
          "Небольшие группы включают подготовку к школе для детей с ЗПР и СДВГ, речевую предшкольную подготовку и общеразвивающие программы.",
        image: "/formatLesson.png",
      },
      section3: {
        badge: "Форматы занятий",
        formatTitle: "Групповые",
        description:
          "Подходит детям, которым важны развитие навыков, практика общения, умение работать в группе и следовать правилам занятий.",
      },
    },
  ],
  kz: [
    {
      id: "individual",
      section1: {
        badge: "Формат: Жеке сабақтар",
        title:
          "Жеке сабақтар баланың даму ерекшелігін ескеріп, сөйлеу және танымдық дағдыларын оған ыңғайлы қарқында дамытуға мүмкіндік береді.",
        cta: "Формат туралы толығырақ",
      },
      section2: {
        badge: "Жеке сабақтар",
        overlayText:
          "Балаға логопед, дефектолог, нейропсихолог және психолог диагностикадан кейін жасалған бағдарлама бойынша жеке жұмыс істейді.",
        image: "/img1.png",
      },
      section3: {
        badge: "Сабақ форматтары",
        formatTitle: "Жеке",
        description:
          "Жеке тәсіл мен маманның толық назарын қажет ететін, дәл түзету мен жылдам прогресс маңызды балаларға сәйкес келеді.",
      },
    },
    {
      id: "group",
      section1: {
        badge: "Формат: Топтық сабақтар",
        title:
          "Топтық сабақтар балаларға сөйлеуді, қарым-қатынас дағдыларын дамытып, құрдастарымен өзара әрекеттесуді үйренуге көмектеседі.",
        cta: "Топты таңдау",
      },
      section2: {
        badge: "Топтық сабақтар",
        overlayText:
          "Шағын топтарда ЗПР және СДВГ бар балаларға мектепке дайындық, сөйлеуді дамыту және жалпы дамыту бағдарламалары кіреді.",
        image: "/formatLesson.png",
      },
      section3: {
        badge: "Сабақ форматтары",
        formatTitle: "Топтық",
        description:
          "Қарым-қатынас тәжірибесі, топта жұмыс істеу және сабақ ережелерін ұстану маңызды балаларға лайық.",
      },
    },
  ],
} satisfies Record<"ru" | "kz", LessonFormat[]>

export default function BlockFive() {
  const { lang } = useLanguage()
  const lessonFormats = lessonFormatCopy[lang]
  const navLabels = {
    ru: {
      prev: "Предыдущий формат занятия",
      next: "Следующий формат занятия",
    },
    kz: {
      prev: "Алдыңғы сабақ форматы",
      next: "Келесі сабақ форматы",
    },
  }[lang]
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFormat = lessonFormats[activeIndex]

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + lessonFormats.length) % lessonFormats.length)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % lessonFormats.length)
  }

  return (
    <section id="working" className="scroll-mt-28 flex items-start justify-between px-8">
      <span id="prices" className="block h-0 w-0 overflow-hidden scroll-mt-28" aria-hidden="true" />
      <div className="flex flex-col items-start">
        <span className="mb-8 rounded-full border border-black/20 px-4 py-3 leading-none text-black">
          {activeFormat.section1.badge}
        </span>
        <p
          key={`${activeFormat.id}-s1-title`}
          className="mb-[60px] max-w-[431px] text-[22px] animate-lesson-text lesson-delay-2"
        >
          {activeFormat.section1.title}
        </p>
        <Button
          key={`${activeFormat.id}-s1-cta`}
          className="animate-lesson-text lesson-delay-3 rounded-full bg-[#FF7857] px-4 py-5 font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#ff6b46]"
        >
          {activeFormat.section1.cta}
          <ArrowUpRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <div className="relative h-[254px] w-[350px] overflow-hidden rounded-[29px]">
        <Image
          key={`${activeFormat.id}-s2-image`}
          src={activeFormat.section2.image}
          alt={activeFormat.section2.badge}
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

            <Button className="h-8 w-8 rounded-full bg-[#FF7857] p-0 text-white transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ff6b46]">
              <ArrowUpRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[350px]">
        <div className="flex flex-col items-start gap-2.5">
          <div className="relative h-[140px] w-[350px] overflow-hidden rounded-[29px]">
            <Image
              src={activeFormat.section2.image}
              alt={activeFormat.section3.formatTitle}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-start gap-[60px] p-3">
              <span className="rounded-full bg-[#D8CEC6]/90 px-3.5 py-1 text-[14px] text-white">
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
                className="h-[29px] w-[29px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black transition-all duration-300 ease-out hover:scale-105 hover:border-[#BDBDBD] hover:bg-transparent"
                aria-label={navLabels.prev}
                onClick={goPrev}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-[29px] w-[29px] rounded-full border-[#D4D4D4] bg-transparent p-0 text-black transition-all duration-300 ease-out hover:scale-105 hover:border-[#BDBDBD] hover:bg-transparent"
                aria-label={navLabels.next}
                onClick={goNext}
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
