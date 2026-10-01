import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Ctx = createContext(null)

// Demo users for offline mode (when backend is not running)
const DEMO_USERS = {
  'admin@kidland.edu.np': { id:'demo1', name:'Super Admin', email:'admin@kidland.edu.np', role:'superadmin', avatar:null },
  'coadmin@kidland.edu.np': { id:'demo2', name:'Co Admin', email:'coadmin@kidland.edu.np', role:'coadmin', avatar:null },
}
const DEMO_PASSWORDS = {
  'admin@kidland.edu.np': 'admin123456',
  'coadmin@kidland.edu.np': 'coadmin123',
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token    = localStorage.getItem('ks_token')
    const savedUser = localStorage.getItem('ks_user')

    if (!token) { setLoading(false); return }

    // Restore user from localStorage immediately (prevents redirect flash)
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch {}
    }

    // Try to verify with server
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.get('/auth/me')
      .then(r => {
        const u = r?.data?.user || r?.user || r
        if (u && u.email) {
          setUser(u)
          localStorage.setItem('ks_user', JSON.stringify(u))
        }
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem('ks_token')
          localStorage.removeItem('ks_user')
          delete api.defaults.headers.common['Authorization']
          setUser(null)
        }
        // Server offline — keep using saved user from localStorage (demo mode)
        // Network failures keep the cached account so offline demo mode remains usable.
        if (error.status !== 401) console.warn('Could not verify token with server — using cached user (offline mode)')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (identifier, password, rememberMe = true) => {
    let backendError = null

    // Try real backend first
    try {
      const r = await api.post('/auth/login', { identifier, password, rememberMe })
      const { token, data } = r
      const u = data?.user || r.user || r
      if (token && u) {
        localStorage.setItem('ks_token', token)
        localStorage.setItem('ks_user', JSON.stringify(u))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(u)
        toast.success(`Welcome back, ${u.name}!`)
        return u
      }
    } catch (err) {
      backendError = err
      console.warn('Backend login failed:', err.message)
    }

    // If backend responded but rejected the credentials (e.g. wrong password against real DB),
    // do NOT silently fall back to demo — surface the real error instead.
    const isNetworkError = backendError?.message?.toLowerCase().includes('network') ||
                            backendError?.message?.toLowerCase().includes('failed to fetch') ||
                            backendError?.code === 'ECONNABORTED'

    if (backendError && !isNetworkError) {
      // Server is reachable and explicitly rejected this login — show that error, don't try demo
      throw new Error(backendError.message || 'Invalid email or password')
    }

    // Backend unreachable (server not running / network issue) — fall back to demo credentials
    const demoUser = DEMO_USERS[identifier]
    if (demoUser && DEMO_PASSWORDS[identifier] === password) {
      const fakeToken = 'demo_token_' + Date.now()
      localStorage.setItem('ks_token', fakeToken)
      localStorage.setItem('ks_user', JSON.stringify(demoUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`
      setUser(demoUser)
      toast.success(`Welcome back, ${demoUser.name}! (Offline mode — backend server not reachable)`, { duration: 5000 })
      return demoUser
    }

    throw new Error('Invalid email or password')
  }, [])

  const logout = useCallback(() => {
    if (localStorage.getItem('ks_token')) api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('ks_token')
    localStorage.removeItem('ks_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((partial) => {
    setUser(prev => {
      const updated = { ...prev, ...partial }
      localStorage.setItem('ks_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <Ctx.Provider value={{
      user, loading, login, logout, updateUser,
      isSuperAdmin: user?.role === 'superadmin',
      isAdmin: ['superadmin','coadmin'].includes(user?.role),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
