import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('padeliando_user')) }
    catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Al montar, verificar que la cookie siga siendo válida (solo si hay sesión guardada)
  useEffect(() => {
    if (!localStorage.getItem('padeliando_user')) { setLoading(false); return }
    api.auth.me()
      .then((u) => { setUser(u); localStorage.setItem('padeliando_user', JSON.stringify(u)) })
      .catch(() => { setUser(null); localStorage.removeItem('padeliando_user') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((userData) => {
    setUser(userData)
    localStorage.setItem('padeliando_user', JSON.stringify(userData))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      localStorage.setItem('padeliando_user', JSON.stringify(u));
    } catch { /* silencioso */ }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // intentionally ignored logout errors
    }
    setUser(null)
    localStorage.removeItem('padeliando_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
