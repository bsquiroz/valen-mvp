<script setup lang="ts">
import RegisterForm from '@/features/auth/ui/RegisterForm.vue'

definePageMeta({ layout: 'auth', access: 'guest' })
</script>

<template>
  <AuthCard
    :title="$t('auth.register.title')"
    :description="$t('auth.register.description')"
  >
    <RegisterForm />
    <template #footer>
      {{ $t('auth.register.hasAccount') }}&nbsp;
      <NuxtLink
        to="/auth/login"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {{ $t('auth.register.toLogin') }}
      </NuxtLink>
    </template>
  </AuthCard>
</template>
