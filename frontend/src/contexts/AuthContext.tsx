
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import api, { getCsrfCookie } from '../lib/api'

export type AuthUser = {
  id: number
  name: string
  email: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/user')
        setUser(response.data.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    await getCsrfCookie()

    await api.post('/api/login', {
      email,
      password,
    })

    const response = await api.get('/api/user')
    setUser(response.data.user)
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => {
    await getCsrfCookie()

    await api.post('/api/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })

    const response = await api.get('/api/user')
    setUser(response.data.user)
  }

  const logout = async () => {
    await api.post('/api/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
