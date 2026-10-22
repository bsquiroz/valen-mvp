<script setup lang="ts">
import { FAQ_KEYS } from '../data/launch'
import { useLaunch } from './useLaunch'

type FaqKey = typeof FAQ_KEYS[number]

const { spots, price } = useLaunch()
const open = ref<FaqKey | null>(FAQ_KEYS[0])

function toggle(key: FaqKey) {
  open.value = open.value === key ? null : key
}
</script>

<template>
  <section class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-0.5 border-b-2 border-foreground bg-foreground">
    <div class="bg-background px-[clamp(20px,4vw,56px)] pt-[clamp(48px,8vw,104px)] pb-[clamp(24px,4vw,104px)]">
      <h2 class="m-0 text-[clamp(36px,4.4vw,64px)] leading-[.95] font-black tracking-[-.04em] uppercase">
        {{ $t('landing.faq.title') }}
      </h2>
    </div>
    <div class="bg-background">
      <div
        v-for="key in FAQ_KEYS"
        :key="key"
        class="border-b-2 border-foreground last:border-b-0"
      >
        <button
          type="button"
          :aria-expanded="open === key"
          :aria-controls="`faq-${key}`"
          class="flex w-full cursor-pointer justify-between gap-5 px-[clamp(20px,3vw,40px)] py-[22px] text-left text-[17px] leading-[1.3] font-bold transition-colors hover:bg-muted"
          @click="toggle(key)"
        >
          {{ $t(`landing.faq.items.${key}.q`, { price }) }}
          <span
            aria-hidden="true"
            class="font-black text-primary"
          >{{ open === key ? '–' : '+' }}</span>
        </button>
        <p
          v-if="open === key"
          :id="`faq-${key}`"
          class="m-0 max-w-[60ch] px-[clamp(20px,3vw,40px)] pb-6 text-base leading-[1.55]"
        >
          {{ $t(`landing.faq.items.${key}.a`, { total: spots.total }) }}
        </p>
      </div>
    </div>
  </section>
</template>
