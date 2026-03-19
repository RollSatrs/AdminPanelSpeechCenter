"use client"

import { useLanguage } from "@/components/language-provider"

const blockThreeCopy = {
  ru: {
    title: "Если вы замечаете это…",
    description:
      "Речь ребёнка развивается постепенно, но есть ориентиры, помогающие понять, всё ли идёт гармонично. Если малыш мало говорит или его трудно понять, это может быть сигналом, что ему нужна поддержка. Раннее внимание помогает скорректировать развитие.",
    items: [
      "Использует 1–2 слова, не строит фразы, чаще показывает жестами.",
      "«Р» не выговаривает, путает «ш» и «с», речь неразборчива.",
      "Другие дети уже говорят предложениями, а вашему малышу трудно.",
    ],
  },
  kz: {
    title: "Егер сіз мынаны байқасаңыз…",
    description:
      "Баланың сөйлеуі біртіндеп дамиды, бірақ бәрі үйлесімді жүріп жатқанын түсінуге көмектесетін белгілер бар. Егер бала аз сөйлесе немесе оны түсіну қиын болса, бұл оған қолдау қажет екенін білдіруі мүмкін. Ерте назар аудару дамуды дер кезінде түзетуге көмектеседі.",
    items: [
      "1–2 сөз ғана айтады, сөйлем құрастырмайды, көбіне ыммен көрсетеді.",
      "«Р» дыбысын айта алмайды, «ш» пен «с»-ты шатастырады, сөзі анық емес.",
      "Басқа балалар сөйлеммен сөйлеп жүр, ал сіздің балаңызға бұл әлі қиын.",
    ],
  },
} as const

export default function BlockThree() {
  const { lang } = useLanguage()
  const t = blockThreeCopy[lang]

  return (
    <section
      id="problems"
      className="scroll-mt-28 flex flex-col items-center gap-8 rounded-[40px] border-2 border-[#E2E2E2] px-6 py-8 text-center xl:flex-row xl:items-start xl:justify-between xl:gap-0 xl:rounded-[71px] xl:px-11 xl:py-5 xl:text-left"
    >
      <div className="flex max-w-[464px] flex-col items-center gap-y-4 xl:items-start">
        <h3 className="text-[34px] leading-[1.1] xl:text-[48px]">{t.title}</h3>
        <p className="text-[16px] leading-[1.5] xl:text-[18px]">{t.description}</p>
      </div>
      <div className="h-[4px] w-full max-w-[240px] rounded-full bg-[#FF7857] xl:h-83 xl:w-[4px] xl:max-w-none" />
      <div className="flex max-w-[468px] flex-col items-center gap-y-6 xl:items-start xl:gap-y-4">
        {t.items.map((item, index) => (
          <div key={index} className="flex flex-col items-center xl:items-start">
            <span className="text-[32px] xl:text-[32px]">{`0${index + 1}`}</span>
            <p className="text-[16px] leading-[1.5] xl:text-base">{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
