import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { fetchFeedback, setFeedbackStatus } from './api/feedback'
import type { FeedbackEntry, FeedbackStatus } from './data/feedback'
import { setEntryStatus } from './data/feedback'

// Bandeja de feedback del super admin.
export const useFeedbackStore = defineStore('feedback', () => {
  const auth = useAuthStore()
  const entries = ref<FeedbackEntry[] | null>(null)

  async function load() {
    entries.value = await fetchFeedback()
  }

  // Una escritura por cambio de estado (acción deliberada sobre un mensaje)
  async function setStatus(id: string, status: FeedbackStatus) {
    await setFeedbackStatus(id, status)
    if (entries.value) entries.value = setEntryStatus(entries.value, id, status)
  }

  watch(() => auth.userId, () => {
    entries.value = null
  })

  return { entries, load, setStatus }
})
