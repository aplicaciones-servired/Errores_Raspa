import http from './http'
import type { RaspaCreateInput, RaspaData } from '../types/raspa'

export const listarRaspas = async (): Promise<RaspaData[]> => {
  const { data } = await http.get<RaspaData[]>('/raspas')
  return data
}

export const crearRaspa = async (
  input: RaspaCreateInput,
): Promise<RaspaData> => {
  const { data } = await http.post<RaspaData>('/raspas', input)
  return data
}
