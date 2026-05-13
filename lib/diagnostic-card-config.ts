export type DiagnosticCardLanguage = "ru" | "kz" | "both"

export const kazakhSoundGroups = [
  "Ысқырық дыбыстар",
  "Мұрын жолды дыбыстар",
  "Ызың дыбыстар",
  "Сонор дыбыстар",
  "Тіл асты айтылатын дыбыстар",
] as const

export const russianSoundGroups = [
  "Свистящие звуки",
  "Шипящие звуки",
  "Сонорные звуки",
  "Носовые звуки",
  "Заднеязычные звуки",
] as const

const kazakhLetterPattern = /[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/u
const kazakhSpecificSounds = new Set(["Ә", "І", "Ң", "Ғ", "Ү", "Ұ", "Қ", "Ө", "Һ"])
const kazakhSoundGroupSet = new Set<string>(kazakhSoundGroups)
const russianSoundGroupSet = new Set<string>(russianSoundGroups)

export function resolveSoundGroupOptions(language: DiagnosticCardLanguage): readonly string[] {
  return resolvePreferredLanguage(language) === "kz" ? kazakhSoundGroups : russianSoundGroups
}

export function resolvePreferredLanguage(language: DiagnosticCardLanguage): "ru" | "kz" {
  return language === "kz" ? "kz" : "ru"
}

export function inferDiagnosticCardLanguage(input: {
  word?: string | null
  targetSound?: string | null
  soundGroup?: string | null
}): "ru" | "kz" {
  const word = String(input.word ?? "").trim()
  const targetSound = String(input.targetSound ?? "").trim().toUpperCase()
  const soundGroup = String(input.soundGroup ?? "").trim()

  if (kazakhSoundGroupSet.has(soundGroup)) {
    return "kz"
  }

  if (russianSoundGroupSet.has(soundGroup)) {
    return "ru"
  }

  if (kazakhLetterPattern.test(word) || kazakhSpecificSounds.has(targetSound)) {
    return "kz"
  }

  return "ru"
}
