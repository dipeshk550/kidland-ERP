import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaCalendarCheck, FaDownload, FaSyncAlt, FaTrash, FaEdit } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'

const today = () => new Date().toISOString().slice(0, 10)
const statuses = ['present', 'absent', 'late', 'leave']
const blankEntry = { academicClass:'', section:'', session:'', date:'', dayOfWeek:1, period:1, subject:'', teacher:'', startsAt:'', endsAt:'', room:'' }
const PERIODS = Array.from({ length: 20 }, (_, index) => index + 1)
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const blankRule = { name:'', lateAfterMinutes:10, autoLockAfterHours:24, notifyParentOnAbsence:false }
const Card = ({ children, className='' }) => <div className={`card p-4 ${className}`}>{children}</div>

export default function AttendanceManagement() {
  const [tab, setTab] = useState('take')
  const [date, setDate] = useState(today()), [classes, setClasses] = useState([])
  const [selected, setSelected] = useState(null), [roster, setRoster] = useState([])
  const [records, setRecords] = useState([]), [dashboard, setDashboard] = useState(null)
  const [setup, setSetup] = useState({ classes:[], sessions:[], teachers:[], subjects:[], currentSession:null })
  const [leaves, setLeaves] = useState([]), [rules, setRules] = useState([])
  const [report, setReport] = useState(null), [loading, setLoading] = useState(true)
  const [reportClass, setReportClass] = useState(''), [reportStatus, setReportStatus] = useState('')
  const [entry, setEntry] = useState(blankEntry), [rule, setRule] = useState(blankRule)
  const [override, setOverride] = useState({ entry:'', date:today(), substituteTeacher:'', room:'', reason:'' })
  const [range, setRange] = useState({ from:today(), to:today() })
  const [teacherOverview, setTeacherOverview] = useState(null)
  const [teacherReport, setTeacherReport] = useState(null)
  const [teacherReportPeriod, setTeacherReportPeriod] = useState('daily')

  const load = async () => {
    setLoading(true)
    try {
      const [c,d,r,l,ru,s] = await Promise.all([
        api.get('/attendance/timetable?status=active'), api.get(`/attendance/dashboard?date=${date}`),
        api.get(`/attendance/records?date=${date}&limit=500`), api.get('/attendance/leaves?status=pending'), api.get('/attendance/rules'),
        api.get('/attendance/setup'),
      ])
      setClasses(c.data || []); setDashboard(d); setRecords(r.data || []); setLeaves(l.data || []); setRules(ru.data || [])
      const rawSetup = s.data || {}
      const timetableSubjects = (c.data || []).map(item => item.subject).filter(Boolean)
      const subjects = [...new Set([
        ...(Array.isArray(rawSetup.subjects) ? rawSetup.subjects : []),
        ...timetableSubjects,
      ])].sort()
      const nextSetup = {
        classes: Array.isArray(rawSetup.classes) ? rawSetup.classes : [],
        sessions: Array.isArray(rawSetup.sessions) ? rawSetup.sessions : [],
        teachers: Array.isArray(rawSetup.teachers) ? rawSetup.teachers : [],
        subjects,
        currentSession: rawSetup.currentSession || null,
      }
      setSetup(nextSetup)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])
  const loadTeacherOverview = async () => {
    try {
      const response = await api.get(`/attendance/teacher/overview?date=${date}`)
      setTeacherOverview(response)
    } catch (e) { toast.error(e.message) }
  }
  useEffect(() => {
    if (tab === 'teacher') loadTeacherOverview()
  }, [tab, date])
  const choose = async item => {
    setSelected(item)
    try { const r = await api.get(`/attendance/teacher/roster?timetableId=${item._id}&date=${date}`); setRoster(r.data || []) }
    catch (e) { toast.error(e.message) }
  }
  const setStatus = (id, status) => setRoster(rows => rows.map(row => String(row.student._id) === String(id) ? { ...row, status } : row))
  const markAll = status => setRoster(rows => rows.map(row => row.approvedLeave ? row : { ...row, status }))
  const saveBatch = async () => {
    if (!selected) return toast.error('Select a timetable class')
    try {
      await api.post('/attendance/teacher/batch', {
        timetableId:selected._id, academicClass:selected.academicClass._id || selected.academicClass,
        session:selected.session._id || selected.session, section:selected.section, subject:selected.subject,
        period:selected.period, date, records:roster.map(row => ({ student:row.student._id, status:row.status })),
      })
      toast.success('Attendance saved'); choose(selected)
    } catch (e) { toast.error(e.message) }
  }
  const saveEntry = async e => {
    e.preventDefault()
    if (!entry.academicClass || !entry.section || !entry.teacher || !entry.subject || !entry.session || !entry.date)
      return toast.error('Class, section, session, teacher and subject are required')
    if (!entry.startsAt || !entry.endsAt) return toast.error('Select a period time slot')
    try {
      await api.post('/attendance/timetable', {...entry, dayOfWeek:Number(entry.dayOfWeek), period:Number(entry.period)})
      toast.success(entry._id ? 'Timetable updated' : 'Timetable saved')
      setEntry(blankEntry); load()
    } catch(e) { toast.error(e.message) }
  }
  const deleteEntry = async id => { if (!confirm('Cancel this timetable entry?')) return; try { await api.delete(`/attendance/timetable/${id}`); load() } catch(e) { toast.error(e.message) } }
  const saveOverride = async e => { e.preventDefault(); try { await api.post(`/attendance/timetable/${override.entry}/override`, override); toast.success('Override saved') } catch(e) { toast.error(e.message) } }
  const saveRule = async e => { e.preventDefault(); try { await api.post('/attendance/rules', {...rule, lateAfterMinutes:Number(rule.lateAfterMinutes), autoLockAfterHours:Number(rule.autoLockAfterHours)}); setRule(blankRule); load(); toast.success('Rule saved') } catch(e) { toast.error(e.message) } }
  const runReport = async e => { e.preventDefault(); try { const params = new URLSearchParams({ from:range.from, to:range.to }); if (reportClass) params.set('academicClass', reportClass); if (reportStatus) params.set('status', reportStatus); setReport(await api.get(`/attendance/reports?${params.toString()}`)) } catch(e) { toast.error(e.message) } }
  const runTeacherReport = async period => {
    try {
      const params = new URLSearchParams()
      if (period === 'daily') params.set('date', date)
      if (period === 'weekly') { params.set('from', range.from); params.set('to', range.to) }
      if (period === 'monthly') {
        const selectedDate = new Date(`${date}T00:00:00`)
        params.set('month', String(selectedDate.getMonth() + 1))
        params.set('year', String(selectedDate.getFullYear()))
      }
      setTeacherReport(await api.get(`/attendance/teacher/attendance/${period}?${params.toString()}`))
      setTeacherReportPeriod(period)
    } catch (e) { toast.error(e.message) }
  }
  const saveTeacherStatus = async (teacherId, status) => {
    try {
      await api.post('/attendance/records', { person:teacherId, personType:'teacher', date, status, mode:'daily' })
      toast.success('Teacher attendance updated')
      loadTeacherOverview()
    } catch (e) { toast.error(e.message) }
  }
  const exportReport = () => { if (!report?.data?.length) return toast.error('Run a report first'); const csv = ['date,status,count', ...report.data.map(row => `${row._id.date},${row._id.status},${row.count}`)].join('\n'); const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); const a = document.createElement('a'); a.href=url; a.download=`attendance-${range.from}-${range.to}.csv`; a.click(); URL.revokeObjectURL(url) }
  const counts = dashboard?.counts || {}
  return <div className="p-4 md:p-6 max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-5"><div className="flex gap-3 items-center"><FaCalendarCheck className="text-green-600 text-2xl"/><div><h1 className="text-xl font-bold dark:text-white">Attendance & Timetable</h1><p className="text-xs text-gray-400">Class-based attendance workspace</p></div></div><button className="btn-ghost text-xs" onClick={load}><FaSyncAlt className="inline mr-1"/>Refresh</button></div>
    <div className="flex gap-2 border-b mb-5 overflow-auto">{['take','teacher','timetable','rules','reports','leaves'].map(item => <button key={item} onClick={() => setTab(item)} className={`px-4 py-2 text-sm capitalize border-b-2 whitespace-nowrap ${tab === item ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'}`}>{item === 'take' ? 'Take attendance' : item === 'teacher' ? 'Teacher overview' : item}</button>)}</div>
    {tab === 'take' && <div className="grid lg:grid-cols-3 gap-5"><Card><div className="flex justify-between mb-3"><h2 className="font-bold">Classes</h2><input type="date" className="field text-xs w-36" value={date} onChange={e => setDate(e.target.value)}/></div>{loading ? <Spinner/> : classes.length === 0 ? <p className="text-sm text-gray-400">No timetable classes.</p> : <div className="space-y-2">{classes.map(item => <button key={item._id} onClick={() => choose(item)} className={`w-full text-left border rounded-xl p-3 ${selected?._id === item._id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'dark:border-gray-700'}`}><b>{item.subject}</b><p className="text-xs text-gray-500">{item.academicClass?.name} · {item.section} · Period {item.period}</p></button>)}</div>}</Card><Card className="lg:col-span-2"><div className="flex justify-between mb-3"><div><h2 className="font-bold">{selected ? `${selected.subject} · ${selected.section}` : 'Select a class'}</h2><p className="text-xs text-gray-500">New rows default to present</p></div>{selected && <div className="flex gap-2"><button className="btn-ghost text-xs" onClick={() => markAll('present')}>Mark all present</button><button className="btn-ghost text-xs" onClick={() => markAll('absent')}>Reset absent</button><button className="btn-primary text-sm" onClick={saveBatch}>Save attendance</button></div>}</div>{!selected ? <p className="text-sm text-gray-400 py-8 text-center">Select an active timetable class.</p> : roster.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No active enrolled students.</p> : <div className="space-y-2">{roster.map(row => <div key={row.student._id} className="flex justify-between items-center border-b py-2"><span className="text-sm font-semibold">{row.student.name}{row.approvedLeave && <small className="text-blue-500 ml-2">approved leave</small>}</span><div className="flex gap-1">{statuses.map(status => <button disabled={row.approvedLeave} key={status} onClick={() => setStatus(row.student._id, status)} className={`px-2 py-1 rounded text-[11px] capitalize ${row.status === status ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{status}</button>)}</div></div>)}</div>}</Card><Card><h2 className="font-bold mb-2">Today summary</h2><div className="text-sm space-y-1"><div>Total {dashboard?.total || 0}</div><div className="text-green-600">Present {counts.present || 0}</div><div className="text-red-500">Absent {counts.absent || 0}</div><div className="text-amber-500">Late {counts.late || 0}</div><div className="text-blue-500">Leave {counts.leave || 0}</div></div></Card></div>}
    {tab === 'teacher' && <div className="space-y-5"><Card><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 className="font-bold">Daily teacher attendance</h2><p className="text-xs text-gray-500">Assigned periods and free periods for {date}</p></div><input type="date" className="field text-sm" value={date} onChange={e => setDate(e.target.value)}/></div>{!teacherOverview ? <Spinner/> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-gray-500"><th className="py-2">Teacher</th><th>Assigned periods</th><th>Classes / subjects</th><th>Attendance</th><th>Action</th></tr></thead><tbody>{setup.teachers.map(teacher => { const teacherId=String(teacher._id); const entries=(teacherOverview.schedule||[]).filter(item=>String(item.teacher?._id||item.teacher)===teacherId); const record=teacherOverview.attendance?.find(item=>String(item.person?._id||item.person)===teacherId); return <tr key={teacher._id} className="border-b align-top"><td className="py-3 font-semibold">{teacher.name}<div className="text-xs text-gray-400">{teacher.email}</div></td><td className="py-3">{entries.length ? entries.map(item=><div key={item._id} className="text-xs mb-1">P{item.period} {item.startsAt && `· ${item.startsAt}-${item.endsAt}`}</div>) : <span className="text-xs text-gray-400">Free all day</span>}</td><td className="py-3">{entries.length ? entries.map(item=><div key={item._id} className="text-xs mb-1">{item.academicClass?.name} · {item.section} · {item.subject}</div>) : <span className="text-xs text-gray-400">No assigned class</span>}</td><td className="py-3"><span className={`px-2 py-1 rounded-full text-xs capitalize ${record?.status === 'present' ? 'bg-green-100 text-green-700' : record?.status === 'absent' ? 'bg-red-100 text-red-700' : record?.status === 'late' ? 'bg-amber-100 text-amber-700' : record?.status === 'leave' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{record?.status || 'pending'}</span></td><td className="py-3"><div className="flex flex-wrap gap-1">{statuses.map(status=><button key={status} className="px-2 py-1 rounded bg-gray-100 hover:bg-green-100 text-[11px] capitalize" onClick={() => saveTeacherStatus(teacher._id, status)}>{status}</button>)}</div></td></tr> })}</tbody></table></div>}</Card><Card><div className="flex flex-wrap items-center justify-between gap-3 mb-3"><div><h2 className="font-bold">Teacher attendance reports</h2><p className="text-xs text-gray-500">Daily, weekly, and monthly summaries</p></div><div className="flex gap-2">{['daily','weekly','monthly'].map(period=><button key={period} className={`btn-ghost text-xs ${teacherReportPeriod===period?'text-green-600':''}`} onClick={() => runTeacherReport(period)}>{period}</button>)}</div></div>{teacherReport?.data?.length ? <div className="space-y-2">{teacherReport.data.map(row=><div key={String(row.teacher?._id||row.teacher)} className="flex justify-between border-b py-2 text-sm"><span className="font-semibold">{row.teacher?.name || 'Teacher'}</span><span>Present {row.counts?.present||0} · Absent {row.counts?.absent||0} · Late {row.counts?.late||0} · Leave {row.counts?.leave||0}</span></div>)}</div> : <p className="text-sm text-gray-400">Choose a report period to load teacher attendance.</p>}</Card></div>}
    {tab === 'timetable' && <Card><div className="flex flex-wrap items-start justify-between gap-3 mb-3"><div><h2 className="font-bold">{entry._id ? 'Edit timetable entry' : 'Timetable builder'}</h2><p className="text-xs text-gray-500">Create the teacher routine first, then assign each subject to a class and section.</p></div><Link to="/admin/users" className="btn-ghost text-xs">Add teacher account</Link></div>{(!setup.classes.length || !setup.sessions.length || !setup.teachers.length) && <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{!setup.classes.length && 'Create academic classes and sections. '}{!setup.sessions.length && 'Create an academic session. '}{!setup.teachers.length && 'Create an active user with the Teacher role in User Management.'}<div className="mt-1 flex gap-3 text-xs underline"><Link to="/admin/lms/academic">Open academic setup</Link><Link to="/admin/users">Open user management</Link></div></div>}<form onSubmit={saveEntry} className="grid md:grid-cols-4 gap-2 mb-5"><select className="field text-sm" value={entry.academicClass} onChange={e=>setEntry({...entry,academicClass:e.target.value,section:''})} required><option value="">Academic class</option>{setup.classes.map(item=><option key={item._id} value={item._id}>{item.name}</option>)}</select>{(setup.classes.find(item=>String(item._id)===String(entry.academicClass))?.sections || []).length ? <select className="field text-sm" value={entry.section} onChange={e=>setEntry({...entry,section:e.target.value})} required disabled={!entry.academicClass}><option value="">Section</option>{(setup.classes.find(item=>String(item._id)===String(entry.academicClass))?.sections || []).map(section=><option key={section} value={section}>{section}</option>)}</select> : <input className="field text-sm" placeholder={entry.academicClass ? 'Section (e.g. A)' : 'Select class first'} value={entry.section} onChange={e=>setEntry({...entry,section:e.target.value})} required disabled={!entry.academicClass}/>}    <select className="field text-sm" value={entry.session} onChange={e=>setEntry({...entry,session:e.target.value})} required><option value="">Select academic session</option>{setup.sessions.map(item=><option key={item._id} value={item._id}>{item.name}</option>)}</select><select className="field text-sm" value={entry.teacher} onChange={e=>setEntry({...entry,teacher:e.target.value})} required><option value="">Subject teacher account</option>{setup.teachers.map(item=><option key={item._id} value={item._id}>{item.name} · {item.email}</option>)}</select><input className="field text-sm" placeholder="Room (optional)" value={entry.room} onChange={e => setEntry({...entry,room:e.target.value})}/><select className="field text-sm" value={entry.dayOfWeek} onChange={e=>setEntry({...entry,dayOfWeek:e.target.value})}>{DAYS.map((day,index)=><option key={day} value={index}>{day}</option>)}</select>                <label className="block"><span className="label text-xs">Routine date</span><input type="date" className="field text-sm" value={entry.date || ''} onChange={e=>setEntry({...entry,date:e.target.value,dayOfWeek:new Date(`${e.target.value}T00:00:00`).getDay()})} required/></label><select className="field text-sm" value={entry.period} onChange={e=>setEntry({...entry,period:e.target.value})} required><option value="">Period number</option>{PERIODS.map(period=><option key={period} value={period}>Period {period}</option>)}</select><label className="block"><span className="label text-xs">Start time</span><input type="time" className="field text-sm" value={entry.startsAt} onChange={e=>setEntry({...entry,startsAt:e.target.value})} required/></label><label className="block"><span className="label text-xs">End time</span><input type="time" className="field text-sm" value={entry.endsAt} onChange={e=>setEntry({...entry,endsAt:e.target.value})} required/></label><select className="field text-sm" value={entry.subject} onChange={e=>setEntry({...entry,subject:e.target.value})} required><option value="">Subject</option>{setup.subjects.map(subject=><option key={subject} value={subject}>{subject}</option>)}</select><button className="btn-primary text-sm" disabled={!setup.classes.length || !setup.teachers.length || !setup.subjects.length}>{entry._id ? 'Update timetable entry' : 'Create timetable entry'}</button>{entry._id&&<button type="button" className="btn-ghost text-sm" onClick={()=>setEntry(blankEntry)}>Cancel edit</button>}</form><div className="space-y-2">{classes.map(item => <div className="border-t py-2 flex justify-between text-sm" key={item._id}><span><b>{DAYS[item.dayOfWeek] || "Day"} ? P{item.period}</b> ? {item.startsAt && `${item.startsAt}?${item.endsAt}`} ? {item.academicClass?.name} ? {item.section} ? {item.subject}<small className="block text-gray-500">{item.teacher?.name || "Teacher account"}{item.room ? ` ? Room ${item.room}` : ""}</small></span><span className="flex gap-3"><button className="text-blue-500" onClick={()=>    setEntry({...item,date:item.date ? new Date(item.date).toISOString().slice(0,10) : '',academicClass:item.academicClass?._id||item.academicClass,session:item.session?._id||item.session,teacher:item.teacher?._id||item.teacher})}><FaEdit/></button><button className="text-red-500" onClick={() => deleteEntry(item._id)}><FaTrash/></button></span></div>)}</div><form onSubmit={saveOverride} className="grid md:grid-cols-5 gap-2 mt-5 border-t pt-4"><select className="field text-sm" value={override.entry} onChange={e => setOverride({...override,entry:e.target.value})}><option value="">Entry</option>{classes.map(item => <option key={item._id} value={item._id}>{item.subject} · {item.section} · P{item.period}</option>)}</select><input type="date" className="field text-sm" value={override.date} onChange={e =>setOverride({...override,date:e.target.value})}/><select className="field text-sm" value={override.substituteTeacher} onChange={e=>setOverride({...override,substituteTeacher:e.target.value})}><option value="">Substitute teacher</option>{setup.teachers.map(item=><option key={item._id} value={item._id}>{item.name}</option>)}</select><input className="field text-sm" placeholder="Reason" value={override.reason} onChange={e=>setOverride({...override,reason:e.target.value})} required/><button className="btn-primary text-sm" disabled={!override.entry}>Save override</button></form></Card>}
    {tab === 'rules' && <Card><h2 className="font-bold mb-3">Attendance rules</h2><form onSubmit={saveRule} className="grid md:grid-cols-5 gap-2"><input className="field" placeholder="Rule name" value={rule.name} onChange={e => setRule({...rule,name:e.target.value})} required/><input className="field" type="number" min="0" placeholder="Late after minutes" value={rule.lateAfterMinutes} onChange={e => setRule({...rule,lateAfterMinutes:e.target.value})}/><input className="field" type="number" min="0" placeholder="Auto-lock hours" value={rule.autoLockAfterHours} onChange={e => setRule({...rule,autoLockAfterHours:e.target.value})}/><label className="text-xs flex gap-2 items-center"><input type="checkbox" checked={rule.notifyParentOnAbsence} onChange={e => setRule({...rule,notifyParentOnAbsence:e.target.checked})}/>Notify parents</label><button className="btn-primary">Create rule</button></form>{rules.map(item => <div className="border-t py-2 text-sm mt-3" key={item._id}>{item.name} · late after {item.lateAfterMinutes} minutes</div>)}</Card>}
    {tab === 'reports' && <Card><div className="flex justify-between mb-4"><h2 className="font-bold">Attendance report</h2><button className="btn-ghost text-xs" onClick={exportReport}><FaDownload className="inline mr-1"/>CSV</button></div><form onSubmit={runReport} className="flex flex-wrap gap-2 mb-4"><input type="date" className="field" value={range.from} onChange={e => setRange({...range,from:e.target.value})}/><input type="date" className="field" value={range.to} onChange={e => setRange({...range,to:e.target.value})}/><select className="field" value={reportClass} onChange={e=>setReportClass(e.target.value)}><option value="">All classes</option>{setup.classes.map(item=><option key={item._id} value={item._id}>{item.name}</option>)}</select><select className="field" value={reportStatus} onChange={e=>setReportStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(item=><option key={item} value={item}>{item}</option>)}</select><button className="btn-primary">Run report</button></form>{report?.data?.map((item,index) => <div className="border-t py-2 text-sm" key={index}>{item._id.date} · {item._id.status} · {item.count}</div>)}</Card>}
    {tab === 'leaves' && <Card><h2 className="font-bold mb-3">Pending leave requests</h2>{leaves.map(item => <div className="border-b py-2 text-sm flex justify-between" key={item._id}><span>{item.applicant?.name} · {item.reason}</span><span className="text-gray-500">{item.status}</span></div>)}</Card>}
  </div>
}
