<script setup lang="ts">
import LoginForm from '@/features/auth/ui/LoginForm.vue'

definePageMeta({ layout: 'auth', access: 'guest' })
</script>

<template>
  <AuthCard
    :title="$t('auth.login.title')"
    :description="$t('auth.login.description')"
  >
    <LoginForm />
    <template #footer>
      {{ $t('auth.login.noAccount') }}&nbsp;
      <NuxtLink
        to="/auth/register"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {{ $t('auth.login.toRegister') }}
      </NuxtLink>
    </template>
  </AuthCard>
</template>
