import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      // Dark mode is an explicit admin-only preference - default to light,
      // never inherit OS/system dark-mode preference (avoids flashing dark on the public site).
      return localStorage.getItem('ks-theme') === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('ks-theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  const toggle = () => setDark(d => !d)

  return (
    <Ctx.Provider value={{ dark, toggle, setDark }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
