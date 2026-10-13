import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('crms_token'))
  const [loading, setLoading] = useState(true)

  // Hydrate user from token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return }
    getMe()
      .then(data => setUser(data.user || data))
      .catch(() => {
        setUser(null)
        localStorage.removeItem('crms_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  // Listen for 401 events from api.js
  useEffect(() => {
    const handler = () => { setUser(null); setToken(null) }
    window.addEventListener('crms:unauthorized', handler)
    return () => window.removeEventListener('crms:unauthorized', handler)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('crms_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('crms_token')
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback((role) => {
    if (!user?.roles) return false
    return user.roles.includes(role)
  }, [user])

  const value = { user, token, loading, login, logout, hasRole }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
