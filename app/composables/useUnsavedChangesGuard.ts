// Avisa antes de perder un borrador sin guardar: al cambiar de página (confirmación) y al
// cerrar o recargar la pestaña (aviso del navegador). Si el usuario sale, se descarta.
export function useUnsavedChangesGuard(options: {
  hasChanges: () => boolean
  discard: () => void
  // Clave de i18n de la confirmación al cambiar de página
  confirmKey?: string
}) {
  const { t } = useI18n()

  onBeforeRouteLeave(() => {
    if (!options.hasChanges()) return true
    if (!window.confirm(t(options.confirmKey ?? 'common.unsaved.confirmLeave'))) return false
    options.discard()
    return true
  })

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (options.hasChanges()) event.preventDefault()
  }

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
}
