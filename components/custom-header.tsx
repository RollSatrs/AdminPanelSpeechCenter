"use client"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu"
import LanguageButton from "./language-button"
import { useLanguage } from "./language-provider"

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
    prices: "Цены",
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
    prices: "Бағалар",
    faq: "FAQ",
    contacts: "Байланыс",
    address: "Мекенжай",
  },
} as const

export function HeaderCustom() {
  const { lang } = useLanguage()
  const t = headerCopy[lang]

  return (
    <div className="relative z-50 flex items-center justify-between">
      <a href="/landing" className="text-[25px] font-medium">
        <span className="text-[#1AC1B9]">SOZLab</span>
        <span className="text-[#FF7857]">.kids</span>
      </a>

      <NavigationMenu viewport={false}>
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
                  <NavigationMenuLink href="/landing#prices">{t.prices}</NavigationMenuLink>
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

      <LanguageButton />
    </div>
  )
}
