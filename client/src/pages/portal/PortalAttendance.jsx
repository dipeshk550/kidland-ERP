import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Spinner } from '../../components/ui/index'
import { useAuth } from '../../context/AuthContext'

export default function PortalAttendance() {
  const { user } = useAuth()
  const [records, setRecords] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [summary, setSummary] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [children, setChildren] = useState([])
  const [leave, setLeave] = useState({ student:'', fromDate:'', toDate:'', reason:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isParent = user?.role === 'parent'
  useEffect(() => {
    const requests = [api.get('/attendance/me'), api.get('/attendance/timetable'), api.get('/attendance/leaves'), api.get('/attendance/summary/me')]
    if (isParent) requests.push(api.get('/relationships/children'))
    Promise.all(requests)
      .then(([a, t, l, s, c]) => { setRecords(a.data || []); setTimetable(t.data || []); setLeaves(l.data || []); setSummary(s); setChildren((c?.data || []).map(x => x.student).filter(Boolean)) })
      .catch(e => setError(e.message))
  }, [isParent])
  const submitLeave = async e => {
    e.preventDefault()
    if (!leave.fromDate || !leave.toDate || !leave.reason || (isParent && !leave.student)) return
    setSaving(true)
    try {
      await api.post('/attendance/leaves', leave)
      const result = await api.get('/attendance/leaves')
      setLeaves(result.data || [])
      setLeave({ student:'', fromDate:'', toDate:'', reason:'' })
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!records) return <div className="min-h-[50vh] flex items-center justify-center"><Spinner/></div>
  return <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance & Timetable</h1><p className="text-sm text-gray-500">{isParent ? 'Your children’s attendance, schedule and leave' : 'Your attendance history, schedule and leave'}</p></div>
    <div className="grid md:grid-cols-2 gap-5">
      <div className="card p-5 md:col-span-2"><h2 className="font-bold mb-3">This month</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">{(summary?.data || []).map(item => <div key={item.person?._id || item.person}><div className="text-xs text-gray-500">{item.person?.name || 'Attendance'}</div><b>{item.counts?.present || 0}</b> present · <b>{item.counts?.absent || 0}</b> absent · <b>{item.counts?.late || 0}</b> late</div>)}</div></div>
      <div className="card p-5"><h2 className="font-bold mb-3">Attendance history</h2>{records.length === 0 ? <p className="text-sm text-gray-400">No attendance records yet.</p> : <div className="space-y-2 max-h-96 overflow-auto">{records.map(r => <div key={r._id} className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-2 text-sm"><span>{r.dateKey}{r.period ? ` · Period ${r.period}` : ''}</span><span className="capitalize font-semibold">{r.status}</span></div>)}</div>}</div>
      <div className="card p-5"><h2 className="font-bold mb-3">Timetable</h2>{timetable.length === 0 ? <p className="text-sm text-gray-400">No timetable published.</p> : <div className="space-y-2">{timetable.map(t => <div key={t._id} className="border-b border-gray-100 dark:border-gray-700 py-2 text-sm"><b>{t.subject}</b><div className="text-xs text-gray-500">Day {t.dayOfWeek}, period {t.period}{t.room ? ` · ${t.room}` : ''}</div></div>)}</div>}</div>
    </div>
    <div className="grid md:grid-cols-2 gap-5">
      <div className="card p-5"><h2 className="font-bold mb-3">Request leave</h2><form onSubmit={submitLeave} className="space-y-2">
        {isParent && <select className="field text-sm w-full" value={leave.student} onChange={e => setLeave({...leave,student:e.target.value})} required><option value="">Select child</option>{children.map(child => <option key={child._id} value={child._id}>{child.name}</option>)}</select>}
        <div className="grid grid-cols-2 gap-2"><input type="date" className="field text-sm" value={leave.fromDate} onChange={e=>setLeave({...leave,fromDate:e.target.value})} required/><input type="date" className="field text-sm" value={leave.toDate} onChange={e=>setLeave({...leave,toDate:e.target.value})} required/></div>
        <textarea className="field text-sm w-full" rows="3" placeholder="Reason" value={leave.reason} onChange={e=>setLeave({...leave,reason:e.target.value})} required/>
        <button className="btn-primary text-sm" disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</button>
      </form></div>
      <div className="card p-5"><h2 className="font-bold mb-3">Leave requests</h2>{leaves.length===0?<p className="text-sm text-gray-400">No leave requests.</p>:<div className="space-y-2 max-h-60 overflow-auto">{leaves.map(item=><div key={item._id} className="border-b border-gray-100 dark:border-gray-700 py-2 text-sm"><div className="flex justify-between"><b>{item.applicant?.name || 'Applicant'}</b><span className="capitalize">{item.status}</span></div><div className="text-xs text-gray-500">{new Date(item.fromDate).toLocaleDateString()} – {new Date(item.toDate).toLocaleDateString()} · {item.reason}</div></div>)}</div>}</div>
    </div>
  </div>
}
