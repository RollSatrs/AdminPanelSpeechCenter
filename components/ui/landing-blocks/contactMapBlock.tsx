"use client"

import { ArrowRight, MapPin, Phone } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "../button"

export default function ContactMapBlock() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      badge: "Где мы находимся",
      title: "Приезжайте в SOZLAB.kids\nМы находимся в удобной локации в Семее",
      description:
        "Перед первым визитом можно быстро построить маршрут, уточнить детали по телефону и подобрать комфортное время для знакомства с центром.",
      route: "Построить маршрут",
      address: "Семей, ул. К. Мухамедханова, 23 кабинет",
    },
    kz: {
      badge: "Біз қайдамыз",
      title: "SOZLAB.kids орталығына келіңіз\nБіз Семейдегі ыңғайлы жерде орналасқанбыз",
      description:
        "Алғашқы келер алдында маршрутты тез құрып, телефон арқылы нақтылап, танысуға ыңғайлы уақытты таңдауға болады.",
      route: "Маршрут құру",
      address: "Семей, Қ. Мұхамедханов көшесі, 23 кабинет",
    },
  }[lang]
  const titleLines = t.title.split("\n")

  return (
    <section id="address" className="scroll-mt-28 rounded-[28px] bg-white px-3 py-3 md:rounded-[44px] md:px-8 md:py-8">
      <span id="register" className="block h-0 w-0 overflow-hidden scroll-mt-28" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[24px] md:rounded-[36px]">
        <iframe
          title="Карта SOZLab.kids"
          src="https://www.google.com/maps?q=50.412583,80.259739&z=16&output=embed"
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,14,14,0.58)_0%,rgba(14,14,14,0.18)_40%,rgba(14,14,14,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22)_0%,transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,120,87,0.18)_0%,transparent_34%)]" />

        <div className="relative flex min-h-[340px] flex-col items-center justify-center px-4 py-10 text-center text-white md:min-h-[420px] md:px-12">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-medium backdrop-blur-sm md:px-4 md:text-[14px]">
            {t.badge}
          </span>

          <h2 className="mt-5 max-w-[760px] text-[24px] font-bold leading-[1.1] md:mt-6 md:text-[48px]">
            {titleLines[0]}
            <br />
            {titleLines[1]}
          </h2>

          <p className="mt-4 max-w-[700px] text-[14px] leading-[1.5] text-white/82 md:mt-5 md:text-[19px]">
            {t.description}
          </p>

          <div className="mt-7 flex w-full flex-col items-center gap-3 md:flex-row">
            <a
              href="https://www.google.com/maps?q=50.412583,80.259739"
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto"
            >
              <Button className="h-11 w-full rounded-full bg-white px-5 text-[14px] font-semibold text-black hover:bg-white/92 md:h-12 md:w-auto md:px-6 md:text-[15px]">
                {t.route}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>

            <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-3 text-[14px] text-white/90 backdrop-blur-sm md:w-auto md:text-[15px]">
              <Phone className="h-4 w-4" />
              +7 (747) 438-18-92
            </div>
          </div>

          <div className="mt-8 inline-flex max-w-full items-center gap-2 rounded-[22px] border border-white/16 bg-black/10 px-4 py-2.5 text-[13px] leading-[1.35] text-white/88 backdrop-blur-md md:mt-10 md:rounded-full md:text-[15px]">
            <MapPin className="h-4 w-4 shrink-0" />
            {t.address}
          </div>
        </div>
      </div>
    </section>
  )
}
