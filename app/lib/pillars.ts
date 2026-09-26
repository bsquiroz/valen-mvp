// Los cuatro pilares del programa; el orden es el de presentación en toda la app.
export const PILLARS = ['psychology', 'finance', 'fitness', 'relationships'] as const

export type Pillar = typeof PILLARS[number]
