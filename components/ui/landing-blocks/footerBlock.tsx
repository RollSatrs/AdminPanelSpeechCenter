"use client"

import { Instagram } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-8.67 14.98L2 22l5.17-1.29A10 10 0 1 0 12 2Zm0 18.18a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-3.07.77.82-3-.2-.31A8.18 8.18 0 1 1 12 20.18Zm4.49-6.12c-.25-.13-1.47-.72-1.7-.8-.23-.08-.4-.13-.57.13-.17.25-.65.8-.8.96-.15.17-.3.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.75-.15-.25-.02-.38.11-.5.11-.11.25-.3.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.03 2.6.13.17 1.76 2.69 4.27 3.77.6.26 1.07.42 1.44.54.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.15-.48-.28Z" />
    </svg>
  )
}

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/sozlab.kids?igsh=M2lpczkwN2N1bDE5", icon: Instagram },
  { label: "WhatsApp", href: "https://api.whatsapp.com/send/?phone=%2B77764401070&text&type=phone_number&app_absent=0&utm_source=ig", icon: WhatsAppIcon },
] as const

export default function FooterBlock() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      description:
        "Пространство, где ребёнка слышат, поддерживают и помогают раскрыть речь уверенно и бережно.",
      navigation: "Навигация",
      home: "Главная",
      about: "О центре",
      programs: "Программы",
      reviews: "Отзывы",
      contacts: "Контакты",
      address: "Адрес",
      city: "Семей",
      street: "ул. К. Мухамедханова, 23 кабинет",
      rights: "© 2026 SOZLab.kids. Все права защищены.",
    },
    kz: {
      description:
        "Баланы тыңдап, қолдап, сөйлеуін сенімді әрі ұқыпты ашуға көмектесетін кеңістік.",
      navigation: "Навигация",
      home: "Басты бет",
      about: "Орталық туралы",
      programs: "Бағдарламалар",
      reviews: "Пікірлер",
      contacts: "Байланыс",
      address: "Мекенжай",
      city: "Семей",
      street: "Қ. Мұхамедханов көшесі, 23 кабинет",
      rights: "© 2026 SOZLab.kids. Барлық құқықтар қорғалған.",
    },
  }[lang]
  return (
    <footer id="contacts" className="scroll-mt-28 rounded-[28px] bg-white px-4 py-8 md:rounded-[40px] md:px-12 md:py-12">
      <div className="grid justify-items-center gap-10 text-center md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr] md:justify-items-start md:text-left">
        <div className="max-w-[320px]">
          <a href="/landing" className="inline-flex items-center gap-3">
            <span className="text-[28px] font-semibold leading-none text-black md:text-[34px]">
              <span className="text-[#1AC1B9]">SOZLAB</span>
              <span className="text-[#FF7857]">.kids</span>
            </span>
          </a>

          <p className="mt-4 text-[15px] leading-[1.45] text-black/80 md:mt-5 md:text-[18px]">
            {t.description}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-semibold text-black/45 md:text-[18px]">{t.navigation}</h3>
          <div className="flex flex-col gap-3 text-[16px] text-black/85 md:text-[18px]">
            <a href="/landing" className="transition-colors hover:text-[#FF7857]">{t.home}</a>
            <a href="/landing#help" className="transition-colors hover:text-[#FF7857]">{t.about}</a>
            <a href="/landing#prices" className="transition-colors hover:text-[#FF7857]">{t.programs}</a>
            <a href="/landing#reviews" className="transition-colors hover:text-[#FF7857]">{t.reviews}</a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-semibold text-black/45 md:text-[18px]">{t.contacts}</h3>
          <div className="flex flex-col gap-3 text-[16px] leading-[1.5] text-black/85 md:text-[18px]">
            <a href="tel:+77474381892" className="transition-colors hover:text-[#FF7857]">
              +7 (747) 438-18-92
            </a>
            <a
              href="mailto:hello@sozlabkids.kz"
              className="transition-colors hover:text-[#FF7857]"
            >
              hello@sozlabkids.kz
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-semibold text-black/45 md:text-[18px]">{t.address}</h3>
          <p className="max-w-[250px] text-[16px] leading-[1.5] text-black/85 md:text-[18px]">
            {t.city}
            <br />
            {t.street}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-5 border-t border-black/8 pt-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-[16px] text-black/55">{t.rights}</p>
          <p className="text-[14px] text-black/35">Made by Abai IT Valley</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          {socialLinks.map((link) => {
            const Icon = link.icon

            return (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="text-black/65 transition-colors hover:text-[#FF7857]"
              >
                <Icon className="h-5 w-5" />
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
