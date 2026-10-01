import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
})

// Attach token on every request
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ks_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// Handle responses - DON'T auto-redirect on 401 from /auth/me
api.interceptors.response.use(
  res => res.data ?? res,
  err => {
    const status  = err.response?.status
    const url     = err.config?.url || ''
    const message = err.response?.data?.message || err.message

    // Only redirect to login if 401 on non-auth-check routes
    if (status === 401 && !url.includes('/auth/me')) {
      const savedUser = localStorage.getItem('ks_user')
      if (!savedUser) {
        localStorage.removeItem('ks_token')
        const path = window.location.pathname
        if (!path.endsWith('/login')) {
          window.location.href = path.startsWith('/teacher') ? '/teacher/login' : path.startsWith('/parent') ? '/parent/login' : '/admin/login'
        }
      }
    }

    const normalizedError = new Error(message || 'Request failed')
    normalizedError.status = status
    normalizedError.code = err.code
    return Promise.reject(normalizedError)
  }
)

export default api
