<script setup lang="ts">
import { LogIn, Settings } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocaleStore } from '@/features/locale/store'
import { isThemeName, THEMES } from '@/features/theme/data/themes'
import { useThemeStore } from '@/features/theme/store'
import { isLocale, LOCALES } from '@/lib/locales'

// Engranaje del header de la landing: idioma, tema y acceso para quien ya tiene cuenta.
const localeStore = useLocaleStore()
const themeStore = useThemeStore()

function onLocale(value: unknown) {
  if (isLocale(value)) localeStore.setLocale(value)
}

function onTheme(value: unknown) {
  if (isThemeName(value)) themeStore.setTheme(value)
}

// El menú queda abierto al elegir, para probar varias opciones seguidas.
function keepOpen(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      :aria-label="$t('landing.header.preferences')"
      class="flex size-10 cursor-pointer items-center justify-center border-2 border-foreground transition-colors hover:bg-muted data-[state=open]:bg-foreground data-[state=open]:text-background"
    >
      <Settings class="size-5" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      class="w-52 font-display"
    >
      <DropdownMenuLabel class="text-xs font-bold tracking-[.06em] uppercase">
        {{ $t('locale.label') }}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        :model-value="localeStore.current"
        @update:model-value="onLocale"
      >
        <DropdownMenuRadioItem
          v-for="locale in LOCALES"
          :key="locale"
          :value="locale"
          :lang="locale"
          @select="keepOpen"
        >
          {{ $t(`locale.names.${locale}`) }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel class="text-xs font-bold tracking-[.06em] uppercase">
        {{ $t('theme.label') }}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        :model-value="themeStore.current"
        @update:model-value="onTheme"
      >
        <DropdownMenuRadioItem
          v-for="theme in THEMES"
          :key="theme"
          :value="theme"
          @select="keepOpen"
        >
          <!-- Muestra de los colores del tema: data-theme aplica sus tokens solo a este elemento -->
          <span
            :data-theme="theme"
            class="flex size-4 items-center justify-center rounded-full border border-border bg-background"
          >
            <span class="size-2 rounded-full bg-primary" />
          </span>
          {{ $t(`theme.names.${theme}`) }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <NuxtLink to="/auth/login">
          <LogIn />
          {{ $t('landing.header.login') }}
        </NuxtLink>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
