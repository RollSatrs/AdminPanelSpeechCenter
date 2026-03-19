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
    <section id="address" className="scroll-mt-28 rounded-[44px] bg-white px-6 py-6 md:px-8 md:py-8">
      <span id="register" className="block h-0 w-0 overflow-hidden scroll-mt-28" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[36px]">
        <iframe
          title="Карта SOZLab.kids"
          src="https://www.google.com/maps?q=50.412583,80.259739&z=16&output=embed"
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,14,14,0.58)_0%,rgba(14,14,14,0.18)_40%,rgba(14,14,14,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22)_0%,transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,120,87,0.18)_0%,transparent_34%)]" />

        <div className="relative flex min-h-[360px] flex-col items-center justify-center px-8 py-12 text-center text-white md:min-h-[420px] md:px-12">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[14px] font-medium backdrop-blur-sm">
            {t.badge}
          </span>

          <h2 className="mt-6 max-w-[760px] text-[34px] font-bold leading-[1.12] md:text-[48px]">
            {titleLines[0]}
            <br />
            {titleLines[1]}
          </h2>

          <p className="mt-5 max-w-[700px] text-[17px] leading-[1.6] text-white/82 md:text-[19px]">
            {t.description}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 md:flex-row">
            <a
              href="https://www.google.com/maps?q=50.412583,80.259739"
              target="_blank"
              rel="noreferrer"
            >
              <Button className="h-12 rounded-full bg-white px-6 text-[15px] font-semibold text-black hover:bg-white/92">
                {t.route}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-3 text-[15px] text-white/90 backdrop-blur-sm">
              <Phone className="h-4 w-4" />
              +7 (747) 438-18-92
            </div>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/10 px-4 py-2.5 text-[15px] text-white/88 backdrop-blur-md">
            <MapPin className="h-4 w-4" />
            {t.address}
          </div>
        </div>
      </div>
    </section>
  )
}
