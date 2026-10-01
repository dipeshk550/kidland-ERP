import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LOGO from '../../assets/logo.js'

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    // Only show once per session
    return !sessionStorage.getItem('kidland_splash_shown')
  })

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('kidland_splash_shown', '1')
    }, 2200)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#0a1628' }}>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}>
            <img src={LOGO} alt="Kidland School" className="h-28 w-auto object-contain drop-shadow-2xl"/>
          </motion.div>

          {/* School name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="mt-5 text-center">
            <div className="text-white font-black text-2xl tracking-tight">Kidland School</div>
            <div className="text-xs font-bold tracking-[0.25em] uppercase mt-1" style={{ color: '#54B435' }}>
              Duty · Honor · Country
            </div>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 w-48 h-1 rounded-full overflow-hidden bg-white/10">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.5, duration: 1.4, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #54B435, #86ef67)' }}/>
          </motion.div>

          {/* Est. text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-xs text-white/30 tracking-widest uppercase">
            Est. 2005 · Kusunti, Lalitpur
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
