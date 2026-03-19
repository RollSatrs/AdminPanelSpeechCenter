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

  return (
    <section className="relative min-h-[724px] overflow-hidden rounded-[74px]">
      <Image
        src="/main.png"
        alt=""
        fill
        priority
        className="h-[724px] w-full object-cover"
      />

      <div className="absolute inset-0 bg-[rgba(116,116,116,0.18)] backdrop-blur-[10px]">
        <div className="flex h-full flex-col px-8 pb-10 pt-[150px] text-white">
          <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
            <h1 className="w-full max-w-[960px] pb-4 text-[38px] font-bold leading-[1.2]">
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </h1>

            <p className="w-full max-w-[697px] pb-8 text-[19px] leading-[1.5] text-white/70">
              {t.description}
            </p>

            <Button className="rounded-3xl bg-[#FF7857] px-6 py-5 text-xl text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-[#ff6b46]">
              {t.cta}
            </Button>
          </div>

          <div className="mt-auto flex w-full items-end justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-left text-[14px] leading-[1.2]">
                {specialistLines[0]}
                <br />
                {specialistLines[1]}
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
    </section>
  )
}
