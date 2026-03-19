"use client"

import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "../badge"
import { Button } from "../button"
import { Team } from "@/app/types/team-types"

const COLLAPSED_DESCRIPTION_HEIGHT = 42
const EXPANDED_DESCRIPTION_HEIGHT = 220
const DESCRIPTION_TOGGLE_THRESHOLD = 95
const teams: Record<"ru" | "kz", Team[]> = {
  ru: [
  {
    id: "1",
    img: "/team6.png",
    experience: "14 лет",
    fullname: "Утепбаева Айгерим Адильжановна",
    tag: "Руководитель центра, нейропсихолог",
    description:
      "Работает над развитием речи, внимания, мышления и коммуникации у детей. Применяет индивидуальные и комплексные программы, сенсомоторные игры и метод замещающего онтогенеза.",
  },
  {
    id: "2",
    img: "/team1.png",
    experience: "13 лет",
    fullname: "Елеусизкызы Меруерт",
    tag: "Руководитель центра, психолог, дефектолог",
    description:
      "Работает с детьми с трудностями обучения и развития, помогает раскрыть потенциал ребёнка через индивидуальные и комплексные программы и готовит детей к школе.",
  },
  {

    id: "3",
    img: "/team3.png",
    experience: "7 лет",
    fullname: "Жиенбаева Балжан Алтынбайкызы",
    tag: "Подготовка к школе",
    description:
      "Использует нейропсихологические методы для развития внимания, памяти, мышления, речи и учебных навыков с учётом индивидуальных особенностей ребёнка.",      
  },
  {
    id: "4",
    img: "/team2.png",
    experience: "4 года",
    fullname: "Гайсаева Батима Ботаевна",
    tag: "Дефектолог-логопед",
    description:
      "Работает с детьми с ЗРР, РАС, сенсорными особенностями и трудностями поведения. Использует сенсорную интеграцию, логоритмику, массаж и игровые техники развития речи.",
  },
  {
    id: "5",
    img: "/team5.png",
    experience: "1 год",
    fullname: "Айтахметова Соледад Айтахметовна",
    tag: "Дошкольное развитие",
    description:
      "Проводит занятия по подготовке детей к школе, развивает речь, внимание, мышление и математические представления, включая сенсомоторные игры и элементы нейрокоррекции.",
  },
  {
    id: "6",
    img: "/team4.png",
    experience: "Начинающий специалист",
    fullname: "Манапова Аяжан Жасуланқызы",
    tag: "Психолог",
    description:
      "Помогает детям развивать эмоциональный и социальный интеллект, навыки общения и саморегуляции, а также проводит игры по методике МАК-карт для сотрудников центра.",
  },
],
  kz: [
  {
    id: "1",
    img: "/team6.png",
    experience: "14 жыл",
    fullname: "Утепбаева Айгерим Адильжановна",
    tag: "Орталық жетекшісі, нейропсихолог",
    description:
      "Балалардың сөйлеуін, зейінін, ойлауын және қарым-қатынасын дамытуға көмектеседі. Жеке және кешенді бағдарламаларды, сенсомоторлық ойындарды және алмастырушы онтогенез әдісін қолданады.",
  },
  {
    id: "2",
    img: "/team1.png",
    experience: "13 жыл",
    fullname: "Елеусизкызы Меруерт",
    tag: "Орталық жетекшісі, психолог, дефектолог",
    description:
      "Оқу мен дамуында қиындықтары бар балалармен жұмыс істейді, жеке және кешенді бағдарламалар арқылы баланың әлеуетін ашуға және мектепке дайындауға көмектеседі.",
  },
  {
    id: "3",
    img: "/team3.png",
    experience: "7 жыл",
    fullname: "Жиенбаева Балжан Алтынбайкызы",
    tag: "Мектепке дайындық",
    description:
      "Зейінді, есте сақтауды, ойлауды, сөйлеуді және оқу дағдыларын баланың жеке ерекшелігін ескере отырып дамыту үшін нейропсихологиялық әдістерді қолданады.",
  },
  {
    id: "4",
    img: "/team2.png",
    experience: "4 жыл",
    fullname: "Гайсаева Батима Ботаевна",
    tag: "Дефектолог-логопед",
    description:
      "ЗРР, РАС, сенсорлық ерекшеліктері мен мінез-құлық қиындықтары бар балалармен жұмыс істейді. Сенсорлық интеграцияны, логоритмиканы, массажды және сөйлеуді дамыту ойын тәсілдерін қолданады.",
  },
  {
    id: "5",
    img: "/team5.png",
    experience: "1 жыл",
    fullname: "Айтахметова Соледад Айтахметовна",
    tag: "Мектепке дейінгі даму",
    description:
      "Балаларды мектепке дайындау сабақтарын өткізеді, сөйлеуді, зейінді, ойлауды және математикалық түсініктерді дамытады, сенсомоторлық ойындар мен нейротүзету элементтерін қолданады.",
  },
  {
    id: "6",
    img: "/team4.png",
    experience: "Жас маман",
    fullname: "Манапова Аяжан Жасуланқызы",
    tag: "Психолог",
    description:
      "Балалардың эмоциялық және әлеуметтік интеллектін, қарым-қатынас дағдыларын және өзін-өзі реттеу қабілетін дамытуға көмектеседі, сондай-ақ орталық қызметкерлеріне МАК-карт әдісі бойынша ойындар өткізеді.",
  },
]}

