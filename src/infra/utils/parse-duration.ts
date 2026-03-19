const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

export function parseDurationMs(duration: string, fallbackMs: number): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) return fallbackMs
  const [, value, unit] = match
  return Number(value) * (UNIT_MS[unit] ?? fallbackMs)
}
