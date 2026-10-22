<template>
  <section
    id="inscripcion"
    class="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-0.5 border-b-2 border-foreground bg-foreground"
  >
    <div class="bg-muted px-[clamp(20px,4vw,56px)] pt-[clamp(48px,8vw,104px)] pb-[clamp(24px,4vw,104px)]">
      <p class="mb-5 text-xs font-bold tracking-[.08em] text-primary uppercase">
        {{ $t('landing.signup.kicker') }}
      </p>
      <h2 class="m-0 mb-6 text-[clamp(36px,5.4vw,84px)] leading-[.92] font-black tracking-[-.05em] uppercase">
        {{ $t('landing.signup.title') }}
      </h2>
      <p class="m-0 max-w-[40ch] text-lg leading-[1.45]">
        {{ $t('landing.signup.description') }}
      </p>
    </div>
    <div class="flex flex-col justify-center gap-5 bg-muted px-[clamp(20px,4vw,56px)] py-[clamp(32px,6vw,80px)]">
      <NuxtLink
        to="/auth/register"
        class="flex justify-between gap-4 bg-primary px-6 py-[22px] text-lg font-extrabold text-primary-foreground transition-colors hover:bg-primary/85"
      >
        {{ $t('landing.signup.cta') }} <span aria-hidden="true">→</span>
      </NuxtLink>
      <p class="m-0 text-[15px] font-semibold">
        {{ $t('landing.signup.hasAccount') }}
        <NuxtLink
          to="/auth/login"
          class="underline underline-offset-4 hover:text-primary"
        >
          {{ $t('landing.signup.toLogin') }}
        </NuxtLink>
      </p>
      <p class="m-0 text-[13px] leading-[1.4]">
        {{ $t('landing.signup.note') }}
      </p>
    </div>
  </section>
</template>
