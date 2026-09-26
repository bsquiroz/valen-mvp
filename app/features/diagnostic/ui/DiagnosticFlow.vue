<script setup lang="ts">
import { ArrowLeft, ArrowRight, FlaskConical } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/features/auth/store'
import { usePlanStore } from '@/features/plan/store'
import { canTakeDiagnostic } from '@/features/profile/data/profile'
import { useProfileStore } from '@/features/profile/store'
import { localize } from '@/lib/localizedText'
import { previewDiagnostic } from '../api/diagnostic'
import type { PillarScores as Scores } from '../data/diagnostic'
import { answeredCount, isAlreadyCompletedError, isDiagnosticComplete, isOutdatedAnswersError, resumeIndex } from '../data/diagnostic'
import { useDiagnosticStore } from '../store'
import OpportunityAreas from './OpportunityAreas.vue'
import PillarScores from './PillarScores.vue'
import { useDiagnosticSession } from './useDiagnosticSession'

// preview: modo de prueba para admins. No guarda borrador ni intento; muestra el resultado aquí mismo.
const props = defineProps<{ preview?: boolean }>()

const session = useDiagnosticSession({ persistDraft: !props.preview })
const { questions, answers } = session
const store = useDiagnosticStore()
const auth = useAuthStore()
const profileStore = useProfileStore()
const planStore = usePlanStore()
const currentLocale = useContentLocale()

const status = ref<'loading' | 'loadError' | 'intro' | 'questions' | 'submitting' | 'previewResult' | 'alreadyCompleted'>('loading')
const submitError = ref(false)
// El diagnóstico cambió mientras se respondía y hay preguntas nuevas o distintas
const outdated = ref(false)
const index = ref(0)
const previewScores = ref<Scores | null>(null)

const total = computed(() => questions.value.length)
const answered = computed(() => answeredCount(questions.value, answers.value))
const complete = computed(() => isDiagnosticComplete(questions.value, answers.value))
const current = computed(() => questions.value[index.value])
const isLast = computed(() => index.value === total.value - 1)

async function load() {
  status.value = 'loading'
  try {
    // El diagnóstico se responde una sola vez: si ya lo hizo, va a sus resultados
    if (!props.preview && !canTakeDiagnostic(await profileStore.load(auth.userId))) {
      await navigateTo('/diagnostic/results', { replace: true })
      return
    }
    await session.start()
    index.value = resumeIndex(questions.value, answers.value)
    status.value = 'intro'
  }
  catch {
    status.value = 'loadError'
  }
}

onMounted(load)

function begin() {
  index.value = resumeIndex(questions.value, answers.value)
  status.value = 'questions'
}

function restart() {
  session.reset()
  previewScores.value = null
  submitError.value = false
  index.value = 0
  status.value = 'questions'
}

function select(optionId: string) {
  const question = current.value
  if (!question) return
  session.answer(question.id, optionId)
  // Avanza solo tras una pausa breve para que se vea la opción elegida
  if (!isLast.value) {
    const from = index.value
    setTimeout(() => {
      if (index.value === from) index.value++
    }, 250)
  }
}

function goToFirstUnanswered() {
  index.value = resumeIndex(questions.value, answers.value)
}

async function submit() {
  submitError.value = false
  outdated.value = false
  status.value = 'submitting'
  try {
    if (props.preview) {
      previewScores.value = await previewDiagnostic(questions.value, answers.value)
      status.value = 'previewResult'
      return
    }
    await store.submit(questions.value, answers.value)
    // El plan se recalcula en la base al completar el diagnóstico
    planStore.invalidate()
    session.reset()
    await profileStore.refresh()
    await navigateTo('/diagnostic/results')
  }
  catch (error) {
    if (isOutdatedAnswersError(error) && await reloadQuestions()) return
    // Ya lo completó (p. ej. desde otra pestaña)
    if (isAlreadyCompletedError(error)) {
      session.reset()
      planStore.invalidate()
      await profileStore.refresh().catch(() => {})
      status.value = 'alreadyCompleted'
      return
    }
    submitError.value = true
    status.value = 'questions'
  }
}

