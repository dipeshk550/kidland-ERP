import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

/* ─── Simple in-memory response cache ─────────────────────
   Stores API responses for TTL ms. On revisit, data shows
   instantly from cache while a background refresh runs.
──────────────────────────────────────────────────────────── */
const CACHE     = new Map()
const CACHE_TTL = 5 * 60 * 1000   // 5 minutes

function getCached(key) {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { CACHE.delete(key); return null }
  return entry.data
}
function setCache(key, data) {
  CACHE.set(key, { data, ts: Date.now() })
}

/** Clear all cached entries (call after mutations) */
export function clearCache(urlPrefix) {
  if (!urlPrefix) { CACHE.clear(); return }
  for (const key of CACHE.keys()) {
    if (key.startsWith(urlPrefix)) CACHE.delete(key)
  }
}

function useFetch(url, params = {}, deps = []) {
  const cacheKey  = url + JSON.stringify(params)
  const cached    = getCached(cacheKey)

  // Initialize with cached data so page shows instantly on revisit
  const [data,    setData]    = useState(cached ?? null)
  const [loading, setLoading] = useState(!cached)   // skip spinner if cached
  const [error,   setError]   = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetch = useCallback(async (force = false) => {
    // Return cached instantly unless forced refresh
    const fresh = getCached(cacheKey)
    if (fresh && !force) {
      if (mountedRef.current) { setData(fresh); setLoading(false) }
      return
    }

    if (mountedRef.current) { setLoading(true); setError(null) }
    try {
      const r = await api.get(url, { params })
      setCache(cacheKey, r)
      if (mountedRef.current) setData(r)
    } catch (e) {
      if (mountedRef.current) setError(e.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: () => fetch(true) }
}

export const useNews      = (p = {}) => useFetch('/news',     { status:'published', ...p })
export const useEvents    = (p = {}) => useFetch('/events',   { status:'active',    ...p })
export const useNotices   = (p = {}) => useFetch('/notices',  { status:'published', ...p })
export const useTeachers  = (p = {}) => useFetch('/teachers', { status:'active',    ...p })
export const useAlumni    = (p = {}) => useFetch('/alumni',   { status:'active',    ...p })
export const useGallery   = (p = {}) => useFetch('/gallery',  p)
export const useAdmissions = (p = {}) => useFetch('/admissions', p, [JSON.stringify(p)])
export const useWaMessages = (p = {}) => useFetch('/whatsapp/messages', p, [JSON.stringify(p)])

export function useMutation() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const mutate = useCallback(async (method, url, data) => {
    setLoading(true); setError(null)
    try { return await api[method](url, data) }
    catch (e) { setError(e.message); throw e }
    finally { setLoading(false) }
  }, [])
  return {
    loading, error,
    post: (u, d) => mutate('post', u, d),
    put:  (u, d) => mutate('put',  u, d),
    del:  (u)    => mutate('delete', u),
  }
}

export default useFetch