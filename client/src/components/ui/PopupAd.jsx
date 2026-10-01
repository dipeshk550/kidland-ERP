import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import { useSettings } from '../../context/SettingsContext'

const SEEN_KEY = 'ks_popup_seen_at'

export default function PopupAd() {
  const { settings, loading } = useSettings()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading) return
    const s = settings || {}
    if (!s.popupEnabled || !s.popupImage) return

    const freqHours = Number(s.popupFrequencyHours) || 24
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0)
    const elapsedHours = (Date.now() - lastSeen) / (1000 * 60 * 60)

    if (elapsedHours >= freqHours) {
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    }
  }, [loading, settings])

  const close = () => {
    setShow(false)
    localStorage.setItem(SEEN_KEY, String(Date.now()))
  }

  if (!settings?.popupEnabled || !settings?.popupImage) return null

  const Wrapper = settings.popupLink ? 'a' : 'div'
  const wrapperProps = settings.popupLink
    ? { href: settings.popupLink, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          style={{ background: 'rgba(10, 22, 40, 0.78)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="relative w-full max-w-md sm:max-w-lg md:max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={close} aria-label="Close"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg transition-all hover:scale-110">
              <FaTimes size={15} />
            </button>
            <Wrapper {...wrapperProps} onClick={settings.popupLink ? close : undefined} className="block">
              <img src={settings.popupImage} alt={settings.popupTitle || 'Kidland School Notice'}
                className="w-full h-auto max-h-[85vh] object-contain bg-white" />
            </Wrapper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
