import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { fetchResults, submitDiagnostic } from './api/diagnostic'
import type { DiagnosticAnswers, DiagnosticQuestion, DiagnosticResult } from './data/diagnostic'

export const useDiagnosticStore = defineStore('diagnostic', () => {
  const auth = useAuthStore()

  const results = ref<DiagnosticResult[] | null>(null)
  const latestResult = computed(() => results.value?.[0] ?? null)

  async function submit(questions: DiagnosticQuestion[], answers: DiagnosticAnswers) {
    await submitDiagnostic(questions, answers)
    results.value = null
  }

  async function loadResults(force = false) {
    if (!auth.userId) return
    if (results.value && !force) return
    results.value = await fetchResults(auth.userId)
  }

  // Al cambiar de usuario no se deben ver datos del anterior
  watch(() => auth.userId, () => {
    results.value = null
  })

  return { results, latestResult, submit, loadResults }
})
