import { defineStore } from 'pinia'
import type { ThemeName } from './data/themes'
import { DEFAULT_LIGHT_THEME, THEME_STORAGE_KEY, isThemeName } from './data/themes'

export const useThemeStore = defineStore('theme', () => {
  // El script del <head> ya aplicó el tema inicial; lo leemos de ahí.
  const initial = document.documentElement.dataset.theme
  const current = ref<ThemeName>(isThemeName(initial) ? initial : DEFAULT_LIGHT_THEME)

  function setTheme(theme: ThemeName) {
    current.value = theme
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
    catch {
      // Sin storage disponible el tema solo dura la sesión.
    }
  }

  return { current, setTheme }
})
