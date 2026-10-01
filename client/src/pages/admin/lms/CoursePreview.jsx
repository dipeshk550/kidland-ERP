import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../../services/api'

export default function CoursePreview() {
  const { id } = useParams()
  const [data, setData] = useState(null), [error, setError] = useState('')
  useEffect(() => { api.get(`/lms/courses/${id}/preview`).then(r => setData(r?.data)).catch(e => setError(e.message || 'Unable to load preview')) }, [id])
  if (error) return <div className="card p-5 text-red-500">{error}</div>
  if (!data) return <div className="card p-5 text-gray-400">Loading course preview…</div>
  const { course, modules, lessons, assignments, quizzes, materials } = data
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><Link to="/admin/lms/courses" className="text-sm text-primary-500">← Courses</Link><h1 className="text-2xl font-bold mt-2">{course.title}</h1><p className="text-sm text-gray-500">{course.subject || 'Course'} · {course.instructor?.name || 'Unassigned'} · Draft preview</p></div><span className="badge-gray">{course.status}</span></div>{course.description && <div className="card p-5 whitespace-pre-wrap">{course.description}</div>}<section className="card p-5"><h2 className="font-bold mb-3">Modules and lessons</h2>{modules.length ? modules.map(module => <div className="border-b pb-3 mb-3" key={module._id}><div className="font-semibold">{module.title}</div>{lessons.filter(lesson => String(lesson.module?._id || lesson.module) === String(module._id)).map(lesson => <div className="ml-4 mt-2 text-sm text-gray-600" key={lesson._id}>{lesson.title} · {lesson.status} · {lesson.visibility}</div>)}</div>) : lessons.map(lesson => <div className="border-b pb-2 mb-2 text-sm" key={lesson._id}>{lesson.title} · {lesson.status}</div>)}{!modules.length && !lessons.length && <p className="text-gray-400">No structure yet.</p>}</section><div className="grid md:grid-cols-3 gap-4">{[['Assignments', assignments], ['Quizzes', quizzes], ['Materials', materials]].map(([label, items]) => <section className="card p-5" key={label}><h2 className="font-bold mb-3">{label}</h2>{items.length ? items.map(item => <div className="text-sm border-b pb-2 mb-2" key={item._id}>{item.title}<div className="text-xs text-gray-400">{item.status || item.mime || 'Available'}</div></div>) : <p className="text-sm text-gray-400">None yet.</p>}</section>)}</div></div>
}
