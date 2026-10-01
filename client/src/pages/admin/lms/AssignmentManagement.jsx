import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaClipboardList, FaPlus, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'

const EMPTY = { course: '', title: '', instructions: '', dueDate: '', maxMarks: 100, status: 'draft', availableGrades: '' }

export default function AssignmentManagement() {
  const [items, setItems] = useState([]), [courses, setCourses] = useState([]), [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false), [editing, setEditing] = useState(null), [form, setForm] = useState(EMPTY), [saving, setSaving] = useState(false), [error, setError] = useState('')
  const load = () => Promise.all([api.get('/lms/assignments'), api.get('/lms/courses', { params: { limit: 100 } })]).then(([a, c]) => { setItems(a?.data || []); setCourses(c?.data || []) }).catch(e => setError(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  const update = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const openForm = item => {
    setEditing(item || null)
    setForm(item ? { course: item.course?._id || item.course, title: item.title || '', instructions: item.instructions || '', dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 16) : '', maxMarks: item.maxMarks ?? 100, status: item.status || 'draft', availableGrades: (item.availableGrades || []).join(', ') } : EMPTY)
    setError(''); setModal(true)
  }
  const submit = async e => {
    e.preventDefault(); if (!form.course || !form.title.trim()) return setError('Course and assignment title are required.')
    setSaving(true); setError('')
    try {
      const body = { ...form, title: form.title.trim(), maxMarks: Number(form.maxMarks) || 0, availableGrades: form.availableGrades.split(',').map(v => v.trim()).filter(Boolean) }
      if (editing) { await api.put(`/lms/assignments/${editing._id}`, body); toast.success('Assignment updated') }
      else { await api.post('/lms/assignments', body); toast.success('Assignment created') }
      setModal(false); setForm(EMPTY); setEditing(null); await load()
    } catch (err) { setError(err.message || 'Unable to create assignment') } finally { setSaving(false) }
  }
  return <div className="space-y-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1><p className="text-sm text-gray-500 mt-1">Create, publish, and review course assignments.</p></div><button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }}><FaPlus /> New Assignment</button></div>
    {error && <div className="card p-4 text-sm text-red-500">{error}</div>}
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="table-head">Assignment</th><th className="table-head">Course</th><th className="table-head">Due</th><th className="table-head">Status</th><th className="table-head">Actions</th></tr></thead><tbody>{loading ? <tr><td className="table-cell" colSpan="5">Loading assignments…</td></tr> : items.length ? items.map(item => <tr className="table-row" key={item._id}><td className="table-cell font-semibold">{item.title}</td><td className="table-cell">{item.course?.title || '—'}</td><td className="table-cell text-gray-400">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}</td><td className="table-cell"><span className={item.status === 'published' ? 'badge-green' : item.status === 'closed' ? 'badge-red' : 'badge-gray'}>{item.status}</span></td><td className="table-cell"><div className="flex gap-3 text-sm"><button className="text-primary-500" onClick={() => openForm(item)}>Edit</button><Link className="text-primary-500" to={`/admin/lms/assignments/${item._id}/submissions`}>Review</Link></div></td></tr>) : <tr><td colSpan="5" className="table-cell text-center py-12"><FaClipboardList className="mx-auto mb-2 text-gray-300" size={24} />No assignments yet.</td></tr>}</tbody></table></div></div>
    <Link to="/admin/lms" className="text-sm text-primary-500">← Back to LMS Dashboard</Link>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => !saving && setModal(false)}><div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}><div className="flex justify-between mb-5"><h2 className="text-lg font-bold">{editing ? 'Edit Assignment' : 'New Assignment'}</h2><button className="btn-ghost !p-2" onClick={() => !saving && setModal(false)}><FaTimes /></button></div>{error && <div className="mb-4 text-sm text-red-500">{error}</div>}<form onSubmit={submit} className="space-y-4"><Select label="Course" name="course" value={form.course} onChange={update} options={courses.map(c => ({ value: c._id, label: c.title }))} /><Field label="Title" name="title" value={form.title} onChange={update} required placeholder="e.g. Term project" /><div className="grid sm:grid-cols-2 gap-4"><Field label="Due date" name="dueDate" type="datetime-local" value={form.dueDate} onChange={update} /><Field label="Maximum marks" name="maxMarks" type="number" min="0" value={form.maxMarks} onChange={update} /><Field label="Available grades (comma separated)" name="availableGrades" value={form.availableGrades} onChange={update} placeholder="Grade 5, Grade 6" /><Select label="Status" name="status" value={form.status} onChange={update} options={['draft', 'published', 'closed'].map(v => ({ value: v, label: v }))} /></div><div><label className="label">Instructions</label><textarea name="instructions" value={form.instructions} onChange={update} className="field min-h-28" /></div><div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Assignment'}</button></div></form></div></div>}
  </div>
}
const Field = ({ label, ...props }) => <div><label className="label" htmlFor={props.name}>{label}</label><input className="field" id={props.name} {...props} /></div>
function Select({ label, options, ...props }) { return <div><label className="label" htmlFor={props.name}>{label}</label><select className="field" id={props.name} {...props}><option value="">Select…</option>{options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select></div> }
