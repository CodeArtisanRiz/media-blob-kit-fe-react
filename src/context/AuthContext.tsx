import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { User, LoginResponse } from '@/types/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const res = await api.get<User>('/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { username, password })
    const { access_token, refresh_token } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    setToken(access_token)
    
    // Fetch profile
    const profileRes = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    setUser(profileRes.data)
    localStorage.setItem('user', JSON.stringify(profileRes.data))
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      } catch {
        // ignore logout errors
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
