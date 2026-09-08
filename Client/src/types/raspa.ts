export type RaspaEstado = 'PENDIENTE' | 'RESUELTO' | 'RECHAZADO'

export interface RaspaData {
  id: number
  empresa: string
  nombre: string
  tipoRaspa: string
  imagenFrenteUrl: string
  imagenReversoUrl: string
  imagenErrorUrl: string
  estado: RaspaEstado
  requestId?: string | null
  correoMessageId?: string | null
  respuestaSoporte?: string | null
  createdAt: string
}

export interface RaspaCreateInput {
  empresa: string
  nombre: string
  tipoRaspa: string
  imagenFrente: string
  imagenReverso: string
  imagenError: string
}

export interface EstadisticaEstado {
  estado: string
  cantidad: number
}

export interface EstadisticaEmpresa {
  empresa: string
  cantidad: number
}

export interface EstadisticaTipo {
  tipoRaspa: string
  cantidad: number
}

export interface EstadisticaDiaria {
  fecha: string
  cantidad: number
}

export interface DashboardStats {
  total: number
  pendientes: number
  resueltos: number
  sinRespuesta: number
  conRequestId: number
  resolucionPct: number
  porEstado: EstadisticaEstado[]
  porEmpresa: EstadisticaEmpresa[]
  porTipo: EstadisticaTipo[]
  ultimos7Dias: EstadisticaDiaria[]
  ultimos30Dias: EstadisticaDiaria[]
}
