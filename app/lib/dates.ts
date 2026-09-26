export function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
}

// Fecha local del usuario en formato ISO (YYYY-MM-DD), p. ej. para los check-ins diarios.
export function localIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Suma días a una fecha ISO (YYYY-MM-DD) sin problemas de zona horaria.
export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return localIsoDate(new Date(year!, month! - 1, day! + days))
}
