"use client"

import { StarsRating } from "@/components/stars-rating"
import { Reviews } from "@/app/types/reviews.types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useLanguage } from "@/components/language-provider"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const COLLAPSED_REVIEW_HEIGHT = 72
const EXPANDED_REVIEW_HEIGHT = 220
const REVIEW_TOGGLE_THRESHOLD = 140

export default function BlockEight() {
  const { lang } = useLanguage()
  const t = {
    ru: {
      title: "Отзывы",
      hide: "Скрыть",
      readMore: "Читать дальше",
    },
    kz: {
      title: "Пікірлер",
      hide: "Жасыру",
      readMore: "Толығырақ",
    },
  }[lang]
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const toggleReview = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const reviewsByLang: Record<"ru" | "kz", Reviews[]> = {
    ru: [
    {
      id: "1",
      momFullName: "Айгуль Тауирбекова",
      momName: "Мама Мираса, 5 лет",
      rating: 5,
      reviews:
        "Шаг за шагом помогли стать увереннее и открыть новые способности. Ребёнок научился держать равновесие, произносить звуки, держать ручку, читать по слогам и знает стихотворения. Огромное спасибо за труд и заботу в «Зерде».",
    },
    {
      id: "2",
      momFullName: "Улжан Асанкызы",
      momName: "Мама Амира, 4 года",
      rating: 5,
      reviews:
        "Ребёнок раньше не мог назвать даже своё имя, а теперь виден большой прогресс. Спасибо Меруерт Елеусисовне, Айгерим Адильжановне и Акнур Тумарбеккызы. Көп рахмет!",
    },
    {
      id: "3",
      momFullName: "Мадина Кожахметова",
      momName: "Мама Али, 3 года",
      rating: 5,
      reviews:
        "Результаты удивили: ребёнок проявляет эмоции, понимает обращение, откликается на имя, освоил базовые навыки самообслуживания, начал говорить слова и различать цвета. Очень высокий уровень подхода, домашние задания дают каждый день. Рекомендую.",
    },
    {
      id: "4",
      momFullName: "Маржан Асаубаева",
      momName: "Мама Жанали, 4 года",
      rating: 5,
      reviews:
        "Айгерим Адильжановне огромное спасибо. За 2 месяца увидели большой прогресс: из молчаливого и испуганного ребёнок стал открытым, начал говорить в группе, с радостью идёт в центр и садик. Настоящий профессионал.",
    },
    {
      id: "5",
      momFullName: "Мама Азиза",
      momName: "Азиз, 2,5 года",
      rating: 5,
      reviews:
        "Спасибо дефектологу Батиме Ботаевне. После занятий появился хороший результат: ребёнок начал выполнять команды, появился указательный жест, стало заметно больше понимания и отклика.",
    },
    {
      id: "6",
      momFullName: "Мама Даниала",
      momName: "Даниал, 4,5 года",
      rating: 5,
      reviews:
        "Уже за 1 месяц был огромный прогресс: ребёнок начал повторять слова, вести диалог, отвечать на вопросы, словарный запас растёт. Даже в лифте знакомится, называет себя и спрашивает имена.",
    },
  ],
    kz: [
      {
        id: "1",
        momFullName: "Айгуль Тауирбекова",
        momName: "Мирастың анасы, 5 жас",
        rating: 5,
        reviews:
          "Біртіндеп баланың өзіне сенімі артып, жаңа қабілеттері ашылды. Тепе-теңдікті сақтауды, дыбыстарды айтуды, қалам ұстауды, буындап оқуды үйренді. Еңбектеріңізге үлкен рақмет.",
      },
      {
        id: "2",
        momFullName: "Улжан Асанкызы",
        momName: "Амирдің анасы, 4 жас",
        rating: 5,
        reviews:
          "Бұрын бала өз атын да айта алмайтын, ал қазір үлкен ілгерілеу байқалады. Меруерт Елеусисовнаға, Айгерим Адильжановнаға және Акнур Тумарбеккызына көп рақмет.",
      },
      {
        id: "3",
        momFullName: "Мадина Кожахметова",
        momName: "Әлидің анасы, 3 жас",
        rating: 5,
        reviews:
          "Нәтиже бізді таңғалдырды: бала эмоция білдіре бастады, атын естіп жауап береді, түсінуі жақсарды, өзіне-өзі қызмет ету дағдылары пайда болды. Үй тапсырмасы жүйелі беріледі, тәсіл өте жоғары деңгейде.",
      },
      {
        id: "4",
        momFullName: "Маржан Асаубаева",
        momName: "Жанәлидің анасы, 4 жас",
        rating: 5,
        reviews:
          "Айгерим Адильжановнаға үлкен рақмет. 2 айда-ақ өте үлкен өзгеріс көрдік: бұрын үндемейтін және тұйық бала ашыла бастады, топта сөйлейді, орталыққа да, балабақшаға да қуана барады.",
      },
      {
        id: "5",
        momFullName: "Азиздің анасы",
        momName: "Азиз, 2,5 жас",
        rating: 5,
        reviews:
          "Батима Ботаевнаға рақмет. Сабақтардан кейін жақсы нәтиже көрдік: бала нұсқауларды орындай бастады, сұқ саусағымен көрсету пайда болды, түсінуі мен жауап беруі едәуір жақсарды.",
      },
      {
        id: "6",
        momFullName: "Даниалдың анасы",
        momName: "Даниал, 4,5 жас",
        rating: 5,
        reviews:
          "Бір айдың өзінде үлкен прогресс болды: бала сөздерді қайталай бастады, диалогқа түседі, сұрақтарға жауап береді, сөздік қоры өсіп келеді. Тіпті лифтіде танысып, өзін атап, есім сұрайды.",
      },
    ],
  }
  const reviews = reviewsByLang[lang]

  return (
    <section id="reviews" className="scroll-mt-28 flex w-full flex-col items-center gap-12">
      <h2 className="text-[36px] font-bold">{t.title}</h2>
      <Carousel
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
        className="w-full max-w-[1380px] px-12 py-4"
      >
        <CarouselContent className="items-start">
          {reviews.map((review) => {
            const isExpanded = expandedIds.includes(review.id)
            const isOverflowing = review.reviews.length > REVIEW_TOGGLE_THRESHOLD

            return (
              <CarouselItem
                key={review.id}
                className="basis-full py-3 md:basis-1/2 xl:basis-1/3"
              >
                <div className="flex h-full min-h-[253px] flex-col gap-[5px] rounded-[40px] border border-[#D9D0CB] bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#D0C5BF]">
                  <span className="text-[18px] font-bold">{review.momFullName}</span>
                  <span className="text-[14px]">{review.momName}</span>
                  <StarsRating
                    rating={review.rating}
                    starClassName="h-3.5 w-3.5"
                    className="mb-[10px]"
                  />

                  <div
                    className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      maxHeight: isExpanded
                        ? `${EXPANDED_REVIEW_HEIGHT}px`
                        : `${COLLAPSED_REVIEW_HEIGHT}px`,
                    }}
                  >
                    <p
                      className="transition-opacity duration-300 ease-out"
                      style={{
                        opacity: isExpanded ? 1 : 0.9,
                      }}
                    >
                      {review.reviews}
                    </p>
                  </div>

                  {isOverflowing ? (
                    <button
                      type="button"
                      onClick={() => toggleReview(review.id)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#FF7857] transition-all duration-300 ease-out hover:text-[#ff6f4c]"
                    >
                      <span>{isExpanded ? t.hide : t.readMore}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : null}
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0 border-[#D4D4D4] bg-white text-black hover:bg-white" />
        <CarouselNext className="right-0 border-[#D4D4D4] bg-white text-black hover:bg-white" />
      </Carousel>
    </section>
  )
}
