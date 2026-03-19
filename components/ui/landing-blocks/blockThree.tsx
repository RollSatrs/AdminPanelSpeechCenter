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
      className="scroll-mt-28 flex justify-between rounded-[71px] border-2 border-[#E2E2E2] px-11 py-5"
    >
      <div className="flex max-w-[464px] flex-col gap-y-4">
        <h3 className="text-[48px]">{t.title}</h3>
        <p className="text-[18px]">{t.description}</p>
      </div>
      <div className="h-83 w-[4px] rounded-full bg-[#FF7857]" />
      <div className="flex max-w-[468px] flex-col gap-y-4">
        {t.items.map((item, index) => (
          <div key={index}>
            <span className="text-[32px]">{`0${index + 1}`}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
