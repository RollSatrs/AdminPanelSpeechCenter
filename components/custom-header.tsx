"use client"

import { useState } from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import LanguageButton from "./language-button"
import { useLanguage } from "./language-provider"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"

const headerCopy = {
  ru: {
    about: "О центре",
    home: "Главная",
    problems: "Проблемы",
    help: "Как помогаем",
    working: "Занятия",
    team: "Команда",
    reviews: "Отзывы",
    programs: "Программы",
    format: "Формат обучения",
    faq: "FAQ",
    contacts: "Контакты",
    address: "Адрес",
  },
  kz: {
    about: "Орталық туралы",
    home: "Басты бет",
    problems: "Мәселелер",
    help: "Қалай көмектесеміз",
    working: "Сабақтар",
    team: "Команда",
    reviews: "Пікірлер",
    programs: "Бағдарламалар",
    format: "Оқу форматы",
    faq: "FAQ",
    contacts: "Байланыс",
    address: "Мекенжай",
  },
} as const

export function HeaderCustom() {
  const { lang } = useLanguage()
  const t = headerCopy[lang]
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileLinks = [
    { label: t.home, href: "/landing", sectionId: "" },
    { label: t.problems, href: "/landing#problems", sectionId: "problems" },
    { label: t.help, href: "/landing#help", sectionId: "help" },
    { label: t.working, href: "/landing#working", sectionId: "working" },
    { label: t.team, href: "/landing#team", sectionId: "team" },
    { label: t.reviews, href: "/landing#reviews", sectionId: "reviews" },
    { label: t.format, href: "/landing#prices", sectionId: "prices" },
    { label: t.faq, href: "/landing#FAQ", sectionId: "FAQ" },
    { label: t.contacts, href: "/landing#contacts", sectionId: "contacts" },
    { label: t.address, href: "/landing#address", sectionId: "address" },
  ]

  const handleMobileNavigation = (href: string, sectionId: string) => {
    setIsMobileMenuOpen(false)

    if (!sectionId) {
      window.location.href = href
      return
    }
    window.setTimeout(() => {
      const target = document.getElementById(sectionId)

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
        window.history.replaceState(null, "", href)
        return
      }

      window.location.href = href
    }, 50)
  }

  return (
    <div className="relative z-50 flex items-center justify-between gap-3">
      <a href="/landing" className="text-[22px] font-medium sm:text-[25px]">
        <span className="text-[#1AC1B9]">SOZLab</span>
        <span className="text-[#FF7857]">.kids</span>
      </a>

      <NavigationMenu viewport={false} className="hidden xl:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent text-black shadow-none hover:bg-transparent">
              {t.about}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[170px] gap-2 p-1">
                <li>
                  <NavigationMenuLink href="/landing">{t.home}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#problems">{t.problems}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#help">{t.help}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#working">{t.working}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#team">{t.team}</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/landing#reviews"
            >
              {t.reviews}
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>{t.programs}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[170px] gap-2 p-1">
                <li>
                  <NavigationMenuLink href="/landing#prices">{t.format}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#FAQ">{t.faq}</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>{t.contacts}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[170px] gap-2 p-1">
                <li>
                  <NavigationMenuLink href="/landing#contacts">{t.contacts}</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/landing#address">{t.address}</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LanguageButton />

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="flex h-10 w-10 rounded-full border-gray-300 bg-white xl:hidden max-[350px]:h-9 max-[350px]:w-9"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[88vw] max-w-[320px] border-r border-black/10 bg-white p-0 max-[350px]:w-[92vw]"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <SheetHeader className="border-b border-black/8 px-5 py-4">
              <SheetTitle className="text-left text-[22px] font-medium">
                <span className="text-[#1AC1B9]">SOZLab</span>
                <span className="text-[#FF7857]">.kids</span>
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col px-3 py-4">
              {mobileLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleMobileNavigation(link.href, link.sectionId)}
                  className="rounded-2xl px-4 py-3 text-left text-[16px] font-medium text-black transition-colors hover:bg-[#F5F5F5]"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
