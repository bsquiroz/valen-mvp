<script setup lang="ts">
import ForgotPasswordForm from '@/features/auth/ui/ForgotPasswordForm.vue'

definePageMeta({ layout: 'auth', access: 'guest' })
</script>

<template>
  <AuthCard
    :title="$t('auth.forgotPassword.title')"
    :description="$t('auth.forgotPassword.description')"
  >
    <ForgotPasswordForm />
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
