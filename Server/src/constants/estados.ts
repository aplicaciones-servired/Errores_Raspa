export const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  RESUELTO: 'RESUELTO',
  RECHAZADO: 'RECHAZADO',
} as const

export type RaspaEstado = (typeof ESTADOS)[keyof typeof ESTADOS]