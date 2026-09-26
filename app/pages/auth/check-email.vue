<script setup lang="ts">
import ResendConfirmation from '@/features/auth/ui/ResendConfirmation.vue'

definePageMeta({ layout: 'auth', access: 'guest' })

const route = useRoute()
const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
</script>

<template>
  <AuthCard
    :title="$t('auth.checkEmail.title')"
    :description="email ? $t('auth.checkEmail.descriptionWithEmail', { email }) : $t('auth.checkEmail.description')"
  >
    <ResendConfirmation
      v-if="email"
      :email="email"
    />
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
