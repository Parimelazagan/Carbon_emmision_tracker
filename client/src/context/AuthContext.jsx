import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ct_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while we verify the stored token

  // On mount, if a token exists re-fetch /me to get the user object
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data.data
    localStorage.setItem(TOKEN_KEY, token)
    setUser(u)
    return u
  }, [])

  const signup = useCallback(async ({ name, email, password, organizationName, role }) => {
    const res = await api.post('/auth/signup', { name, email, password, organizationName, role })
    const { token, user: u } = res.data.data
    localStorage.setItem(TOKEN_KEY, token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, isAuthenticated: !!user }),
    [user, loading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
