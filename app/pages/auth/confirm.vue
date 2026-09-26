<script setup lang="ts">
import { useAuthStore } from '@/features/auth/store'

// Destino del enlace de confirmación. Supabase ya procesó el token al cargar la app:
// si hay sesión el correo quedó confirmado; si no, el enlace era inválido o expiró.
definePageMeta({ layout: 'auth', access: 'public' })

const auth = useAuthStore()

watchEffect(() => {
  if (auth.isAuthenticated) navigateTo('/', { replace: true })
})
</script>

<template>
  <AuthCard
    v-if="!auth.isAuthenticated"
    :title="$t('auth.confirm.invalidTitle')"
    :description="$t('auth.confirm.invalidDescription')"
  >
    <template #footer>
      <NuxtLink
        to="/auth/login"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {{ $t('auth.register.toLogin') }}
      </NuxtLink>
    </template>
  </AuthCard>
</template>
