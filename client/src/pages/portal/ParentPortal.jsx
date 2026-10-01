import { useEffect, useState } from 'react'
import { FaBook, FaBullhorn, FaChild, FaMoneyBillWave, FaBus, FaCalendarAlt, FaChartLine } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { PortalShell } from './TeacherPortal'

const payload = response => response?.data ?? response
const date = value => value ? new Date(value).toLocaleDateString() : ''

export default function ParentPortal() {
  const { user, logout } = useAuth()
  const [children, setChildren] = useState([])
  const [progress, setProgress] = useState([])
  const [notices, setNotices] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const resultRequest = user?.phone
      ? api.get('/results/parent').catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] })
    Promise.all([
      api.get('/relationships/children'),
      api.get('/lms/progress/children'),
      api.get('/notices?status=published&limit=5'),
      resultRequest,
    ]).then(([childRes, progressRes, noticeRes, resultRes]) => {
      setChildren(payload(childRes) || [])
      setProgress(payload(progressRes) || [])
      setNotices(payload(noticeRes) || [])
      setResults(payload(resultRes) || [])
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [user?.phone])

  return <PortalShell title="Parent Portal" user={user} logout={logout}>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Stat icon={FaChild} label="Linked children" value={children.length}/>
      <Stat icon={FaBook} label="Learning records" value={progress.reduce((sum, child) => sum + child.courses.length, 0)}/>
      <Stat icon={FaChartLine} label="Published results" value={results.length}/>
      <Stat icon={FaCalendarAlt} label="Attendance / timetable" value="School office"/>
    </div>
    {error && <div className="card p-4 mb-5 text-sm text-red-600">{error}</div>}
    {loading ? <div className="card p-6 text-gray-500">Loading family dashboard…</div> : <div className="grid lg:grid-cols-3 gap-5">
      <section className="card p-5 lg:col-span-2"><h2 className="font-bold mb-4">Children</h2>{!children.length ? <p className="text-sm text-gray-500">No active child link is available. Please contact the school office.</p> : <div className="space-y-3">{children.map(link => <div key={link._id} className="border rounded-xl p-4"><b>{link.student?.name}</b><p className="text-sm text-gray-500">{link.student?.grade || 'Grade not set'} · {link.relationship || 'Parent'}</p></div>)}</div>}<div className="mt-5 grid sm:grid-cols-2 gap-3"><InfoCard icon={FaMoneyBillWave} title="Fees" text="Parent fee statements are not exposed by the current ownership-safe fee API."/><InfoCard icon={FaBus} title="Transport" text="Parent transport history is not exposed by the current ownership-safe transport API."/></div></section>
      <section className="card p-5"><h2 className="font-bold mb-4">Notices</h2>{!notices.length ? <p className="text-sm text-gray-400">No published notices.</p> : notices.map(notice => <div className="border-b last:border-0 py-3" key={notice._id}><b className="text-sm">{notice.title}</b><p className="text-xs text-gray-500 mt-1">{notice.desc}</p></div>)}</section>
      <section className="card p-5 lg:col-span-3"><h2 className="font-bold mb-4">Assignments and results</h2>{progress.length ? <div className="grid md:grid-cols-2 gap-4">{progress.map(child => <div className="border rounded-xl p-4" key={child.student?._id}><b>{child.student?.name}</b><p className="text-xs text-gray-500 mt-1">{child.student?.grade || 'Class not set'}</p>{child.courses.map(item => <div className="mt-3 border-t pt-3" key={item.course._id}><p className="font-semibold text-sm">{item.course.title}</p><p className="text-xs text-gray-500">{item.percent}% complete · {item.assignmentResults?.filter(result => result.status !== 'pending').length || 0}/{item.assignmentResults?.length || 0} assignments submitted · {item.quizResults?.length || 0} exam attempts</p>{item.assignmentResults?.length > 0 && <div className="mt-2 space-y-1">{item.assignmentResults.slice(0, 5).map(result => <div className="flex justify-between gap-2 text-xs" key={result.assignment?._id || result._id}><span>{result.assignment?.title || 'Assignment'}</span><span className={result.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}>{result.marks == null ? result.status : `${result.marks}/${result.assignment?.maxMarks ?? '—'}`}</span></div>)}</div>}</div>)}</div>)}</div> : <p className="text-sm text-gray-500">No published learning activity yet.</p>}<div className="mt-5 border-t pt-4">{results.length ? results.slice(0, 5).map(result => <div className="flex flex-wrap justify-between gap-2 py-2 text-sm" key={result._id}><span>{result.examType} · {result.academicYear}</span><b>{result.percentage ?? 0}% {result.division || ''}</b><span className="text-gray-500">{date(result.dateOfIssue)}</span></div>) : <p className="text-sm text-gray-500">{user?.phone ? 'No published result was found for the account phone number.' : 'Add a phone number to the parent profile to view published results.'}</p>}</div></section>
      <section className="card p-5 lg:col-span-3"><h2 className="font-bold mb-3">Attendance and timetable</h2><p className="text-sm text-gray-500">These modules do not currently have parent-scoped API routes. No unverified placeholder data is shown.</p></section>
    </div>}
  </PortalShell>
}
function Stat({ icon: Icon, label, value }) { return <div className="card p-4 flex items-center gap-3"><Icon className="text-primary-500" size={20}/><div><p className="text-xs text-gray-500">{label}</p><b>{value}</b></div></div> }
function InfoCard({ icon: Icon, title, text }) { return <div className="border rounded-xl p-3"><Icon className="text-primary-500 mb-2"/><b className="text-sm">{title}</b><p className="text-xs text-gray-500 mt-1">{text}</p></div> }
