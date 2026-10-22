import { formatCop, LAUNCH, pricePerSession, spotsSummary } from '../data/launch'

// Valores de la generación ya listos para mostrar en el idioma activo.
export function useLaunch() {
  const { locale } = useI18n()

  const spots = spotsSummary(LAUNCH.spotsTotal, LAUNCH.spotsTaken)
  const price = computed(() => formatCop(LAUNCH.priceCop, locale.value))
  const sessionPrice = computed(() => formatCop(pricePerSession(LAUNCH.priceCop, LAUNCH.sessions), locale.value))

  return { spots, price, sessionPrice, sessions: LAUNCH.sessions }
}
