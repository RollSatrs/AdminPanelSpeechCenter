export function phoneDigits(input: string): string {
  return String(input ?? "").replace(/\D/g, "")
}

export function normalizePhone(input: string): string {
  const digits = phoneDigits(input)
  if (digits.length === 11 && digits.startsWith("7")) {
    return `8${digits.slice(1)}`
  }
  return digits
}

export function buildPhoneCandidates(input: string): string[] {
  const digits = phoneDigits(input)
  if (!digits) return []

  const candidates = new Set<string>()

  if (digits.length === 11 && digits.startsWith("8")) {
    candidates.add(digits)
    candidates.add(`7${digits.slice(1)}`)
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    candidates.add(`8${digits.slice(1)}`)
    candidates.add(digits)
  }

  candidates.add(digits)
  return Array.from(candidates)
}

export function isSupportedPhone(input: string): boolean {
  return /^8\d{10}$/.test(phoneDigits(input))
}
