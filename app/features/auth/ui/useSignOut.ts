import { signOut } from '../api/auth'

export function useSignOut() {
  const pending = ref(false)

  async function run() {
    if (pending.value) return
    pending.value = true
    await signOut()
    pending.value = false
    await navigateTo('/auth/login')
  }

  return { pending, signOut: run }
}
