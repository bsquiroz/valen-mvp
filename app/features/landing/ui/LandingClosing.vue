<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <section class="bg-primary px-[clamp(20px,4vw,56px)] pt-[clamp(56px,10vw,144px)] pb-28 text-primary-foreground">
    <h2 class="m-0 max-w-[13ch] text-[clamp(40px,8vw,136px)] leading-[.88] font-black tracking-[-.05em] text-balance uppercase">
      {{ $t('landing.closing.title') }}
    </h2>
    <div class="mt-12 flex">
      <NuxtLink
        to="/auth/register"
        class="flex w-full max-w-[420px] justify-between gap-6 bg-background px-[22px] py-5 text-lg font-extrabold text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        {{ $t('landing.closing.cta') }} <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
    <div class="mt-16 flex flex-wrap justify-between gap-4 border-t-2 border-primary-foreground pt-5 text-[13px] font-semibold tracking-[.06em] uppercase">
      <span>{{ $t('landing.closing.copyright', { year }) }}</span>
      <span>{{ $t('landing.closing.tagline') }}</span>
    </div>
  </section>
</template>
