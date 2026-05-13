"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { isSupportedPhone } from "@/lib/phone"
import { Button } from "../button"
import { Input } from "../input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { Spinner } from "../spinner"
import { CheckCircle2, FileText, KeyRound, PhoneCall } from "lucide-react"

const blockDiagnosticsCopy = {
  ru: {
    badge: "Диагностика речи",
    title: "Что будет, если оставить заявку на диагностику",
    description:
      "Это отдельный этап для родителей, которым нужен подробный разбор. После заявки специалист свяжется с вами, объяснит формат, ответит на вопросы и подскажет следующие шаги.",
    steps: [
      {
        title: "Оставляете заявку",
        text: "Родитель указывает свои данные и информацию о ребёнке, чтобы специалист сразу видел полную заявку.",
      },
      {
        title: "С вами связывается логопед",
        text: "Логопед или специалист подробно объясняет, как проходит диагностика и что понадобится.",
      },
      {
        title: "После одобрения выдается доступ",
        text: "Когда специалист подтверждает следующий этап, он выдает логин и пароль для личного профиля.",
      },
    ],
    formTitle: "Оставить заявку на диагностику",
    formDescription:
      "После отправки заявки специалист свяжется с вами и расскажет, как дальше будет устроен доступ и диагностика.",
    fullNameLabel: "ФИО родителя",
    fullNamePlaceholder: "Например: Айгуль Тауирбекова",
    phoneLabel: "Телефон",
    phonePlaceholder: "87071234567",
    phoneHint: "Номер должен начинаться с 8. Например: 87071234567",
    childFullNameLabel: "ФИО ребёнка",
    childFullNamePlaceholder: "Например: Амир Тауирбеков",
    childBirthDateLabel: "Дата рождения ребёнка",
    childLanguageLabel: "Язык ребёнка",
    childLanguagePlaceholder: "Выберите язык",
    childLanguageOptions: [
      { value: "ru", label: "Русский" },
      { value: "kz", label: "Казахский" },
      { value: "both", label: "Два языка" },
    ],
    submit: "Оставить заявку",
    success: "Заявка отправлена. Специалист свяжется с вами в ближайшее время.",
    validationError: "Укажите данные родителя и ребёнка.",
    phoneValidationError: "Введите номер, который начинается с 8. Например: 87071234567.",
    error: "Не удалось отправить заявку. Попробуйте еще раз.",
  },
  kz: {
    badge: "Сөйлеу диагностикасы",
    title: "Диагностикаға өтінім қалдырсаңыз, не болады",
    description:
      "Бұл толық түсіндіру қажет ата-аналарға арналған бөлек кезең. Өтінімнен кейін маман сізбен байланысып, форматты түсіндіреді, сұрақтарға жауап береді және келесі қадамдарды айтады.",
    steps: [
      {
        title: "Өтінім қалдырасыз",
        text: "Ата-ана өз деректерін және бала туралы мәліметті енгізеді, сонда маман толық өтінімді бірден көреді.",
      },
      {
        title: "Логопед хабарласады",
        text: "Логопед немесе маман диагностика қалай өтетінін және не қажет болатынын толық түсіндіреді.",
      },
      {
        title: "Келесі кезеңге рұқсат беріледі",
        text: "Маман келесі қадамды бекіткеннен кейін жеке профильге кіруге логин мен құпиясөз береді.",
      },
    ],
    formTitle: "Диагностикаға өтінім қалдыру",
    formDescription:
      "Өтінім жіберілгеннен кейін маман сізбен байланысып, диагностика мен қолжетімділік қалай ашылатынын түсіндіреді.",
    fullNameLabel: "Ата-ананың толық аты-жөні",
    fullNamePlaceholder: "Мысалы: Айгүл Тауырбекова",
    phoneLabel: "Телефон",
    phonePlaceholder: "87071234567",
    phoneHint: "Нөмір 8-ден басталуы керек. Мысалы: 87071234567",
    childFullNameLabel: "Баланың толық аты-жөні",
    childFullNamePlaceholder: "Мысалы: Әмір Тауырбеков",
    childBirthDateLabel: "Баланың туған күні",
    childLanguageLabel: "Баланың тілі",
    childLanguagePlaceholder: "Тілді таңдаңыз",
    childLanguageOptions: [
      { value: "ru", label: "Орысша" },
      { value: "kz", label: "Қазақша" },
      { value: "both", label: "Екі тілде" },
    ],
    submit: "Өтінім жіберу",
    success: "Өтінім жіберілді. Жақын арада маман сізбен байланысады.",
    validationError: "Ата-ана мен бала туралы мәліметті енгізіңіз.",
    phoneValidationError: "8-ден басталатын нөмірді енгізіңіз. Мысалы: 87071234567.",
    error: "Өтінімді жіберу мүмкін болмады. Қайтадан көріңіз.",
  },
} as const

