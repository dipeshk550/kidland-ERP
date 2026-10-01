import { useEffect, useMemo, useState } from 'react'
import { FaChalkboardTeacher, FaUsers, FaSyncAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../services/api'
import TimetableGrid from '../../components/attendance/TimetableGrid'

export default function TimetablePage() {
  const [entries, setEntries] = useState([])
  const [setup, setSetup] = useState({ classes: [], teachers: [] })
  const [mode, setMode] = useState('class')
  const [selected, setSelected] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const dateQuery = date ? `&date=${encodeURIComponent(date)}` : ''
      const [timetable, context] = await Promise.all([api.get(`/attendance/timetable?status=active${dateQuery}`), api.get('/attendance/setup')])
      setEntries(timetable.data || [])
      setSetup(context.data || { classes: [], teachers: [] })
    } catch (error) { toast.error(error.message || 'Could not load timetable') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const options = mode === 'class' ? setup.classes : setup.teachers
  const visible = useMemo(() => {
    if (!selected) return entries
    const field = mode === 'class' ? 'academicClass' : 'teacher'
    return entries.filter(item => String(item[field]?._id || item[field]) === selected)
  }, [entries, mode, selected])
  const classGroups = rows => [...new Set(rows.map(item => item.section || 'Unsectioned'))]
    .map(section => ({ section, entries: rows.filter(item => (item.section || 'Unsectioned') === section) }))

  const renderGroup = (option, rows) => {
    if (mode === 'teacher') return <TimetableGrid key={option?._id || 'teacher'} entries={rows} title={`${option?.name || 'Teacher'}${option?.email ? ` · ${option.email}` : ''}`} />
    return <div key={option?._id || 'class'} className="space-y-3">
      {classGroups(rows).map(group => <TimetableGrid key={`${option?._id}-${group.section}`} entries={group.entries} title={`${option?.name || 'Class'} · Section ${group.section}`} />)}
    </div>
  }

  return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl md:text-2xl font-bold">Timetable</h1><p className="text-sm text-gray-500 mt-1">Review every subject teacher’s routine by class or by teacher.</p></div>
      <button className="btn-ghost text-xs" onClick={load}><FaSyncAlt className="inline mr-1"/> Refresh</button>
    </div>
    <div className="card p-4 flex flex-wrap gap-3 items-center">
      <div className="flex rounded-lg bg-slate-100 dark:bg-gray-800 p-1">
        <button onClick={() => { setMode('class'); setSelected('') }} className={`px-4 py-2 rounded-md text-sm ${mode === 'class' ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'text-gray-500'}`}><FaUsers className="inline mr-2"/>By class</button>
        <button onClick={() => { setMode('teacher'); setSelected('') }} className={`px-4 py-2 rounded-md text-sm ${mode === 'teacher' ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'text-gray-500'}`}><FaChalkboardTeacher className="inline mr-2"/>By teacher</button>
      </div>
      <select className="field max-w-xs" value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">All {mode === 'class' ? 'classes' : 'teachers'}</option>
        {options.map(item => <option key={item._id} value={item._id}>{item.name}{item.email ? ` · ${item.email}` : ''}</option>)}
      </select>
      <label className="block"><span className="label text-xs">Routine date</span><input type="date" className="field text-sm" value={date} onChange={event => setDate(event.target.value)}/></label>
      <span className="text-xs text-gray-400 ml-auto">{visible.length} assigned periods</span>
    </div>
    {loading ? <div className="card p-12 text-center text-gray-400">Loading weekly routine…</div> : selected
      ? mode === 'teacher'
        ? <TimetableGrid entries={visible} title="Teacher routine" />
        : <div className="space-y-3">{classGroups(visible).map(group => <TimetableGrid key={group.section} entries={group.entries} title={`Class routine · Section ${group.section}`} />)}</div>
      : options.length
        ? <div className="space-y-5">{options.map(option => {
          const field = mode === 'class' ? 'academicClass' : 'teacher'
          const group = entries.filter(item => String(item[field]?._id || item[field]) === String(option._id))
          return renderGroup(option, group)
        })}</div>
        : <div className="card p-12 text-center text-gray-400">No {mode === 'class' ? 'classes' : 'teachers'} are available.</div>}
  </div>
}
