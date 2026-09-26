// Duración de los videos: se escribe como "min:seg" (p. ej. "14:54") o solo minutos ("14"),
// y se guarda en segundos.
const DURATION_PATTERN = /^(\d{1,3})(?::([0-5]\d))?$/
export const MAX_DURATION_SECONDS = 600 * 60

// Segundos, o null si el texto no tiene el formato esperado o se sale del rango (1 s – 600 min).
export function parseDuration(text: string): number | null {
  const match = DURATION_PATTERN.exec(text.trim())
  if (!match) return null
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0)
  return seconds >= 1 && seconds <= MAX_DURATION_SECONDS ? seconds : null
}

// "14:54", "0:45" o "1:02:30" (con horas).
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`
}

// Minutos redondeados (al menos 1) para totales, p. ej. "45 min".
export function roundedMinutes(totalSeconds: number): number {
  return Math.max(1, Math.round(totalSeconds / 60))
}
