import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await api.get('/auth/me/')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(username, password) {
    try {
      const res = await api.post('/auth/login/', { username, password })
      if (res.data.success) {
        setUser(res.data.user)
        return { success: true }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      const data = err.response?.data || {}
      return {
        success: false,
        error: data.error || 'Login failed',
        locked: data.locked || false,
        remaining_seconds: data.remaining_seconds || 0,
        attempts_left: data.attempts_left ?? 3,
      }
    }
  }

  async function logout() {
    await api.post('/auth/logout/')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