const stepIcons = [FileText, PhoneCall, KeyRound]

export default function BlockDiagnosticsLead() {
  const { lang } = useLanguage()
  const t = blockDiagnosticsCopy[lang]
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [childFullName, setChildFullName] = useState("")
  const [childBirthDate, setChildBirthDate] = useState("")
  const [childLanguage, setChildLanguage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (
      fullName.trim().length < 2 ||
      childFullName.trim().length < 2 ||
      !childBirthDate ||
      !childLanguage
    ) {
      setError(t.validationError)
      return
    }

    if (!isSupportedPhone(phone)) {
      setError(t.phoneValidationError)
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/diagnostic-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: fullName.trim(),
          phone: phone.trim(),
          childFullName: childFullName.trim(),
          childBirthDate,
          childLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit")
      }

      setFullName("")
      setPhone("")
      setChildFullName("")
      setChildBirthDate("")
      setChildLanguage("")
      setSuccess(t.success)
    } catch {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="diagnostics-request"
      className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start"
    >
      <div className="rounded-[32px] border border-[#F2D7CC] bg-[rgba(255,210,193,0.38)] px-5 py-8 text-black md:px-8 md:py-10 lg:rounded-[48px] lg:px-10">
        <span className="inline-flex rounded-full border border-[#F4B7A6]/60 bg-white/55 px-4 py-2 text-[13px] font-medium text-[#c88259] md:text-[14px]">
          {t.badge}
        </span>

        <h2 className="mt-4 max-w-[620px] text-[28px] font-bold leading-[1.1] text-[#241815] md:text-[40px]">
          {t.title}
        </h2>

        <p className="mt-4 max-w-[620px] text-[16px] leading-[1.6] text-black/68 md:text-[18px]">
          {t.description}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.steps.map((step, index) => {
            const Icon = stepIcons[index]

            return (
              <div
                key={step.title}
                className="rounded-[26px] border border-white/55 bg-white/42 p-5 backdrop-blur-[6px]"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-[#FF7857] text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold leading-[1.25] text-[#241815]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-black/64">{step.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[32px] border border-[#E6DDD8] bg-white p-5 shadow-[0_20px_50px_rgba(17,17,17,0.08)] md:p-6 lg:rounded-[40px]">
        <div className="flex items-start gap-3">
          <span className="mt-1 text-[#FF7857]">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <h3 className="text-[22px] font-semibold leading-[1.15] text-black">
              {t.formTitle}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-black/70">
              {t.formDescription}
            </p>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-black">{t.fullNameLabel}</span>
            <Input
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={t.fullNamePlaceholder}
              className="h-12 rounded-2xl border-[#DDD3CD] px-4 text-[15px] shadow-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-black">{t.phoneLabel}</span>
            <Input
              required
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t.phonePlaceholder}
              className="h-12 rounded-2xl border-[#DDD3CD] px-4 text-[15px] shadow-none"
            />
            <span className="text-[12px] leading-[1.4] text-black/55">{t.phoneHint}</span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-black">{t.childFullNameLabel}</span>
            <Input
              required
              value={childFullName}
              onChange={(event) => setChildFullName(event.target.value)}
              placeholder={t.childFullNamePlaceholder}
              className="h-12 rounded-2xl border-[#DDD3CD] px-4 text-[15px] shadow-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-black">{t.childBirthDateLabel}</span>
            <Input
              required
              type="date"
              value={childBirthDate}
              max={today}
              onChange={(event) => setChildBirthDate(event.target.value)}
              className="h-12 rounded-2xl border-[#DDD3CD] px-4 text-[15px] shadow-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-black">{t.childLanguageLabel}</span>
            <Select value={childLanguage} onValueChange={setChildLanguage}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-[#DDD3CD] px-4 text-[15px] shadow-none">
                <SelectValue placeholder={t.childLanguagePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {t.childLanguageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
              {success}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-12 rounded-full bg-[#FF7857] px-6 text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#ff6b46]"
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                {t.submit}
              </>
            ) : (
              t.submit
            )}
          </Button>
        </form>
      </div>
    </section>
  )
}
