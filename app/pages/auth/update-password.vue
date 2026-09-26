<script setup lang="ts">
import { useAuthStore } from '@/features/auth/store'
import UpdatePasswordForm from '@/features/auth/ui/UpdatePasswordForm.vue'

// Sirve para el enlace de recuperación (que inicia sesión) y para cambiar la contraseña estando logueado.
// Es pública para poder avisar cuando el enlace expiró en vez de mandar al login sin explicación.
definePageMeta({ layout: 'auth', access: 'public' })

const auth = useAuthStore()
</script>

<template>
  <AuthCard
    v-if="auth.isAuthenticated"
    :title="$t('auth.updatePassword.title')"
  >
    <UpdatePasswordForm />
  </AuthCard>

  <AuthCard
    v-else
    :title="$t('auth.updatePassword.expiredTitle')"
    :description="$t('auth.updatePassword.expiredDescription')"
  >
    <template #footer>
      <NuxtLink
        to="/auth/forgot-password"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {{ $t('auth.forgotPassword.title') }}
      </NuxtLink>
    </template>
  </AuthCard>
</template>
