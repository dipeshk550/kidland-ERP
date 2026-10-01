import { useEffect, useState } from 'react'
import api from '../../../services/api'

const empty = { courses: 0, publishedCourses: 0, assignments: 0, submissions: 0, quizzes: 0, attempts: 0 }
const labels = [['courses', 'Courses'], ['publishedCourses', 'Published courses'], ['assignments', 'Assignments'], ['submissions', 'Submissions'], ['quizzes', 'Quizzes'], ['attempts', 'Quiz attempts']]

export default function LMSReports() {
  const [data, setData] = useState(null), [courses, setCourses] = useState([]), [students, setStudents] = useState([]), [studentDetails, setStudentDetails] = useState([]), [filters, setFilters] = useState({ course: '', status: '', student: '' }), [loading, setLoading] = useState(true), [detailLoading, setDetailLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => { Promise.all([api.get('/lms/courses', { params: { limit: 100 } }), api.get('/users')]).then(([courseResponse, userResponse]) => { setCourses(courseResponse?.data || []); setStudents((userResponse?.data || []).filter(user => user.role === 'student')) }).catch(e => setError(e.message || 'Unable to load report options')) }, [])
  useEffect(() => {
    setLoading(true); setError('')
    api.get('/lms/reports', { params: filters }).then(r => setData({ ...empty, ...(r?.data || {}) })).catch(e => setError(e.message || 'Unable to load report')).finally(() => setLoading(false))
  }, [filters.course, filters.status])
  useEffect(() => {
    setDetailLoading(true)
    api.get('/lms/reports/students', { params: filters.student ? { student: filters.student } : {} }).then(r => setStudentDetails(r?.data || [])).catch(e => setError(e.message || 'Unable to load student details')).finally(() => setDetailLoading(false))
  }, [filters.student])
  const exportCsv = () => {
    if (!data) return
    const rows = [['Metric', 'Value'], ...labels.map(([key, label]) => [label, data[key] ?? 0]), [], ['Student', 'Course', 'Progress %', 'Completed', 'Record type', 'Record', 'Marks/Score', 'Maximum', 'Status', 'Feedback'], ...studentDetails.flatMap(item => item.courses.flatMap(course => {
      const base = [item.student.name, course.course.title, course.percent, course.completed]
      const assignments = (course.assignmentResults || []).map(result => [...base, 'Assignment', result.assignment?.title || '', result.marks ?? '', result.assignment?.maxMarks ?? '', result.status || '', result.feedback || ''])
      const quizzes = (course.quizResults || []).map(result => [...base, 'Quiz', result.quiz?.title || '', result.score ?? '', result.totalMarks ?? '', 'attempted', ''])
      return assignments.length || quizzes.length ? [...assignments, ...quizzes] : [[...base, '', '', '', '', '', '']]
    }))]
    const blob = new Blob([rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'lms-report.csv'; anchor.click(); URL.revokeObjectURL(url)
  }
  const max = Math.max(1, ...labels.map(([key]) => Number(data?.[key] || 0)))
  return <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">LMS Reports</h1><p className="text-sm text-gray-500 mt-1">Filter activity and export the current summary.</p></div><button className="btn-outline" onClick={exportCsv} disabled={!data}>Export CSV</button></div>
    {error && <div className="card p-4 text-red-500">{error}</div>}
    <div className="card p-4 flex flex-wrap gap-3"><select aria-label="Filter by course" className="field max-w-xs" value={filters.course} onChange={e => setFilters({ ...filters, course: e.target.value })}><option value="">All courses</option>{courses.map(c => <option value={c._id} key={c._id}>{c.title}</option>)}</select><select aria-label="Filter by status" className="field max-w-xs" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><select aria-label="Filter by student" className="field max-w-xs" value={filters.student} onChange={e => setFilters({ ...filters, student: e.target.value })}><option value="">All students</option>{students.map(student => <option value={student._id} key={student._id}>{student.name} ({student.email})</option>)}</select></div>
    {loading ? <div className="card p-8 text-center text-gray-400">Loading report…</div> : <><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">{labels.map(([key, label]) => <div className="card p-5" key={key}><div className="text-2xl font-bold">{data[key] ?? 0}</div><div className="text-sm text-gray-500">{label}</div></div>)}</div><section className="card p-5"><h2 className="font-bold mb-4">Activity overview</h2><div className="space-y-3">{labels.map(([key, label]) => <div key={key}><div className="flex justify-between text-xs mb-1"><span>{label}</span><span>{data[key] ?? 0}</span></div><div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.round((Number(data[key] || 0) / max) * 100)}%` }} /></div></div>)}</div></section></>}
    <section className="card p-5"><h2 className="font-bold mb-4">Activity trends (last six months)</h2><div className="grid md:grid-cols-2 gap-5">{[['Submissions', data?.trends?.submissions || []], ['Quiz attempts', data?.trends?.attempts || []]].map(([label, values]) => <div key={label}><div className="text-sm font-semibold mb-2">{label}</div>{values.length ? values.map(item => <div className="flex items-center gap-2 mb-2" key={item._id}><span className="text-xs w-20">{item._id}</span><div className="h-2 bg-primary-500 rounded-full" style={{ width: `${Math.min(100, item.count * 10 + 4)}%` }} /><span className="text-xs">{item.count}</span></div>) : <div className="text-xs text-gray-400">No activity in the period.</div>}</div>)}</div></section><section className="card p-5"><h2 className="font-bold mb-4">Per-student learning details</h2>{detailLoading ? <div className="text-sm text-gray-400">Loading student details…</div> : studentDetails.length ? <div className="space-y-5">{studentDetails.map(item => <div key={item.student._id}><div className="font-semibold">{item.student.name} <span className="text-xs text-gray-400">{item.student.email}</span></div>{item.courses.filter(course => (!filters.course || course.course._id === filters.course) && (!filters.status || course.course.status === filters.status)).map(course => <div className="mt-2 border rounded-xl p-3 text-sm" key={course.course._id}><div className="font-medium">{course.course.title} · {course.percent}% · {course.completed} completed</div><div className="text-xs text-gray-500 mt-1">Assignments: {course.assignmentResults?.length || 0} results · Quizzes: {course.quizResults?.length || 0} attempts</div></div>)}</div>)}</div> : <div className="text-sm text-gray-400">No student learning records found.</div>}</section>
  </div>
}
