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
    <div className="flex flex-col items-center gap-10 text-center md:flex-row md:items-start md:justify-between md:text-left">
      <span className="flex w-full items-center justify-center rounded-full px-4 py-3 leading-none text-black md:w-auto md:justify-start">
        {t.badge}
      </span>
      <p className="max-w-[492px] leading-[1.45] text-black md:px-14 md:leading-[1.3]">
        {t.text}
      </p>
    </div>
  )
}
