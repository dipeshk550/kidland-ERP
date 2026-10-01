import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBook, FaChalkboardTeacher, FaClipboardList, FaLayerGroup, FaInbox, FaTasks, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa'
import api from '../../../services/api'

const cards = [
  { key: 'totalCourses', label: 'Total Courses', icon: FaBook, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'publishedCourses', label: 'Published Courses', icon: FaChalkboardTeacher, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { key: 'totalLessons', label: 'Lessons & Modules', icon: FaLayerGroup, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'draftCourses', label: 'Draft Courses', icon: FaClipboardList, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'totalAssignments', label: 'Assignments', icon: FaTasks, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { key: 'totalSubmissions', label: 'Submissions', icon: FaCheckCircle, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { key: 'totalQuizzes', label: 'Quizzes', icon: FaQuestionCircle, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
]

export default function LMSDashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/lms/summary').then(r => setSummary(r?.data || {})).catch(e => setError(e.message))
  }, [])
  const courses = summary?.recentCourses || []
  const assignments = summary?.recentAssignments || []

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Learning Management</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Build and organize digital learning content.</p></div>
        <Link to="/admin/lms/courses" className="btn-primary">Manage Courses</Link>
      </div>
      {error && <div className="card p-4 text-sm text-red-500">{error}</div>}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {cards.map(({ key, label, icon: Icon, color, bg }) => (
          <div className="card p-4" key={key}><div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`text-lg ${color}`} /></div><div className="text-2xl font-bold text-gray-900 dark:text-white">{summary ? (summary[key] ?? 0) : '—'}</div><div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-gray-900 dark:text-white">Recent Courses</h2><Link to="/admin/lms/courses" className="text-xs text-primary-500 font-semibold">View all</Link></div>
          {courses.length ? <div className="space-y-3">{courses.map(course => <div key={course._id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"><div><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{course.title}</p><p className="text-xs text-gray-400">{course.instructor?.name || 'Unassigned'} · {course.code || 'No code'}</p></div><span className={course.status === 'published' ? 'badge-green' : 'badge-gray'}>{course.status}</span></div>)}</div> : <Empty text="No courses created yet." />}
        </section>
        <section className="card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-bold text-gray-900 dark:text-white">Recent Assignments</h2><Link to="/admin/lms/assignments" className="text-xs text-primary-500 font-semibold">View all</Link></div>{assignments.length ? <div className="space-y-3">{assignments.map(item => <div key={item._id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"><div><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</p><p className="text-xs text-gray-400">{item.course?.title || 'Course'} · {item.maxMarks} marks</p></div><span className={item.status === 'published' ? 'badge-green' : item.status === 'closed' ? 'badge-gray' : 'badge-yellow'}>{item.status}</span></div>)}</div> : <Empty text="No assignments created yet." />}</section>
      </div>
    </div>
  )
}

function Empty({ text }) { return <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-400 text-sm"><FaInbox className="opacity-40" size={24} /><span>{text}</span></div> }
