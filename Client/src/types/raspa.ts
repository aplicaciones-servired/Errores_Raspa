export interface RaspaData {
  id: number
  empresa: string
  nombre: string
  tipoRaspa: string
  imagenFrenteUrl: string
  imagenReversoUrl: string
  imagenErrorUrl: string
  estado: string
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
