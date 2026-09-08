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

export interface EstadisticaEmbudo {
  grupo: string
  cantidad: number
}

export interface FiltrosRaspa {
  pagina?: number
  limite?: number
  estado?: string
  nombre?: string
  empresa?: string
  requestId?: string
  desde?: string
  hasta?: string
}

export interface RespuestaPaginada {
  datos: RaspaData[]
  total: number
  pagina: number
  totalPaginas: number
}

export interface ActualizarRaspaInput {
  nombre?: string
  empresa?: string
  tipoRaspa?: string
  estado?: RaspaEstado
  imagenFrente?: string
  imagenReverso?: string
  imagenError?: string
}

export interface FiltrosEstadisticas {
  empresa?: string
  desde?: string
  hasta?: string
}

export interface DashboardStats {
  total: number
  pendientes: number
  resueltos: number
  rechazados: number
  sinRespuesta: number
  conRequestId: number
  resolucionPct: number
  tiempoPromedioResolucionHs: number
  pendientes24h: number
  pendientes48h: number
  embudo: EstadisticaEmbudo[]
  porEstado: EstadisticaEstado[]
  porEmpresa: EstadisticaEmpresa[]
  porTipo: EstadisticaTipo[]
  ultimos7Dias: EstadisticaDiaria[]
  ultimos30Dias: EstadisticaDiaria[]
}
