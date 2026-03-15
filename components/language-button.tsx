"use client"

import { useState } from "react"

export default function LanguageButton() {
    const [lang, setLang] = useState<"kz" | "ru">("kz")
    return (
        <button 
            className="flex items-center gap-2 rounded-full border border-gray-300 pr-3"
            type="button"
            onClick={() => setLang(lang === "kz" ? "ru" : "kz")}
        >
            <img
                key={lang}
                src={lang === "kz" ? "/kz-flag.png" : "/ru-flag.png"}
                alt={lang === "kz" ? "KZ" : "RU"}
                className="h-8 w-8 rounded-full object-cover"
            />
            <span className="font-medium">{lang}</span>
        </button>
    )
}
