"use client"

import { useLanguage } from "@/components/language-provider"

const blockFourCopy = {
  ru: {
    title: "Как мы помогаем вашему малышу заговорить",
    steps: [
      {
        number: "01",
        color: "bg-cyan-400",
        title: "Речевая диагностика",
        text: "В игровой форме проверяем речь, понимание, внимание и моторику.",
      },
      {
        number: "02",
        color: "bg-orange-400",
        title: "Персональная программа",
        text: "Составляем план именно под вашего ребёнка: диагноз, характер, темп развития.",
      },
      {
        number: "03",
        color: "bg-cyan-400",
        title: "Игровые занятия + нейроподход",
        text: "Через игры, артикуляцию, дыхание и упражнения ребёнок начинает говорить легче.",
      },
      {
        number: "04",
        color: "bg-orange-400",
        title: "Вы — часть команды",
        text: "После каждого занятия вы получаете обратную связь и рекомендации для дома.",
      },
    ],
  },
  kz: {
    title: "Балаңыздың сөйлеуін қалай дамытамыз",
    steps: [
      {
        number: "01",
        color: "bg-cyan-400",
        title: "Сөйлеу диагностикасы",
        text: "Ойын форматында сөйлеуін, түсінуін, зейінін және моторикасын тексереміз.",
      },
      {
        number: "02",
        color: "bg-orange-400",
        title: "Жеке бағдарлама",
        text: "Бағдарламаны балаңыздың ерекшелігіне қарай құрамыз: диагнозы, мінезі, даму қарқыны.",
      },
      {
        number: "03",
        color: "bg-cyan-400",
        title: "Ойын сабақтары + нейроәдіс",
        text: "Ойын, артикуляция, тыныс және жаттығулар арқылы балаға жеңіл сөйлеуге көмектесеміз.",
      },
      {
        number: "04",
        color: "bg-orange-400",
        title: "Сіз де команданың бір бөлігісіз",
        text: "Әр сабақтан кейін сіз кері байланыс пен үйге арналған ұсыныстар аласыз.",
      },
    ],
  },
} as const

export default function BlockFour() {
  const { lang } = useLanguage()
  const t = blockFourCopy[lang]

  return (
    <section id="help" className="scroll-mt-28 rounded-[71px] px-8 py-12 md:px-12 lg:px-16">
      <h2 className="mx-auto mb-14 max-w-[760px] text-center text-[36px] font-bold leading-[1.2] text-black">
        {t.title}
      </h2>

      <div className="mb-[72px] grid gap-12 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
        {t.steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center text-center">
            <span className="mb-5 text-[36px] leading-none font-light text-black md:text-[54px]">
              {step.number}
            </span>

            <div className="mb-6 flex w-full items-center justify-center gap-4">
              <span className={`h-[18px] w-[18px] rounded-full ${step.color}`} />
            </div>

            <h3 className="mb-3 min-h-[56px] text-[22px] font-bold leading-[1.2] text-black">
              {step.title}
            </h3>

            <p className="max-w-[260px] text-[17px] leading-[1.45] text-black/75">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
