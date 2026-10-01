import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell, FaCheck } from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function NotificationBell() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const load = () => api.get('/notifications', { params: { limit: 20 } }).then(r => { setError(''); setItems(r?.data || []); setUnread(r?.unread || 0) }).catch(e => setError(e.message || 'Unable to load notifications'))
  useEffect(() => {
    load()
    const timer = window.setInterval(load, 60000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const markRead = async item => {
    try {
      if (!item.readAt) { await api.put(`/notifications/${item._id}/read`); setItems(current => current.map(row => row._id === item._id ? { ...row, readAt: new Date().toISOString() } : row)); setUnread(current => Math.max(0, current - 1)) }
      if (item.link) { setOpen(false); navigate(item.link) }
    } catch (e) { toast.error(e.message || 'Unable to mark notification read') }
  }
  return <div className="relative" ref={ref}>
    <button className="relative w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-all" onClick={() => setOpen(current => !current)} aria-label="Notifications">
      <FaBell size={14} />
      {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800"><span className="font-bold text-sm">Notifications</span><span className="text-xs text-gray-400">{unread} unread</span></div>
      <div className="max-h-80 overflow-y-auto">{error ? <div className="p-5 text-center text-xs text-red-500">{error}<button className="block mx-auto mt-2 text-primary-500 underline" onClick={load}>Retry</button></div> : items.length ? items.map(item => <button key={item._id} onClick={() => markRead(item)} className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${!item.readAt ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}><div className="flex gap-2"><div className="flex-1"><div className="text-xs font-bold">{item.title}</div><div className="text-xs text-gray-500 mt-1">{item.message}</div><div className="text-[10px] text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</div></div>{!item.readAt && <FaCheck className="text-primary-500 mt-1" size={10} />}</div></button>) : <div className="p-8 text-center text-sm text-gray-400">No notifications.</div>}</div>
    </div>}
  </div>
}
