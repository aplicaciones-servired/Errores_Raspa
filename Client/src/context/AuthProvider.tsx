import { useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { AuthContext, AuthUser } from './AuthContext'
import { loginAPI } from '../services/auth.service'
import { API_LOGIN } from '../utils/const'

const STORAGE_KEY = 'raspas_auth'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback(async (username: string, password: string) => {
    const u = await loginAPI(username, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    axios
      .post(`${API_LOGIN}/logout`, null, { withCredentials: true })
      .catch(() => {})
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
