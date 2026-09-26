import { defineStore } from 'pinia'
import { useAuthStore } from '@/features/auth/store'
import { checkInChallenge, fetchChallenges, fetchEnrollments, startChallenge } from './api/challenges'
import type { Challenge, Enrollment } from './data/challenges'

export const useChallengesStore = defineStore('challenges', () => {
  const auth = useAuthStore()

  const challenges = ref<Challenge[] | null>(null)
  const enrollments = ref<Enrollment[]>([])

  const enrollmentById = computed(() => new Map(enrollments.value.map(enrollment => [enrollment.challengeId, enrollment])))

  async function load(force = false) {
    if (!auth.userId) return
    if (challenges.value && !force) return
    const [loadedChallenges, loadedEnrollments] = await Promise.all([fetchChallenges(), fetchEnrollments(auth.userId)])
    challenges.value = loadedChallenges
    enrollments.value = loadedEnrollments
  }

  async function refreshEnrollments() {
    if (!auth.userId) return
    enrollments.value = await fetchEnrollments(auth.userId)
  }

  function challengeById(id: string): Challenge | null {
    return challenges.value?.find(challenge => challenge.id === id) ?? null
  }

  async function start(challengeId: string) {
    await startChallenge(challengeId)
    await refreshEnrollments()
  }

  // Recarga para reflejar si la base dio el reto por completado
  async function checkIn(challengeId: string, day: string) {
    await checkInChallenge(challengeId, day)
    await refreshEnrollments()
  }

  watch(() => auth.userId, () => {
    challenges.value = null
    enrollments.value = []
  })

  return { challenges, enrollments, enrollmentById, load, challengeById, start, checkIn }
})
