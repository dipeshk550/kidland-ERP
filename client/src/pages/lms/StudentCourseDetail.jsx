import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import NotificationBell from '../../components/lms/NotificationBell'

export default function StudentCourseDetail() {
  const { id } = useParams()
  const [lessons, setLessons] = useState([])
  const [materials, setMaterials] = useState([])
  const [error, setError] = useState('')
  const startedAt = useRef(Date.now())
  const [saving, setSaving] = useState('')
  useEffect(() => {
    Promise.all([api.get(`/lms/student/courses/${id}/lessons`), api.get(`/lms/courses/${id}/materials`)])
      .then(([lessonResponse, materialResponse]) => { setLessons(lessonResponse?.data || []); setMaterials(materialResponse?.data || []) })
      .catch(e => setError(e.message || 'Unable to load course'))
  }, [id])
  const complete = async lesson => {
    setSaving(lesson._id)
    try {
      const response = await api.put(`/lms/student/courses/${id}/lessons/${lesson._id}/complete`, { timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000) })
      setLessons(current => current.map(item => item._id === lesson._id ? { ...item, progress: response.data } : item))
    } catch (e) { setError(e.message || 'Unable to save lesson progress') }
    finally { setSaving('') }
  }
  const openMaterial = async material => {
    try {
      const blob = await api.get(`/lms/materials/${material._id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) { setError(e.message || 'Unable to open material') }
  }
  return <div className="min-h-screen p-4 md:p-8"><div className="max-w-4xl mx-auto space-y-5">
    <div className="flex justify-between"><Link to="/lms/courses" className="text-primary-500">← My Learning</Link><NotificationBell /></div>
    <h1 className="text-2xl font-bold">Course lessons</h1>
    {error && <div className="card p-4 text-red-500">{error}</div>}
    <div className="card p-5 space-y-3">{lessons.map((lesson, index) => <div className="border-b pb-3" key={lesson._id}>
      <div className="flex items-center justify-between gap-3"><div><div className="font-semibold">{index + 1}. {lesson.title}</div><div className="text-xs text-primary-500">{lesson.module?.title || 'Course lesson'}</div></div><button className={lesson.progress ? 'badge-green' : 'btn-outline !px-3 !py-1.5 !text-xs'} disabled={!!lesson.progress || saving === lesson._id} onClick={() => complete(lesson)}>{lesson.progress ? 'Completed' : saving === lesson._id ? 'Saving…' : 'Mark complete'}</button></div>
      <div className="text-sm text-gray-500">{lesson.contentType} · {lesson.duration || 0} minutes</div><p className="text-sm mt-2 whitespace-pre-wrap">{lesson.description || lesson.content}</p>
    </div>)}{!lessons.length && <p className="text-gray-400">No published lessons yet.</p>}</div>
    <div className="card p-5"><h2 className="font-bold mb-3">Learning materials</h2>{materials.map(material => <button className="block text-primary-500 text-sm mb-2" onClick={() => openMaterial(material)} key={material._id}>{material.title} <span className="text-gray-400">({material.mime || 'file'})</span></button>)}{!materials.length && <p className="text-gray-400 text-sm">No materials yet.</p>}</div>
  </div></div>
}
