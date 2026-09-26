import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { createAdmin, deleteAdmin, listAdmins, setAdminPassword } from './api/admins'
import type { AdminAccount, CreateAdminInput } from './data/admins'

export const useAdminsStore = defineStore('admins', () => {
  const auth = useAuthStore()

  const admins = ref<AdminAccount[] | null>(null)

  async function load() {
    admins.value = await listAdmins()
  }

  async function create(input: CreateAdminInput) {
    await createAdmin(input)
    await load()
  }

  async function remove(userId: string) {
    await deleteAdmin(userId)
    admins.value = admins.value?.filter(admin => admin.id !== userId) ?? null
  }

  function setPassword(userId: string, password: string) {
    return setAdminPassword(userId, password)
  }

  watch(() => auth.userId, () => {
    admins.value = null
  })

  return { admins, load, create, remove, setPassword }
})
