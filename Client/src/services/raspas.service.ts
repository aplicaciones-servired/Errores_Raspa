import http from './http'
import type {
  ActualizarRaspaInput,
  DashboardStats,
  FiltrosEstadisticas,
  FiltrosRaspa,
  RaspaCreateInput,
  RaspaData,
  RespuestaPaginada,
} from '../types/raspa'

export const listarRaspas = async (
  filtros: FiltrosRaspa = {},
): Promise<RespuestaPaginada> => {
  const { data } = await http.get<RespuestaPaginada>('/raspas', { params: filtros })
  return data
}

export const obtenerEstadisticas = async (
  filtros: FiltrosEstadisticas = {},
): Promise<DashboardStats> => {
  const { data } = await http.get<DashboardStats>('/raspas/estadisticas', {
    params: filtros,
  })
  return data
}

export const crearRaspa = async (
  input: RaspaCreateInput,
): Promise<RaspaData> => {
  const { data } = await http.post<RaspaData>('/raspas', input)
  return data
}

export const actualizarRaspa = async (
  id: number,
  input: ActualizarRaspaInput,
): Promise<RaspaData> => {
  const { data } = await http.patch<RaspaData>(`/raspas/${id}`, input)
  return data
}

export const enviarReporteSemanal = async (): Promise<{
  enviado: boolean
  messageId: string
}> => {
  const { data } = await http.post<{ enviado: boolean; messageId: string }>(
    '/raspas/reporte',
  )
  return data
}

export interface VerificarRespuestaResponse {
  respondido: boolean
  requestId: string | null
  respuesta: string | null
  mensaje: string
}

export const verificarRespuesta = async (
  id: number,
): Promise<VerificarRespuestaResponse> => {
  const { data } = await http.get<VerificarRespuestaResponse>(
    `/raspas/${id}/verificar-respuesta`,
  )
  return data
}