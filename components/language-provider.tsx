"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type SiteLanguage = "ru" | "kz"

type LanguageContextValue = {
  lang: SiteLanguage
  setLang: (lang: SiteLanguage) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<SiteLanguage>("ru")

  useEffect(() => {
    const savedLang = window.localStorage.getItem("site-language")

    if (savedLang === "ru" || savedLang === "kz") {
      setLang(savedLang)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("site-language", lang)
    document.documentElement.lang = lang === "kz" ? "kk" : "ru"
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === "ru" ? "kz" : "ru")),
    }),
    [lang]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}
