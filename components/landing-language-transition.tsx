"use client"

import { ReactNode, useEffect, useRef } from "react"

import { useLanguage } from "./language-provider"

export default function LandingLanguageTransition({
  children,
}: {
  children: ReactNode
}) {
  const { lang } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    element.classList.remove("animate-language-switch")
    void element.offsetWidth
    element.classList.add("animate-language-switch")
  }, [lang])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}
