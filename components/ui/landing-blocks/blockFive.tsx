"use client"

import Image from "next/image"
import { useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react"

import { Button } from "../button"
import { LessonFormat } from "@/app/types/lesson-formats.types"
import { useLanguage } from "@/components/language-provider"

const COLLAPSED_OVERLAY_HEIGHT = 64
const EXPANDED_OVERLAY_HEIGHT = 280
const OVERLAY_TOGGLE_THRESHOLD = 115

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
      hide: "Скрыть",
      readMore: "Читать дальше",
    },
    kz: {
      prev: "Алдыңғы сабақ форматы",
      next: "Келесі сабақ форматы",
      hide: "Жасыру",
      readMore: "Толығырақ",
    },
  }[lang]
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOverlayExpanded, setIsOverlayExpanded] = useState(false)
  const activeFormat = lessonFormats[activeIndex]
  const isOverlayOverflowing =
    activeFormat.section2.overlayText.length > OVERLAY_TOGGLE_THRESHOLD

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + lessonFormats.length) % lessonFormats.length)
    setIsOverlayExpanded(false)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % lessonFormats.length)
    setIsOverlayExpanded(false)
  }

  return (
    <section id="working" className="scroll-mt-28 flex flex-col gap-6 px-0 md:px-8 xl:flex-row xl:items-start xl:justify-between">
      <span id="prices" className="block h-0 w-0 overflow-hidden scroll-mt-28" aria-hidden="true" />
      <div className="flex flex-col items-center text-center xl:items-start xl:text-left">
        <span className="mb-5 w-full rounded-full px-4 py-3 text-[15px] leading-none text-black md:mb-8 xl:w-auto">
          {activeFormat.section1.badge}
        </span>
        <p
          key={`${activeFormat.id}-s1-title`}
          className="mb-6 max-w-[431px] text-[18px] leading-[1.45] animate-lesson-text lesson-delay-2 md:text-[20px] xl:mb-[60px] xl:text-[22px]"
        >
          {activeFormat.section1.title}
        </p>
      </div>

      <div className="relative order-2 h-[260px] w-full overflow-hidden rounded-[28px] md:h-[300px] xl:order-none xl:h-[254px] xl:w-[350px] xl:rounded-[29px]">
        <Image
          key={`${activeFormat.id}-s2-image`}
          src={activeFormat.section2.image}
          alt={activeFormat.section2.badge}
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 flex flex-col bg-gradient-to-t from-black/40 via-black/5 to-transparent p-4 xl:p-3">
          <span className="inline-block w-fit rounded-full bg-[#dadada6d] px-3.5 py-1 text-[13px] text-white backdrop-blur-[10px] xl:text-[14px]">
            <span
              key={`${activeFormat.id}-s2-badge-text`}
              className="inline-block animate-lesson-text lesson-delay-4"
            >
              {activeFormat.section2.badge}
            </span>
          </span>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="max-w-[240px] xl:max-w-[228px]">
              <div
                className="overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  maxHeight: isOverlayExpanded
                    ? `${EXPANDED_OVERLAY_HEIGHT}px`
                    : `${COLLAPSED_OVERLAY_HEIGHT}px`,
                  opacity: isOverlayExpanded ? 1 : 0.92,
                  transform: isOverlayExpanded ? "translateY(0px)" : "translateY(-2px)",
                }}
              >
                <p
                  key={`${activeFormat.id}-s2-overlay`}
                  className="text-[15px] leading-[1.45] text-white animate-lesson-text lesson-delay-5 xl:text-[14px]"
                >
                  {activeFormat.section2.overlayText}
                </p>
              </div>

              {isOverlayOverflowing ? (
                <button
                  type="button"
                  onClick={() => setIsOverlayExpanded((prev) => !prev)}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-white/90 transition-all duration-300 ease-out hover:text-white"
                >
                  <span>{isOverlayExpanded ? navLabels.hide : navLabels.readMore}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isOverlayExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : null}
            </div>

            <Button className="h-10 w-10 rounded-full bg-[#FF7857] p-0 text-white transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ff6b46] xl:h-8 xl:w-8">
              <ArrowUpRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="order-3 w-full xl:order-none xl:max-w-[350px]">
        <div className="flex flex-col items-stretch gap-3">
          <div className="relative hidden h-[140px] w-[350px] overflow-hidden rounded-[29px] xl:block">
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

          <div className="rounded-[26px] bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] xl:rounded-none xl:bg-transparent xl:p-0 xl:shadow-none">
            <div className="mb-3 xl:hidden">
              <span className="inline-flex rounded-full bg-[#D8CEC6]/90 px-3 py-1 text-[13px] text-white">
                {activeFormat.section3.badge}
              </span>
            </div>
            <div className="mb-3 xl:hidden text-[18px] font-medium text-black">
              {activeFormat.section3.formatTitle}
            </div>
            <p
              key={`${activeFormat.id}-s3-description`}
              className="text-[15px] leading-[1.5] animate-lesson-text lesson-delay-8 xl:text-[14px]"
            >
              {activeFormat.section3.description}
            </p>
            <Button
              key={`${activeFormat.id}-s3-cta`}
              className="mt-5 w-fit rounded-full bg-[#FF7857] px-5 py-3.5 font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#ff6b46]"
            >
              {activeFormat.section1.cta}
              <ArrowUpRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="mt-4 flex items-center justify-center gap-3 xl:justify-start">
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
