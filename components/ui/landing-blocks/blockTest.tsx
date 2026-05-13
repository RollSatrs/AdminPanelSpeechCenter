"use client"

import { useLanguage } from "@/components/language-provider"
import { Button } from "../button"
import { ArrowRight, ClipboardList, MessageCircleMore, UserRoundPlus } from "lucide-react"

const blockTestCopy = {
  ru: {
    badge: "Для сомневающихся",
    title: "Не уверены, есть ли у ребёнка речевые трудности?",
    description:
      "Пройдите предварительный путь через бота. Сначала родитель регистрируется, затем получает короткий тест и первый ориентир, нужен ли следующий шаг.",
    note:
      "Тест не заменяет диагностику. Он нужен, чтобы родителю было проще понять, стоит ли идти дальше к специалисту.",
    ctaDirect: "Перейти к тесту",
    ctaFallback: "Пройти тест",
    helperDirect:
      "Откроется готовое сообщение. Отправьте его в WhatsApp как есть, не меняя текст, и бот сразу переведёт вас к тесту.",
    helperFallback:
      "Откроется готовое сообщение. Отправьте его в WhatsApp как есть, не меняя текст, и бот сразу переведёт вас к тесту.",
    steps: [
      {
        title: "Регистрация в боте",
        text: "Сначала родитель оставляет базовые данные, чтобы бот открыл нужный сценарий.",
      },
      {
        title: "Короткий тест",
        text: "После регистрации запускается предварительный тест с понятными вопросами.",
      },
      {
        title: "Первый ориентир",
        text: "По результату вы понимаете, нужен ли следующий шаг и стоит ли идти на диагностику.",
      },
    ],
  },
  kz: {
    badge: "Күмәнданатын ата-аналарға",
    title: "Балаңызда сөйлеу қиындығы бар-жоғын білмей жүрсіз бе?",
    description:
      "Алдымен бот арқылы алдын ала жолдан өтесіз. Әуелі ата-ана тіркеледі, содан кейін қысқа тест алып, келесі қадам қажет пе, соны түсінеді.",
    note:
      "Бұл тест толық диагностика емес. Ол ата-анаға маманға жүгіну керек пе, соны алдын ала түсінуге көмектеседі.",
    ctaDirect: "Тестке өту",
    ctaFallback: "Боттағы тестті сұрау",
    helperDirect:
      "Дайын хабарлама ашылады. Мәтінді өзгертпей сол күйі WhatsApp-қа жіберіңіз, сонда бот сізді бірден тестке өткізеді.",
    helperFallback:
      "Дайын хабарлама ашылады. Мәтінді өзгертпей сол күйі WhatsApp-қа жіберіңіз, сонда бот сізді бірден тестке өткізеді.",
    steps: [
      {
        title: "Ботта тіркелу",
        text: "Алдымен ата-ана негізгі деректерді енгізіп, боттағы қажетті сценарийді ашады.",
      },
      {
        title: "Қысқа тест",
        text: "Тіркеуден кейін алдын ала тест басталып, түсінікті сұрақтар қойылады.",
      },
      {
        title: "Алғашқы бағдар",
        text: "Нәтиже бойынша келесі қадам қажет пе, диагностика керек пе, соны түсінесіз.",
      },
    ],
  },
} as const

const stepIcons = [UserRoundPlus, ClipboardList, MessageCircleMore]
const TEST_START_MESSAGES = {
  ru: "Здравствуйте! Хочу сразу пройти тест для ребенка.",
  kz: "Сәлеметсіз бе! Балаға арналған тесттен бірден өткім келеді.",
} as const

function buildWhatsAppHref(baseHref: string, message: string) {
  try {
    const url = new URL(baseHref)
    const isWhatsAppLink =
      url.hostname.includes("wa.me") || url.hostname.includes("whatsapp.com")

    if (!isWhatsAppLink) {
      return baseHref
    }

    if (url.hostname.includes("wa.me")) {
      const phone = url.pathname.replaceAll("/", "").trim()
      return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    }

    url.searchParams.set("text", message)
    return url.toString()
  } catch {
    return baseHref
  }
}

export default function BlockTest() {
  const { lang } = useLanguage()
  const t = blockTestCopy[lang]
  const directBotHref = process.env.NEXT_PUBLIC_TEST_BOT_URL?.trim()
  const whatsappMessage = TEST_START_MESSAGES[lang]
  const fallbackHref = `https://wa.me/+77474381892?text=${encodeURIComponent(whatsappMessage)}`
  const targetHref = directBotHref
    ? buildWhatsAppHref(directBotHref, whatsappMessage)
    : fallbackHref

  return (
    <section
      id="test"
      className="scroll-mt-28 rounded-[32px] border border-[#E8DFD9] bg-white px-5 py-8 text-black md:px-8 md:py-10 lg:rounded-[48px] lg:px-12"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="max-w-[620px]">
          <h2 className="mt-4 max-w-[560px] text-[28px] font-bold leading-[1.1] md:text-[40px]">
            {t.title}
          </h2>

          <p className="mt-4 max-w-[560px] text-[16px] leading-[1.55] text-black/78 md:text-[18px]">
            {t.description}
          </p>

          <div className="mt-6 rounded-[24px] border border-[#E8DFD9] bg-[#FAF7F4] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.04)] md:p-5">
            <p className="text-[15px] leading-[1.55] text-black/80 md:text-[16px]">{t.note}</p>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3">
            <a href={targetHref} target="_blank" rel="noreferrer">
              <Button className="min-h-12 rounded-full bg-[#FF7857] px-6 text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#ff6b46] md:px-7 md:text-[16px]">
                {directBotHref ? t.ctaDirect : t.ctaFallback}
                <ArrowRight className="size-4" />
              </Button>
            </a>
            <p className="max-w-[460px] text-[13px] leading-[1.45] text-black/65 md:text-[14px]">
              {directBotHref ? t.helperDirect : t.helperFallback}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          {t.steps.map((step, index) => {
            const Icon = stepIcons[index]

            return (
              <div
                key={step.title}
                className="rounded-[28px] border border-[#E8DFD9] bg-[#FAF7F4] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#FF7857] text-white">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[12px] font-semibold tracking-[0.18em] text-black/45">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-4 text-[18px] font-semibold leading-[1.2] text-black">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-black/72 md:text-[15px]">
                  {step.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
