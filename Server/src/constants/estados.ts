export const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  RESUELTO: 'RESUELTO',
} as const

export type RaspaEstado = (typeof ESTADOS)[keyof typeof ESTADOS]