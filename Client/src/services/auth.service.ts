import axios from 'axios'
import { API_LOGIN } from '../utils/const'
import { AuthUser } from '../context/AuthContext'

interface LoginApiResponse {
  message: string
  company: string
  user: {
    id: number
    names: string
    lastnames: string
    document: string
    username: string
    email: string
    company: string
    process: string
    sub_process: string
    state: string
  }
}

export async function loginAPI(
  username: string,
  password: string,
): Promise<AuthUser> {
  const { data } = await axios.post<LoginApiResponse>(
    `${API_LOGIN}/login`,
    { username, password },
    { withCredentials: true },
  )

  if (!data.user) {
    throw new Error('Respuesta invalida del servidor')
  }

  return {
    id: data.user.id,
    username: data.user.username,
    names: data.user.names,
    lastnames: data.user.lastnames,
    email: data.user.email,
    company: data.company,
  }
}
