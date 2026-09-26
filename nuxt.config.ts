import tailwindcss from '@tailwindcss/vite'
import { themeBootstrapScript } from './app/features/theme/data/themes'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
    'shadcn-nuxt',
  ],
  ssr: false,
  devtools: { enabled: true },

  app: {
    head: {
      script: [{ innerHTML: themeBootstrapScript, tagPosition: 'head' }],
    },
  },

  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  i18n: {
    defaultLocale: 'es',
    strategy: 'no_prefix',
    locales: [
      { code: 'es', language: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
    ],
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  supabase: {
    // Las redirecciones de auth se manejan con middleware propio (Fase 2)
    redirect: false,
    // Los tipos de la base se generan en la Fase 2
    types: false,
  },
})