export default function BlockSeven() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      title: "О нашей команде",
      experience: "Опыт работы",
      hide: "Скрыть",
      readMore: "Читать дальше",
      cta: "Записаться",
      newLabel: "New",
      newSpecialist: "Начинающий специалист",
    },
    kz: {
      title: "Біздің команда",
      experience: "Жұмыс тәжірибесі",
      hide: "Жасыру",
      readMore: "Толығырақ",
      cta: "Жазылу",
      newLabel: "New",
      newSpecialist: "Жас маман",
    },
  }[lang]
  const localizedTeams = teams[lang]
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const toggleDescription = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <section id="team" className="scroll-mt-28 flex flex-col items-center gap-12">
      <h2 className="text-[36px] font-bold">{t.title}</h2>
      <div className="grid grid-cols-1 justify-items-center gap-x-[70px] gap-y-[32px] md:grid-cols-2 xl:grid-cols-3">
        {localizedTeams.map((team) => {
          const isExpanded = expandedIds.includes(team.id)
          const isOverflowing = team.description.length > DESCRIPTION_TOGGLE_THRESHOLD
          const isNewSpecialist = team.experience === t.newSpecialist
          const teamTags = team.tag.split(",").map((tag) => tag.trim())

          return (
            <div
              key={team.id}
              className="group h-[403px] w-[305px] rounded-[30px] bg-[#EAE8E8] px-[9px] py-[8px] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
            >
              <div className="relative h-full w-full overflow-hidden rounded-[30px]">
                <Image
                  src={team.img}
                  alt={`Логопед ${team.fullname}`}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 text-white">
                  <span className="text-[15px] font-semibold">{t.experience}</span>
                  <div className="flex flex-col items-end gap-1">
                    {isNewSpecialist ? (
                      <span className="rounded-full bg-[#FF7857] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(255,120,87,0.35)]">
                        {t.newLabel}
                      </span>
                    ) : null}
                    {!isNewSpecialist ? <span className="text-[15px]">{team.experience}</span> : null}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div
                    className="absolute inset-x-0 bottom-0 h-full rounded-[30px] bg-[#c4c4c413] backdrop-blur-[40px]"
                    style={{
                      WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
                      maskImage: "linear-gradient(to top, black 50%,transparent 100%)",
                    }}
                  />
                  <div className="relative z-10">
                    <h3 className="text-[18px] font-semibold leading-[1.05]">{team.fullname}</h3>
                    <div className="mt-2 flex max-w-full flex-wrap gap-2">
                      {teamTags.map((tag) => (
                        <Badge
                          key={`${team.id}-${tag}`}
                          className="inline-flex h-auto w-fit max-w-full rounded-full border-0 bg-[#FFB79F]/18 px-3 py-1 text-[10px] font-medium leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px]"
                          variant="secondary"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div
                      className="mt-3 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        maxHeight: isExpanded
                          ? `${EXPANDED_DESCRIPTION_HEIGHT}px`
                          : `${COLLAPSED_DESCRIPTION_HEIGHT}px`,
                        opacity: isExpanded ? 1 : 0.92,
                        transform: isExpanded ? "translateY(0px)" : "translateY(-2px)",
                      }}
                    >
                      <p className="text-[14px] leading-[1.35] text-white/95">
                        {team.description}
                      </p>
                    </div>

                    {isOverflowing ? (
                      <button
                        type="button"
                        onClick={() => toggleDescription(team.id)}
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-white/90 transition-all duration-300 ease-out hover:text-white"
                      >
                        <span>{isExpanded ? t.hide : t.readMore}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : null}

                    <div className="mt-4 flex justify-center">
                      <Button className="rounded-full bg-[#FF7857] px-8 text-[14px] text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#ff6f4c]">
                        {t.cta}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
