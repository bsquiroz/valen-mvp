import { defineStore } from 'pinia'
import { useCurrentUserClaims } from './api/auth'

export const useAuthStore = defineStore('auth', () => {
  const claims = useCurrentUserClaims()

  const userId = computed(() => claims.value?.sub ?? null)
  const email = computed(() => (typeof claims.value?.email === 'string' ? claims.value.email : null))
  const isAuthenticated = computed(() => userId.value !== null)

  return { userId, email, isAuthenticated }
})
