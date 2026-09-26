import { defineStore } from 'pinia'
import { fetchProfile, updateProfile } from './api/profile'
import type { Profile, ProfilePreferences } from './data/profile'
import { isAdmin as isAdminProfile } from './data/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const isAdmin = computed(() => isAdminProfile(profile.value))

  let request: { userId: string, promise: Promise<Profile | null> } | null = null

  // Carga el perfil del usuario (una sola vez por usuario); con null lo limpia.
  function load(userId: string | null): Promise<Profile | null> {
    if (!userId) {
      profile.value = null
      request = null
      return Promise.resolve(null)
    }
    if (request?.userId === userId) return request.promise

    const promise = fetchProfile(userId)
      .then((result) => {
        if (request?.promise === promise) profile.value = result
        return result
      })
      .catch((error) => {
        if (request?.promise === promise) request = null
        throw error
      })
    request = { userId, promise }
    return promise
  }

  async function updatePreferences(preferences: ProfilePreferences) {
    if (!profile.value) return
    profile.value = await updateProfile(profile.value.id, preferences)
  }

  return { profile, isAdmin, load, updatePreferences }
})
