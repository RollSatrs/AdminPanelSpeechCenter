"use client"

import { ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Наверх"
      className={`fixed right-6 bottom-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7857] text-white shadow-[0_12px_30px_rgba(255,120,87,0.28)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#ff6f4c] ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
