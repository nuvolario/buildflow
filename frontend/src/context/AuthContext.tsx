import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: number
  email: string
  nome: string
  cognome: string
  telefono?: string
}

interface Company {
  id: number
  nome: string
  ruolo: string
}

interface AuthContextType {
  user: User | null
  company: Company | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  nome: string
  cognome: string
  telefono?: string
  companyName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'buildflow_token'
const USER_KEY = 'buildflow_user'
const COMPANY_KEY = 'buildflow_company'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Check stored session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    const storedCompany = localStorage.getItem(COMPANY_KEY)

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        if (storedCompany) {
          setCompany(JSON.parse(storedCompany))
        }
        // Verify token is still valid
        verifyToken()
      } catch {
        clearSession()
      }
    }

    setLoading(false)
  }, [])

  async function verifyToken() {
    try {
      const response = await api.get('/auth/me')
      if (response.success && response.data) {
        setUser(response.data.user)
        setCompany(response.data.company)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
        if (response.data.company) {
          localStorage.setItem(COMPANY_KEY, JSON.stringify(response.data.company))
        }
      }
    } catch {
      clearSession()
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(COMPANY_KEY)
    setUser(null)
    setCompany(null)
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })

    if (!response.success) {
      throw new Error(response.error || 'Errore durante il login')
    }

    const { token, user: userData, company: companyData } = response.data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    if (companyData) {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(companyData))
    }

    setUser(userData)
    setCompany(companyData)
  }

  async function register(data: RegisterData) {
    const response = await api.post('/auth/register', data)

    if (!response.success) {
      throw new Error(response.error || 'Errore durante la registrazione')
    }

    const { token, user: userData, company: companyData } = response.data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    if (companyData) {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(companyData))
    }

    setUser(userData)
    setCompany(companyData)
  }

  function logout() {
    api.post('/auth/logout').catch(() => {})
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, company, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
