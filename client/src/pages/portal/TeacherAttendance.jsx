import { useEffect, useState } from 'react'
import { FaCalendarCheck, FaSave } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { PortalShell } from './TeacherPortal'
import api from '../../services/api'

const today = () => new Date().toISOString().slice(0, 10)

export default function TeacherAttendance() {
  const { user, logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [selected, setSelected] = useState(null)
  const [date, setDate] = useState(today())
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const loadClasses = async () => {
    try { const response = await api.get('/attendance/teacher/classes'); setClasses(response.data || []) } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { loadClasses() }, [])
  const loadRoster = async (entry = selected, selectedDate = date) => {
    if (!entry) return
    try {
      const response = await api.get(`/attendance/teacher/roster?timetableId=${entry._id}&date=${selectedDate}`)
      setRoster(response.data || [])
    } catch (e) { toast.error(e.message) }
  }
  const choose = entry => { setSelected(entry); loadRoster(entry, date) }
  const setStatus = (student, status) => setRoster(rows => rows.map(row => String(row.student._id) === String(student) ? { ...row, status } : row))
  const save = async () => {
    if (!selected || !roster.length) return toast.error('Select an assigned class with enrolled students')
    setSaving(true)
    try {
      await api.post('/attendance/teacher/batch', {
        academicClass: selected.academicClass._id || selected.academicClass,
        session: selected.session._id || selected.session,
        section: selected.section, subject: selected.subject, period: selected.period, date,
        records: roster.map(row => ({ student: row.student._id, status: row.status, lateMinutes: row.lateMinutes, remarks: row.remarks })),
      })
      toast.success('Class attendance saved')
      loadRoster()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  return <PortalShell title="Teacher Attendance" user={user} logout={logout}>
    <div className="flex items-center justify-between gap-3 mb-5"><div><h2 className="text-2xl font-bold">Class attendance</h2><p className="text-sm text-gray-500">Only classes assigned to you are shown.</p></div><FaCalendarCheck className="text-primary-500 text-2xl"/></div>
    <div className="grid lg:grid-cols-3 gap-5">
      <section className="card p-4"><h3 className="font-bold mb-3">Today / upcoming classes</h3>{loading ? <p className="text-sm text-gray-400">Loading classes…</p> : classes.length === 0 ? <p className="text-sm text-gray-400">No assigned timetable classes.</p> : <div className="space-y-2">{classes.map(entry => <button key={entry._id} onClick={() => choose(entry)} className={`w-full text-left border rounded-xl p-3 ${selected?._id === entry._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}><div className="flex justify-between"><b>{entry.subject}</b><span className="text-[10px] uppercase text-gray-400">{entry.bucket}</span></div><p className="text-xs text-gray-500">{entry.academicClass?.name || 'Class'} · {entry.section} · Period {entry.period}</p></button>)}</div>}</section>
      <section className="card p-4 lg:col-span-2"><div className="flex flex-wrap justify-between gap-3 mb-4"><div><h3 className="font-bold">{selected ? `${selected.subject} · ${selected.section}` : 'Select a class'}</h3><p className="text-xs text-gray-500">{selected ? `Period ${selected.period}` : 'Choose an assigned timetable class'}</p></div><div className="flex gap-2"><input type="date" className="field text-sm" value={date} onChange={e => { setDate(e.target.value); if(selected) loadRoster(selected, e.target.value) }}/><button className="btn-primary text-sm" disabled={saving || !selected} onClick={save}><FaSave className="inline mr-1"/>{saving ? 'Saving…' : 'Save attendance'}</button></div></div>
        {!selected ? <p className="text-sm text-gray-400 py-8 text-center">Select a class to load its enrolled students.</p> : roster.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No active students are enrolled in this class and section.</p> : <div className="space-y-2">{roster.map(row => <div key={row.student._id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3"><div><b className="text-sm">{row.student.name}</b><p className="text-xs text-gray-500">{row.student.email || 'Student'}{row.approvedLeave ? ' · approved leave' : ''}</p></div><div className="flex gap-1">{['present','absent','late','leave'].map(status => <button key={status} disabled={row.approvedLeave} onClick={() => setStatus(row.student._id, status)} className={`px-2 py-1 rounded text-[11px] capitalize ${row.status === status ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{status}</button>)}</div></div>)}</div>}
      </section>
    </div>
  </PortalShell>
}
