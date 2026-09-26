export const THEMES = ['light', 'dark', 'sand'] as const

export type ThemeName = typeof THEMES[number]

export const DEFAULT_LIGHT_THEME: ThemeName = 'light'
export const DEFAULT_DARK_THEME: ThemeName = 'dark'

export const THEME_STORAGE_KEY = 'theme'

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

// Tema guardado si es válido; si no, el que corresponde a la preferencia del sistema.
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): ThemeName {
  if (isThemeName(stored)) return stored
  return prefersDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME
}

// Se inyecta en el <head> (nuxt.config) para aplicar el tema antes del primer render y evitar el parpadeo.
export const themeBootstrapScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var v=${JSON.stringify(THEMES)};if(v.indexOf(t)<0){t=window.matchMedia('(prefers-color-scheme: dark)').matches?${JSON.stringify(DEFAULT_DARK_THEME)}:${JSON.stringify(DEFAULT_LIGHT_THEME)}}d.dataset.theme=t}catch(e){d.dataset.theme=${JSON.stringify(DEFAULT_LIGHT_THEME)}}})()`
