<script setup lang="ts">
import LandingClosing from '@/features/landing/ui/LandingClosing.vue'
import LandingFaq from '@/features/landing/ui/LandingFaq.vue'
import LandingHero from '@/features/landing/ui/LandingHero.vue'
import LandingPillars from '@/features/landing/ui/LandingPillars.vue'
import LandingPricing from '@/features/landing/ui/LandingPricing.vue'
import LandingProblem from '@/features/landing/ui/LandingProblem.vue'
import LandingQuote from '@/features/landing/ui/LandingQuote.vue'
import LandingSchedule from '@/features/landing/ui/LandingSchedule.vue'
import LandingSignup from '@/features/landing/ui/LandingSignup.vue'
import LandingStickyBar from '@/features/landing/ui/LandingStickyBar.vue'

definePageMeta({ layout: 'landing', access: 'public' })

const { t } = useI18n()
useHead({ title: () => t('landing.meta.title') })
</script>

<template>
  <main>
    <LandingHero />
    <LandingProblem />
    <LandingPillars />
    <LandingQuote />
    <LandingSchedule />
    <LandingPricing />
    <LandingSignup />
    <LandingFaq />
    <LandingClosing />
    <LandingStickyBar />
  </main>
</template>
