import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBook, FaClipboardList, FaChartLine, FaBullhorn, FaUser, FaSignOutAlt, FaPlus } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import TimetableGrid from '../../components/attendance/TimetableGrid'

const payload = response => response?.data ?? response
const date = value => value ? new Date(value).toLocaleDateString() : 'No due date'

export default function TeacherPortal() {
  const { user, logout } = useAuth()
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [notices, setNotices] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ course: '', title: '', instructions: '', dueDate: '', maxMarks: 100, status: 'draft' })
  const [timetable, setTimetable] = useState([])

  const load = async () => {
    setError('')
    try {
      const [courseRes, assignmentRes, quizRes, noticeRes, reportRes] = await Promise.all([
        api.get('/lms/courses?limit=50'),
        api.get('/lms/assignments'),
        api.get('/lms/quizzes'),
        api.get('/notices?status=published&limit=5'),
        api.get('/lms/reports'),
      ])
      setCourses(payload(courseRes) || [])
      setAssignments(payload(assignmentRes) || [])
      setQuizzes(payload(quizRes) || [])
      setNotices(payload(noticeRes) || [])
      setReport(payload(reportRes) || null)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    api.get('/attendance/timetable?status=active')
      .then(response => setTimetable(response.data || []))
      .catch(() => setTimetable([]))
  }, [])

  const createAssignment = async event => {
    event.preventDefault()
    if (!form.course || !form.title.trim()) return toast.error('Choose a course and enter a title')
    setSaving(true)
    try {
      await api.post('/lms/assignments', { ...form, maxMarks: Number(form.maxMarks) })
      toast.success('Assignment saved')
      setShowForm(false)
      setForm({ course: '', title: '', instructions: '', dueDate: '', maxMarks: 100, status: 'draft' })
      await load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return <PortalShell title="Teacher Portal" user={user} logout={logout}>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Stat icon={FaBook} label="My courses" value={courses.length}/>
      <Stat icon={FaClipboardList} label="Assignments" value={assignments.length}/>
      <Stat icon={FaChartLine} label="Exams / quizzes" value={quizzes.length}/>
      <Stat icon={FaUser} label="Profile" value="Active"/>
    </div>
    {error && <div className="card p-4 mb-5 text-sm text-red-600">{error}</div>}
    <div className="mb-6"><TimetableGrid entries={timetable} title="My weekly timetable" compact/></div>
    {loading ? <div className="card p-6 text-gray-500">Loading teaching workspace…</div> : <div className="grid lg:grid-cols-3 gap-5">
      <section className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-lg font-bold">Assignments</h2><button className="btn-primary text-sm" onClick={() => setShowForm(value => !value)}><FaPlus/> New assignment</button></div>
        {showForm && <form onSubmit={createAssignment} className="border rounded-xl p-4 mb-4 space-y-3 bg-slate-50 dark:bg-gray-900">
          <select className="field" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}><option value="">Select course</option>{courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}</select>
          <input className="field" placeholder="Assignment title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
          <textarea className="field" rows="2" placeholder="Instructions (optional)" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}/>
          <div className="grid sm:grid-cols-3 gap-3"><input className="field" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/><input className="field" type="number" min="0" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })}/><select className="field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Publish</option></select></div>
          <button disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save assignment'}</button>
        </form>}
        {!assignments.length ? <p className="text-sm text-gray-500">No assignments yet. Create one for an assigned course.</p> : <div className="space-y-3">{assignments.map(item => <div key={item._id} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><b>{item.title}</b><p className="text-sm text-gray-500">{item.course?.title || 'Course'} · {item.maxMarks ?? 0} marks · due {date(item.dueDate)}</p></div><div className="flex items-center gap-3"><span className="text-xs rounded-full px-2 py-1 bg-slate-100 dark:bg-gray-800">{item.status}</span><Link className="text-sm text-primary-600 hover:underline" to={`/teacher/assignments/${item._id}/submissions`}>Review submissions</Link></div></div>)}</div>}
      </section>
      <div className="space-y-5">
        <section className="card p-5"><h2 className="font-bold mb-3">Exam & marks workspace</h2><p className="text-sm text-gray-500 mb-3">Published quizzes and exam attempts are managed from the LMS.</p>{!quizzes.length ? <p className="text-sm text-gray-400">No exams or quizzes found.</p> : quizzes.slice(0, 5).map(quiz => <div key={quiz._id} className="border-b last:border-0 py-2"><b className="text-sm">{quiz.title}</b><p className="text-xs text-gray-500">{quiz.course?.title || 'Course'} · {quiz.status}</p></div>)}<Link to="/admin/lms/quizzes" className="text-sm text-primary-600 inline-block mt-3">Open exam manager →</Link></section>
        <section className="card p-5"><h2 className="font-bold mb-3">Reports</h2>{report ? <div className="grid grid-cols-2 gap-3 text-sm"><Metric label="Courses" value={report.courses}/><Metric label="Submissions" value={report.submissions}/><Metric label="Quizzes" value={report.quizzes}/><Metric label="Attempts" value={report.attempts}/></div> : <p className="text-sm text-gray-400">No report data.</p>}<Link to="/admin/lms/reports" className="text-sm text-primary-600 inline-block mt-3">View detailed report →</Link></section>
      </div>
      <section className="card p-5 lg:col-span-3"><h2 className="font-bold mb-3 flex items-center gap-2"><FaBullhorn/> School notices</h2>{!notices.length ? <p className="text-sm text-gray-400">No published notices.</p> : <div className="grid md:grid-cols-2 gap-3">{notices.map(notice => <div key={notice._id} className="border rounded-xl p-3"><b>{notice.title}</b><p className="text-sm text-gray-500 mt-1">{notice.desc}</p></div>)}</div>}</section>
    </div>}
  </PortalShell>
}
function Stat({ icon: Icon, label, value }) { return <div className="card p-4 flex items-center gap-3"><Icon className="text-primary-500" size={20}/><div><p className="text-xs text-gray-500">{label}</p><b>{value}</b></div></div> }
function Metric({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><b>{value ?? 0}</b></div> }
export function PortalShell({ title, user, logout, children }) { return <div className="min-h-screen bg-slate-50 dark:bg-gray-950"><header className="bg-slate-900 text-white px-4 sm:px-8 py-4"><div className="max-w-6xl mx-auto flex items-center justify-between"><div><h1 className="font-bold">{title}</h1><p className="text-xs text-slate-400">{user?.name}</p></div><nav className="flex items-center gap-3 text-sm"><Link to="/teacher/attendance" className="hover:text-primary-300">Attendance</Link><Link to="account" className="hover:text-primary-300">Profile</Link><button onClick={logout} title="Log out"><FaSignOutAlt/></button></nav></div></header><main className="max-w-6xl mx-auto p-4 sm:p-8">{children}</main></div> }
