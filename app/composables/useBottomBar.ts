// Cuántas barras fijas inferiores (p. ej. UnsavedChangesBar) hay visibles. El botón flotante
// de feedback se oculta mientras haya alguna, para que no se tapen.
const openBars = ref(0)

export function useBottomBar() {
  return { hasBottomBar: computed(() => openBars.value > 0) }
}

// Lo llama cada barra fija al montarse
export function registerBottomBar() {
  onMounted(() => openBars.value++)
  onBeforeUnmount(() => openBars.value--)
}