// Recarga las preguntas conservando las respuestas que siguen siendo válidas.
async function reloadQuestions(): Promise<boolean> {
  try {
    await session.start(answers.value)
    outdated.value = true
    index.value = resumeIndex(questions.value, answers.value)
    status.value = 'questions'
    return true
  }
  catch {
    return false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-6">
    <Alert v-if="preview">
      <FlaskConical />
      <AlertTitle>{{ $t('diagnostic.preview.title') }}</AlertTitle>
      <AlertDescription>{{ $t('diagnostic.preview.description') }}</AlertDescription>
    </Alert>

    <p
      v-if="status === 'loading'"
      class="py-10 text-center text-sm text-muted-foreground"
    >
      {{ $t('common.loading') }}
    </p>

    <div
      v-else-if="status === 'loadError'"
      class="flex flex-col items-start gap-4"
    >
      <Alert variant="destructive">
        <AlertDescription>{{ $t('diagnostic.loadError') }}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        @click="load"
      >
        {{ $t('common.retry') }}
      </Button>
    </div>

    <div
      v-else-if="status === 'alreadyCompleted'"
      class="flex flex-col items-start gap-4"
    >
      <Alert>
        <AlertDescription>{{ $t('diagnostic.alreadyCompleted') }}</AlertDescription>
      </Alert>
      <Button as-child>
        <NuxtLink to="/diagnostic/results">
          {{ $t('diagnostic.summary.details') }}
        </NuxtLink>
      </Button>
    </div>

    <section
      v-else-if="status === 'intro'"
      class="flex flex-col gap-6"
    >
      <PageHeader
        :title="$t('diagnostic.intro.title')"
        :description="$t('diagnostic.intro.description')"
      />
      <ul class="flex flex-col gap-2 text-sm text-muted-foreground">
        <li>{{ $t('diagnostic.intro.length', { count: total }) }}</li>
        <li>{{ $t('diagnostic.intro.honesty') }}</li>
        <li v-if="!preview">
          {{ $t('diagnostic.intro.autosave') }}
        </li>
      </ul>
      <div class="flex flex-wrap gap-2">
        <Button @click="begin">
          {{ answered > 0 ? $t('diagnostic.intro.continue', { answered, total }) : $t('diagnostic.intro.start') }}
        </Button>
        <Button
          v-if="answered > 0"
          variant="ghost"
          @click="restart"
        >
          {{ $t('diagnostic.intro.restart') }}
        </Button>
      </div>
    </section>

    <section
      v-else-if="status === 'previewResult' && previewScores"
      class="flex flex-col gap-4"
    >
      <PageHeader
        :title="$t('diagnostic.preview.resultTitle')"
        :description="$t('diagnostic.preview.resultDescription')"
      />
      <Card>
        <CardHeader>
          <CardTitle as="h2">
            {{ $t('diagnostic.results.byPillar') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PillarScores :scores="previewScores" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle as="h2">
            {{ $t('diagnostic.results.opportunities') }}
          </CardTitle>
          <CardDescription>{{ $t('diagnostic.results.opportunitiesDescription') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <OpportunityAreas :scores="previewScores" />
        </CardContent>
      </Card>
      <div class="flex flex-wrap gap-2">
        <Button @click="restart">
          {{ $t('diagnostic.preview.again') }}
        </Button>
        <Button
          variant="outline"
          @click="index = 0; status = 'questions'"
        >
          {{ $t('diagnostic.preview.review') }}
        </Button>
        <Button
          variant="ghost"
          as-child
        >
          <NuxtLink to="/admin/diagnostic">
            {{ $t('diagnostic.preview.backToAdmin') }}
          </NuxtLink>
        </Button>
      </div>
    </section>

    <section
      v-else-if="current"
      class="flex flex-col gap-6"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{{ $t('diagnostic.progress', { current: index + 1, total }) }}</span>
          <Badge variant="secondary">
            {{ $t(`pillars.${current.pillar}`) }}
          </Badge>
        </div>
        <ProgressBar
          :value="(answered / total) * 100"
          :label="$t('diagnostic.answered', { answered, total })"
        />
      </div>

      <Alert
        v-if="submitError"
        variant="destructive"
      >
        <AlertDescription>{{ $t('diagnostic.submitError') }}</AlertDescription>
      </Alert>
      <Alert v-else-if="outdated">
        <AlertDescription>{{ $t('diagnostic.outdated') }}</AlertDescription>
      </Alert>

      <fieldset class="flex flex-col gap-4">
        <legend
          :id="`question-${current.id}`"
          class="mb-4 text-xl font-semibold tracking-tight"
        >
          {{ localize(current.prompt, currentLocale) }}
        </legend>
        <div
          role="radiogroup"
          :aria-labelledby="`question-${current.id}`"
          class="flex flex-col gap-2"
        >
          <button
            v-for="option in current.options"
            :key="option.id"
            type="button"
            role="radio"
            :aria-checked="answers[current.id] === option.id"
            :disabled="status === 'submitting'"
            class="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:ring-2 aria-checked:ring-ring/40"
            @click="select(option.id)"
          >
            {{ localize(option.label, currentLocale) }}
          </button>
        </div>
      </fieldset>

      <div class="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          :disabled="index === 0 || status === 'submitting'"
          @click="index--"
        >
          <ArrowLeft />
          {{ $t('common.back') }}
        </Button>

        <!-- En vista previa se puede avanzar sin responder, para recorrer el contenido -->
        <Button
          v-if="!isLast"
          variant="outline"
          :disabled="!preview && !answers[current.id]"
          @click="index++"
        >
          {{ $t('common.next') }}
          <ArrowRight />
        </Button>
        <Button
          v-else-if="complete"
          :disabled="status === 'submitting'"
          @click="submit"
        >
          {{ status === 'submitting' ? $t('diagnostic.submitting') : $t('diagnostic.submit') }}
        </Button>
        <Button
          v-else
          variant="outline"
          @click="goToFirstUnanswered"
        >
          {{ $t('diagnostic.missing', { count: total - answered }) }}
        </Button>
      </div>
    </section>
  </div>
</template>
