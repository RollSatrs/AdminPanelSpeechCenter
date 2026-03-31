"use client"

import { AvatarGroupCountExample } from "@/components/avatar-groups"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"
import { Button } from "../button"
import { ExternalLink } from "lucide-react"

const blockOneCopy = {
  ru: {
    title: "Каждый ребёнок достоин быть услышанным.\nМы помогаем найти свой голос",
    description:
      "Безопасное и радостное пространство для развития речи — где опытные логопеды и современные методы превращают первые звуки в уверенные фразы.",
    cta: "Записаться",
    specialists: "Опытные специалисты.\nЗаметный результат.",
  },
  kz: {
    title: "Әр бала тыңдалуға лайық.\nБіз өз дауысын табуға көмектесеміз",
    description:
      "Сөйлеуді дамытуға арналған қауіпсіз әрі қуанышты кеңістік: тәжірибелі логопедтер мен заманауи әдістер алғашқы дыбыстарды сенімді сөйлемдерге айналдырады.",
    cta: "Жазылу",
    specialists: "Тәжірибелі мамандар.\nНәтиже байқалады.",
  },
} as const

export default function BlockOne() {
  const { lang } = useLanguage()
  const t = blockOneCopy[lang]
  const titleLines = t.title.split("\n")
  const specialistLines = t.specialists.split("\n")
  const whatsappMessage =
    lang === "ru"
      ? "Здравствуйте! Хочу записаться на консультацию в SOZLAB.kids."
      : "Сәлеметсіз бе! SOZLAB.kids орталығына консультацияға жазылғым келеді."
  const whatsappHref = `https://wa.me/77474381892?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <section className="relative min-h-[580px] overflow-hidden rounded-[30px] md:min-h-[724px] md:rounded-[74px] max-[350px]:rounded-[24px]">
      <Image
        src="/main.png"
        alt=""
        fill
        priority
        className="h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-[rgba(116,116,116,0.18)] backdrop-blur-[10px]">
        <div className="flex h-full flex-col px-4 pb-5 pt-16 text-white sm:px-6 md:px-8 md:pb-10 md:pt-[150px] max-[350px]:px-3 max-[350px]:pt-14">
          <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
            <h1 className="w-full max-w-[960px] pb-4 text-[23px] font-bold leading-[1.12] sm:text-[30px] md:text-[38px] md:leading-[1.2] max-[350px]:text-[21px]">
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </h1>

            <p className="w-full max-w-[697px] pb-6 text-[14px] leading-[1.45] text-white/80 sm:text-[17px] md:pb-8 md:text-[19px] md:text-white/70 max-[350px]:text-[13px]">
              {t.description}
            </p>

            <Button
              asChild
              className="min-h-11 rounded-full bg-[#FF7857] px-6 text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#ff6b46] sm:min-h-12 sm:px-10 sm:text-[16px] md:rounded-3xl md:px-6 md:py-5 md:text-xl max-[350px]:px-5 max-[350px]:text-[14px]"
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                {t.cta}
              </a>
            </Button>
          </div>

          <div className="mt-auto flex w-full flex-col items-center gap-4 pt-6 text-white md:flex-row md:items-end md:justify-between md:pt-0">
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <span className="max-w-[220px] text-center text-[12px] leading-[1.25] md:max-w-none md:text-left md:text-[14px] max-[350px]:text-[11px]">
                <span className="md:hidden">
                  {lang === "ru" ? "Опытные специалисты" : "Тәжірибелі мамандар"}
                </span>
                <span className="hidden md:inline">
                  {specialistLines[0]}
                  <br />
                  {specialistLines[1]}
                </span>
              </span>
              <AvatarGroupCountExample />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end md:gap-6">
              <a
                href="https://www.instagram.com/sozlab.kids?igsh=M2lpczkwN2N1bDE5"
                className="flex items-center gap-1 text-[13px] text-white sm:text-[15px]"
              >
                <span>instagram</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              <a
                href="https://wa.me/77474381892"
                className="flex items-center gap-1 text-[13px] text-white sm:text-[15px]"
              >
                <span>whatsapp</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
