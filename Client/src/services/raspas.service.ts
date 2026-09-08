import http from './http'
import type { DashboardStats, RaspaCreateInput, RaspaData } from '../types/raspa'

export const listarRaspas = async (): Promise<RaspaData[]> => {
  const { data } = await http.get<RaspaData[]>('/raspas')
  return data
}

export const obtenerEstadisticas = async (): Promise<DashboardStats> => {
  const { data } = await http.get<DashboardStats>('/raspas/estadisticas')
  return data
}

export const crearRaspa = async (
  input: RaspaCreateInput,
): Promise<RaspaData> => {
  const { data } = await http.post<RaspaData>('/raspas', input)
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
