import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBook, FaChevronDown, FaChevronUp, FaEdit, FaPlus, FaTimes, FaTrash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'

const COURSE_FORM = { title: '', code: '', subject: '', grade: '', academicClass: '', session: '', description: '', status: 'draft' }
const LESSON_FORM = { title: '', description: '', contentType: 'lesson', content: '', duration: '', visibility: 'hidden', status: 'draft', module: '' }
const MODULE_FORM = { title: '', description: '', status: 'draft' }

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [courseModal, setCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseForm, setCourseForm] = useState(COURSE_FORM)
  const [lessonPanel, setLessonPanel] = useState(null)
  const [lessons, setLessons] = useState([])
  const [modules, setModules] = useState([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonModal, setLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState(LESSON_FORM)
  const [moduleModal, setModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [moduleForm, setModuleForm] = useState(MODULE_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadCourses = () => {
    setLoading(true); setError('')
    return api.get('/lms/courses', { params: { limit: 100 } })
      .then(r => setCourses(r?.data || []))
      .catch(e => setError(e.message || 'Unable to load courses'))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    loadCourses()
    Promise.all([api.get('/lms/teachers'), api.get('/relationships/classes'), api.get('/relationships/sessions')])
      .then(([teacherResponse, classResponse, sessionResponse]) => {
        setTeachers(teacherResponse?.data || [])
        setClasses(classResponse?.data || [])
        setSessions(sessionResponse?.data || [])
      }).catch(e => setError(e.message || 'Unable to load course options'))
  }, [])

  const updateForm = setter => e => setter(current => ({ ...current, [e.target.name]: e.target.value }))
  const openCourse = course => {
    setEditingCourse(course || null)
    setCourseForm(course ? { title: course.title || '', code: course.code || '', subject: course.subject || '', grade: course.grade || '', academicClass: course.academicClass?._id || course.academicClass || '', session: course.session?._id || course.session || '', description: course.description || '', status: course.status || 'draft', instructor: course.instructor?._id || course.instructor || '' } : { ...COURSE_FORM, instructor: '' })
    setFormError(''); setCourseModal(true)
  }
  const saveCourse = async e => {
    e.preventDefault()
    if (!courseForm.title.trim()) return setFormError('Course title is required.')
    setSaving(true); setFormError('')
    try {
      const body = { ...courseForm, title: courseForm.title.trim(), code: courseForm.code.trim() || undefined, subject: courseForm.subject.trim() || undefined, grade: courseForm.grade.trim() || undefined, academicClass: courseForm.academicClass || undefined, session: courseForm.session || undefined, description: courseForm.description.trim() || undefined, instructor: courseForm.instructor || undefined }
      if (editingCourse) { await api.put(`/lms/courses/${editingCourse._id}`, body); toast.success('Course updated successfully') }
      else { await api.post('/lms/courses', body); toast.success('Course created successfully') }
      setCourseModal(false); await loadCourses()
    } catch (e) { setFormError(e.message || 'Unable to save course') }
    finally { setSaving(false) }
  }

  const openStructure = async course => {
    if (lessonPanel?._id === course._id) return setLessonPanel(null)
    setLessonPanel(course); setLessonsLoading(true)
    try {
      const [lessonResponse, moduleResponse] = await Promise.all([api.get(`/lms/courses/${course._id}/lessons`), api.get(`/lms/courses/${course._id}/modules`)])
      setLessons(lessonResponse?.data || []); setModules(moduleResponse?.data || [])
    }
    catch (e) { toast.error(e.message || 'Unable to load lessons') }
    finally { setLessonsLoading(false) }
  }
  const openLesson = lesson => {
    setEditingLesson(lesson || null)
    setLessonForm(lesson ? { title: lesson.title || '', description: lesson.description || '', contentType: lesson.contentType || 'lesson', content: lesson.content || '', duration: lesson.duration ?? '', visibility: lesson.visibility || 'hidden', status: lesson.status || (lesson.isPublished ? 'published' : 'draft'), module: lesson.module?._id || lesson.module || '' } : LESSON_FORM)
    setFormError(''); setLessonModal(true)
  }
  const openModule = module => {
    setEditingModule(module || null)
    setModuleForm(module ? { title: module.title || '', description: module.description || '', status: module.status || 'draft' } : MODULE_FORM)
    setFormError(''); setModuleModal(true)
  }
  const saveModule = async e => {
    e.preventDefault()
    if (!moduleForm.title.trim()) return setFormError('Module title is required.')
    setSaving(true); setFormError('')
    try {
      const base = `/lms/courses/${lessonPanel._id}/modules`
      const r = editingModule ? await api.put(`${base}/${editingModule._id}`, moduleForm) : await api.post(base, moduleForm)
      setModules(current => editingModule ? current.map(item => item._id === editingModule._id ? r.data : item) : [...current, r.data])
      setModuleModal(false); toast.success(editingModule ? 'Module updated successfully' : 'Module added successfully')
    } catch (e) { setFormError(e.message || 'Unable to save module') }
    finally { setSaving(false) }
  }
  const removeModule = async module => {
    if (!window.confirm(`Delete "${module.title}"? Lessons will remain in the course.`)) return
    try { await api.delete(`/lms/courses/${lessonPanel._id}/modules/${module._id}`); setModules(current => current.filter(item => item._id !== module._id)); setLessons(current => current.map(item => item.module === module._id ? { ...item, module: null } : item)); toast.success('Module deleted') }
    catch (e) { toast.error(e.message || 'Unable to delete module') }
  }
  const saveLesson = async e => {
    e.preventDefault()
    if (!lessonForm.title.trim()) return setFormError('Lesson title is required.')
    setSaving(true); setFormError('')
    try {
      const body = { ...lessonForm, title: lessonForm.title.trim(), duration: lessonForm.duration === '' ? 0 : Number(lessonForm.duration), module: lessonForm.module || null }
      const base = `/lms/courses/${lessonPanel._id}/lessons`
      const r = editingLesson ? await api.put(`${base}/${editingLesson._id}`, body) : await api.post(base, body)
      setLessons(current => editingLesson ? current.map(item => item._id === editingLesson._id ? r.data : item).sort((a, b) => a.order - b.order) : [...current, r.data].sort((a, b) => a.order - b.order))
      setLessonModal(false); toast.success(editingLesson ? 'Lesson updated successfully' : 'Lesson added successfully')
    } catch (e) { setFormError(e.message || 'Unable to save lesson') }
    finally { setSaving(false) }
  }
  const removeLesson = async lesson => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return
    try { await api.delete(`/lms/courses/${lessonPanel._id}/lessons/${lesson._id}`); setLessons(current => current.filter(item => item._id !== lesson._id)); toast.success('Lesson deleted') }
    catch (e) { toast.error(e.message || 'Unable to delete lesson') }
  }
  const moveLesson = async (lesson, direction) => {
    const index = lessons.findIndex(item => item._id === lesson._id)
    const other = lessons[index + direction]
    if (!other) return
    try {
      await Promise.all([
        api.put(`/lms/courses/${lessonPanel._id}/lessons/${lesson._id}`, { order: other.order }),
        api.put(`/lms/courses/${lessonPanel._id}/lessons/${other._id}`, { order: lesson.order }),
      ])
      setLessons(current => current.map(item => item._id === lesson._id ? { ...item, order: other.order } : item._id === other._id ? { ...item, order: lesson.order } : item).sort((a, b) => a.order - b.order))
    } catch (e) { toast.error(e.message || 'Unable to reorder lessons') }
  }
  const duplicateCourse = async course => {
    try { const response = await api.post(`/lms/courses/${course._id}/duplicate`); setCourses(current => [response.data, ...current]); toast.success('Course duplicated as draft') }
    catch (e) { toast.error(e.message || 'Unable to duplicate course') }
  }
  const archiveCourse = async course => {
    const status = course.status === 'archived' ? 'draft' : 'archived'
    try { const response = await api.put(`/lms/courses/${course._id}`, { status }); setCourses(current => current.map(item => item._id === course._id ? response.data : item)); toast.success(status === 'archived' ? 'Course archived' : 'Course restored to draft') }
    catch (e) { toast.error(e.message || 'Unable to update course status') }
  }

  return <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage courses, modules, and lessons.</p></div><button className="btn-primary" onClick={() => openCourse()}><FaPlus /> New Course</button></div>
    {error && <div className="card p-4 text-sm text-red-500">{error}</div>}
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100 dark:border-gray-800"><th className="table-head">Course</th><th className="table-head">Instructor</th><th className="table-head">Status</th><th className="table-head">Created</th><th className="table-head">Actions</th></tr></thead><tbody>
      {loading ? <tr><td className="table-cell" colSpan="5">Loading courses…</td></tr> : courses.length ? courses.map(course => <tr className="table-row" key={course._id}><td className="table-cell"><div className="font-semibold">{course.title}</div><div className="text-xs text-gray-400">{course.code || 'No course code'}{course.subject ? ` · ${course.subject}` : ''}</div></td><td className="table-cell">{course.instructor?.name || '—'}</td><td className="table-cell"><span className={course.status === 'published' ? 'badge-green' : course.status === 'archived' ? 'badge-red' : 'badge-gray'}>{course.status}</span></td><td className="table-cell text-gray-400">{course.createdAt ? new Date(course.createdAt).toLocaleDateString() : '—'}</td><td className="table-cell"><div className="flex gap-1"><button className="btn-ghost !p-2" title="Edit course" onClick={() => openCourse(course)}><FaEdit /></button><button className="btn-ghost !p-2 text-primary-500" title="Manage modules and lessons" onClick={() => openStructure(course)}>{lessonPanel?._id === course._id ? <FaChevronUp /> : <FaChevronDown />}</button>      <Link className="btn-ghost !p-2" title="Preview course" to={`/admin/lms/courses/${course._id}/preview`}>Preview</Link><button className="btn-ghost !p-2" title="Duplicate course" onClick={() => duplicateCourse(course)}>Copy</button><button className="btn-ghost !p-2" title="Archive or restore course" onClick={() => archiveCourse(course)}>{course.status === 'archived' ? 'Restore' : 'Archive'}</button></div></td></tr>) : <tr><td colSpan="5" className="table-cell text-center py-12"><FaBook className="mx-auto mb-2 text-gray-300" size={24} />No courses yet. Create the first course to get started.</td></tr>}
    </tbody></table></div></div>
    {lessonPanel && <StructurePanel course={lessonPanel} modules={modules} lessons={lessons} loading={lessonsLoading} onAddModule={() => openModule()} onEditModule={openModule} onDeleteModule={removeModule} onAdd={() => openLesson()} onEdit={openLesson} onDelete={removeLesson} onMove={moveLesson} />}
    <Link to="/admin/lms" className="text-sm text-primary-500">← Back to LMS Dashboard</Link>
    {courseModal && <CourseModal teachers={teachers} classes={classes} sessions={sessions} form={courseForm} update={updateForm(setCourseForm)} error={formError} saving={saving} editing={editingCourse} close={() => !saving && setCourseModal(false)} submit={saveCourse} />}
    {lessonModal && <LessonModal modules={modules} form={lessonForm} update={updateForm(setLessonForm)} error={formError} saving={saving} editing={editingLesson} close={() => !saving && setLessonModal(false)} submit={saveLesson} />}
    {moduleModal && <ModuleModal form={moduleForm} update={updateForm(setModuleForm)} error={formError} saving={saving} editing={editingModule} close={() => !saving && setModuleModal(false)} submit={saveModule} />}
  </div>
}

function StructurePanel({ course, modules, lessons, loading, onAddModule, onEditModule, onDeleteModule, onAdd, onEdit, onDelete, onMove }) {
  return <div className="card p-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-gray-900 dark:text-white">{course.title} structure</h2><p className="text-xs text-gray-500">Modules and lessons are ordered from top to bottom.</p></div><button className="btn-primary" onClick={onAdd}><FaPlus /> Add Lesson</button></div>
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-3"><h3 className="font-semibold text-sm">Modules / Units</h3><button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={onAddModule}><FaPlus /> Add Module</button></div>
    {modules.length ? <div className="space-y-2 mb-5">{modules.map(module => <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3" key={module._id}><div className="flex-1"><div className="font-semibold text-sm">{module.title}</div><div className="text-xs text-gray-400">{module.status}</div></div><button className="btn-ghost !p-2" onClick={() => onEditModule(module)} title="Edit module"><FaEdit /></button><button className="btn-ghost !p-2 text-red-500" onClick={() => onDeleteModule(module)} title="Delete module"><FaTrash /></button></div>)}</div> : <p className="text-sm text-gray-400 py-3 mb-3">No modules yet. Lessons can be added directly or assigned to a module.</p>}
    <h3 className="font-semibold text-sm border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">Lessons</h3>
    {loading ? <p className="text-sm text-gray-400">Loading lessons…</p> : lessons.length ? <div className="space-y-2">{lessons.map((lesson, index) => <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3" key={lesson._id}><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{index + 1}. {lesson.title}</div><div className="text-xs text-gray-400">{lesson.contentType} · {lesson.duration || 0} min · {lesson.visibility} · {lesson.status}</div></div><div className="flex items-center gap-1"><button className="btn-ghost !p-2" disabled={!index} onClick={() => onMove(lesson, -1)} title="Move up"><FaChevronUp /></button><button className="btn-ghost !p-2" disabled={index === lessons.length - 1} onClick={() => onMove(lesson, 1)} title="Move down"><FaChevronDown /></button><button className="btn-ghost !p-2" onClick={() => onEdit(lesson)} title="Edit lesson"><FaEdit /></button><button className="btn-ghost !p-2 text-red-500" onClick={() => onDelete(lesson)} title="Delete lesson"><FaTrash /></button></div></div>)}</div> : <p className="text-sm text-gray-400 py-5">No lessons yet. Add the first lesson to this course.</p>}
  </div>
}

function Modal({ title, error, saving, close, submit, children, submitLabel }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onMouseDown={close}><div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 md:p-6" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2><button type="button" className="btn-ghost !p-2" onClick={close} disabled={saving} aria-label="Close"><FaTimes /></button></div>{error && <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}<form onSubmit={submit} className="space-y-4">{children}<div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-ghost" onClick={close} disabled={saving}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button></div></form></div></div>
}
const Field = ({ label, name, value, onChange, ...props }) => <div><label className="label" htmlFor={name}>{label}</label><input id={name} name={name} value={value} onChange={onChange} className="field" {...props} /></div>
function CourseModal({ teachers, classes, sessions, form, update, error, saving, editing, close, submit }) { return <Modal title={editing ? 'Edit Course' : 'Create New Course'} error={error} saving={saving} close={close} submit={submit} submitLabel={editing ? 'Save Changes' : 'Create Course'}><Field label={<>Course title <span className="text-red-500">*</span></>} name="title" value={form.title} onChange={update} required autoFocus placeholder="e.g. Mathematics - Grade 5" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Course code" name="code" value={form.code} onChange={update} placeholder="e.g. MATH-05" /><Field label="Subject" name="subject" value={form.subject} onChange={update} placeholder="e.g. Mathematics" /><Field label="Grade fallback" name="grade" value={form.grade} onChange={update} placeholder="e.g. Grade 5" /><Select label="Class" name="academicClass" value={form.academicClass || ''} onChange={update} options={classes.map(item => ({ value:item._id, label:item.name }))} /><Select label="Academic session" name="session" value={form.session || ''} onChange={update} options={sessions.map(item => ({ value:item._id, label:item.name }))} /><Select label="Teacher" name="instructor" value={form.instructor} onChange={update} options={[{value:'',label:'Current user'}, ...teachers.map(t => ({ value:t._id, label:`${t.name} (${t.email})` }))]} /><Select label="Status" name="status" value={form.status} onChange={update} options={['draft', 'published', 'archived']} /></div><div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" value={form.description} onChange={update} className="field min-h-24 resize-y" /></div></Modal> }
function LessonModal({ modules, form, update, error, saving, editing, close, submit }) { return <Modal title={editing ? 'Edit Lesson' : 'Add Lesson'} error={error} saving={saving} close={close} submit={submit} submitLabel={editing ? 'Save Changes' : 'Add Lesson'}><Field label={<>Lesson title <span className="text-red-500">*</span></>} name="title" value={form.title} onChange={update} required autoFocus placeholder="e.g. Fractions and Decimals" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ModuleSelect modules={modules} value={form.module} onChange={update} /><Select label="Lesson type" name="contentType" value={form.contentType} onChange={update} options={['lesson', 'video', 'document', 'link']} /><Field label="Duration (minutes)" name="duration" type="number" min="0" value={form.duration} onChange={update} placeholder="0" /><Select label="Visibility" name="visibility" value={form.visibility} onChange={update} options={['hidden', 'visible']} /><Select label="Status" name="status" value={form.status} onChange={update} options={['draft', 'published', 'archived']} /></div><div><label className="label" htmlFor="lesson-description">Description</label><textarea id="lesson-description" name="description" value={form.description} onChange={update} className="field min-h-20 resize-y" /></div><div><label className="label" htmlFor="content">Content / URL</label><textarea id="content" name="content" value={form.content} onChange={update} className="field min-h-28 resize-y" placeholder="Lesson notes, video URL, document URL, or link." /></div></Modal> }
function ModuleModal({ form, update, error, saving, editing, close, submit }) { return <Modal title={editing ? 'Edit Module / Unit' : 'Add Module / Unit'} error={error} saving={saving} close={close} submit={submit} submitLabel={editing ? 'Save Changes' : 'Add Module'}><Field label={<>Module title <span className="text-red-500">*</span></>} name="title" value={form.title} onChange={update} required autoFocus placeholder="e.g. Number Systems" /><Select label="Status" name="status" value={form.status} onChange={update} options={['draft', 'published', 'archived']} /><div><label className="label" htmlFor="module-description">Description</label><textarea id="module-description" name="description" value={form.description} onChange={update} className="field min-h-20 resize-y" /></div></Modal> }
function ModuleSelect({ modules, value, onChange }) { return <div><label className="label" htmlFor="module">Module / unit</label><select id="module" name="module" value={value} onChange={onChange} className="field"><option value="">No module</option>{modules.map(module => <option key={module._id} value={module._id}>{module.title}</option>)}</select></div> }
function Select({ label, name, value, onChange, options }) { return <div><label className="label" htmlFor={name}>{label}</label><select id={name} name={name} value={value} onChange={onChange} className="field">{options.map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></div> }
