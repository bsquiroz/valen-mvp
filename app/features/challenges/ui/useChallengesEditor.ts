import { moveInPillar, reorderInPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { tempId } from '@/lib/tempId'
import { fetchAdminChallenges, saveAdminChallenges } from '../api/adminChallenges'
import type { AdminChallenge, ChallengeForm } from '../data/adminChallenges'
import * as ops from '../data/adminChallenges'

type ChallengePatch = Partial<Pick<AdminChallenge, 'title' | 'description' | 'durationDays' | 'isActive'>>

// Estado y operaciones del editor de retos (mismo patrón que los demás editores del admin).
// Las operaciones solo cambian un borrador local; `save` lo guarda todo en una sola llamada.
export function useChallengesEditor() {
  const saved = ref<AdminChallenge[]>([])
  const challenges = ref<AdminChallenge[]>([])
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const saving = ref(false)

  const changeCount = computed(() => ops.countChallengeChanges(saved.value, challenges.value))
  const hasChanges = computed(() => changeCount.value > 0)

  async function load() {
    status.value = 'loading'
    try {
      saved.value = await fetchAdminChallenges()
      challenges.value = saved.value
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function edit(change: (current: AdminChallenge[]) => AdminChallenge[]) {
    if (saving.value) return
    challenges.value = change(challenges.value)
  }

  // Si falla, el borrador se conserva para reintentar.
  async function save() {
    if (!hasChanges.value || saving.value) return
    saving.value = true
    try {
      await saveAdminChallenges(challenges.value)
      saved.value = await fetchAdminChallenges()
      challenges.value = saved.value
    }
    finally {
      saving.value = false
    }
  }

  function discard() {
    challenges.value = saved.value
  }

  return {
    challenges,
    status,
    saving,
    changeCount,
    hasChanges,
    load,
    save,
    discard,
    createChallenge: (pillar: Pillar, form: ChallengeForm) => edit(current => ops.addChallenge(current, pillar, form, tempId())),
    updateChallenge: (id: string, patch: ChallengePatch) => edit(current => ops.updateChallenge(current, id, patch)),
    deleteChallenge: (id: string) => edit(current => ops.removeChallenge(current, id)),
    reorderChallenges: (pillar: Pillar, orderedIds: string[]) => edit(current => reorderInPillar(current, pillar, orderedIds)),
    moveChallenge: (id: string, delta: number) => edit(current => moveInPillar(current, id, delta)),
  }
}

export type ChallengesEditor = ReturnType<typeof useChallengesEditor>
