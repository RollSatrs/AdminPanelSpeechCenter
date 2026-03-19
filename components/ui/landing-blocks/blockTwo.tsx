"use client"

import { useLanguage } from "@/components/language-provider"

const blockTwoCopy = {
  ru: {
    badge: "О центре",
    text:
      "В нашем центре мы не просто ставим звуки - мы помогаем детям полюбить говорить. С 2021 года мы стали местом, где помогают и малышам, и детям постарше.",
  },
  kz: {
    badge: "Орталық туралы",
    text:
      "Біздің орталықта біз тек дыбыстарды қойып қана қоймаймыз - балаларға сөйлеуді жақсы көруге көмектесеміз. 2021 жылдан бері біз кішкентай балаларға да, ересектеу балаларға да көмек көрсететін орынға айналдық.",
  },
} as const

export default function BlockTwo() {
  const { lang } = useLanguage()
  const t = blockTwoCopy[lang]

  return (
    <div className="flex flex-col gap-10 md:items-start md:justify-between md:flex-row">
      <span className="rounded-full border border-black/20 px-4 py-3 leading-none text-black">
        {t.badge}
      </span>
      <p className="max-h-[128px] max-w-[492px] px-14 leading-[1.3] text-black">
        {t.text}
      </p>
    </div>
  )
}
