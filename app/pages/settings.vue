<script setup lang="ts">
import { KeyRound } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store'
import LocaleSelect from '@/features/locale/ui/LocaleSelect.vue'
import ProfileForm from '@/features/profile/ui/ProfileForm.vue'
import ThemeSelect from '@/features/theme/ui/ThemeSelect.vue'

const auth = useAuthStore()
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader
      :title="$t('settings.title')"
      :description="$t('settings.description')"
    />
    <div class="flex flex-col gap-4">
      <SettingsSection
        :title="$t('settings.profile.title')"
        :description="$t('settings.profile.description')"
      >
        <ProfileForm />
      </SettingsSection>

      <SettingsSection
        :title="$t('settings.appearance.title')"
        :description="$t('settings.appearance.description')"
      >
        <ThemeSelect />
      </SettingsSection>

      <SettingsSection
        :title="$t('settings.language.title')"
        :description="$t('settings.language.description')"
      >
        <LocaleSelect />
      </SettingsSection>

      <SettingsSection
        :title="$t('settings.security.title')"
        :description="$t('settings.security.description', { email: auth.email })"
      >
        <Button
          variant="outline"
          as-child
        >
          <NuxtLink to="/auth/update-password">
            <KeyRound />
            {{ $t('settings.security.changePassword') }}
          </NuxtLink>
        </Button>
      </SettingsSection>
    </div>
  </div>
</template>
