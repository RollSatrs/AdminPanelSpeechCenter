"use client"

import Image from "next/image"

import { useLanguage } from "./language-provider"

export default function LanguageButton() {
  const { lang, toggleLang } = useLanguage()

  return (
    <button
      className="flex items-center gap-2 rounded-full border border-gray-300 pr-3"
      type="button"
      onClick={toggleLang}
    >
      <Image
        key={lang}
        src={lang === "kz" ? "/kz-flag.png" : "/ru-flag.png"}
        alt={lang === "kz" ? "KZ" : "RU"}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
      <span className="font-medium uppercase">{lang}</span>
    </button>
  )
}
