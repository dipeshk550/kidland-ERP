import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWhatsapp, FaTimes, FaPaperPlane } from 'react-icons/fa'
import api from '../../services/api'

const WA = '9779841404920'
const QUICK = [
  'Admission inquiry for 2083 B.S.',
  'Fee structure information',
  'School facilities & programs',
  'Contact the principal',
]

export default function WhatsAppChat() {
  const [open, setOpen] = useState(false)
  const [msg,  setMsg]  = useState('')
  const [sent, setSent] = useState(false)
  const [pulse,setPulse]= useState(true)
  useEffect(() => { const t = setTimeout(() => setPulse(false), 6000); return () => clearTimeout(t) }, [])

  const send = async (text) => {
    const m = text || msg
    if (!m.trim()) return
    try { await api.post('/whatsapp/messages', { message: m }) } catch {}
    window.open(`https://api.whatsapp.com/send?phone=${WA}&text=${encodeURIComponent(m)}`, '_blank')
    setSent(true); setMsg('')
    setTimeout(() => { setSent(false); setOpen(false) }, 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:16,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12,scale:0.95}}
            transition={{duration:0.22}} className="w-80 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between" style={{background:'#25D366'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FaWhatsapp size={22} className="text-white"/>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Kidland School</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                    <span className="text-white/80 text-xs">Online now</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
                <FaTimes size={13} className="text-white"/>
              </button>
            </div>
            {/* Greeting */}
            <div className="p-4" style={{background:'#f0f0f0'}}>
              <div className="bg-white rounded-xl rounded-tl-sm p-3.5 shadow-sm max-w-[85%]">
                <p className="text-sm text-gray-700 leading-relaxed">👋 Hi! Welcome to <strong>Kidland School</strong>.<br/>How can we help you today?</p>
                <p className="text-[10px] text-gray-400 mt-1.5 text-right">{new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
            </div>
            {/* Quick replies */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Quick Questions</p>
              <div className="flex flex-col gap-2">
                {QUICK.map((r,i) => (
                  <button key={i} onClick={() => send(r)}
                    className="text-left text-xs font-medium px-3 py-2 rounded-lg border transition-all hover:-translate-y-0.5"
                    style={{borderColor:'#25D366',color:'#075E54',background:'#f0fde8'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {/* Input */}
            {sent ? (
              <div className="p-4 text-center text-sm font-semibold" style={{color:'#25D366'}}>✓ Opening WhatsApp…</div>
            ) : (
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
                  placeholder="Type a message…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-[#25D366] transition-colors"/>
                <button onClick={() => send()} className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform" style={{background:'#25D366'}}>
                  <FaPaperPlane size={13}/>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — bottom right */}
      <motion.button onClick={() => setOpen(o => !o)} whileHover={{scale:1.08}} whileTap={{scale:0.95}}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative"
        style={{background:'#25D366',boxShadow:'0 8px 32px rgba(37,211,102,0.45)'}}>
        <AnimatePresence mode="wait">
          <motion.div key={open?'x':'wa'} initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:0.15}}>
            {open ? <FaTimes size={22} className="text-white"/> : <FaWhatsapp size={26} className="text-white"/>}
          </motion.div>
        </AnimatePresence>
        {pulse && !open && <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{background:'#25D366'}}/>}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center"><span className="text-[8px] font-black text-white">1</span></span>}
      </motion.button>
    </div>
  )
}
