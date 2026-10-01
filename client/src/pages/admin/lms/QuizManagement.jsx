import { useEffect, useState } from 'react'
import { FaPlus, FaQuestionCircle, FaTrash, FaTimes, FaEdit, FaClipboardCheck } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../../services/api'

export default function QuizManagement() {
  const blankQuestion = () => ({ prompt: '', options: ['', ''], answer: '', marks: '1' })
  const blankForm = () => ({ course:'', title:'', status:'draft', questions:[blankQuestion()], instructions:'' })
  const [quizzes, setQuizzes] = useState([]), [courses, setCourses] = useState([]), [form, setForm] = useState(blankForm), [editing, setEditing] = useState(null), [open, setOpen] = useState(false), [saving, setSaving] = useState(false)
  useEffect(() => { Promise.all([api.get('/lms/quizzes'), api.get('/lms/courses',{params:{limit:100}})]).then(([q,c]) => { setQuizzes(q?.data||[]); setCourses(c?.data||[]) }).catch(e => toast.error(e.message)) }, [])
  const updateQuestion = (index, field, value) => setForm(current => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, [field]: value } : question) }))
  const updateOption = (questionIndex, optionIndex, value) => setForm(current => ({ ...current, questions: current.questions.map((question, i) => i === questionIndex ? { ...question, options: question.options.map((option, j) => j === optionIndex ? value : option) } : question) }))
  const addQuestion = () => setForm(current => ({ ...current, questions: [...current.questions, blankQuestion()] }))
  const removeQuestion = index => setForm(current => ({ ...current, questions: current.questions.filter((_, i) => i !== index) }))
  const addOption = index => setForm(current => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, options: [...question.options, ''] } : question) }))
  const removeOption = (questionIndex, optionIndex) => setForm(current => ({ ...current, questions: current.questions.map((question, i) => {
    if (i !== questionIndex || question.options.length <= 2) return question
    const options = question.options.filter((_, j) => j !== optionIndex)
    const answer = question.answer === String(optionIndex) ? '' : question.answer !== '' && Number(question.answer) > optionIndex ? String(Number(question.answer) - 1) : question.answer
    return { ...question, options, answer }
  }) }))
  const save = async e => {
    e.preventDefault()
    if (!form.course || !form.title.trim()) return toast.error('Course and quiz title are required')
    const questions = form.questions.map(question => ({
      prompt: question.prompt.trim(),
      options: question.options.map(option => option.trim()),
      answer: Number(question.answer),
      marks: Number(question.marks),
      rawAnswer: question.answer,
      rawMarks: question.marks,
    }))
    const invalid = questions.findIndex(question =>
      !question.prompt ||
      question.options.length < 2 ||
      question.options.some(option => !option) ||
      question.rawAnswer === '' ||
      !Number.isInteger(question.answer) ||
      question.answer < 0 ||
      question.answer >= question.options.length ||
      question.rawMarks === '' ||
      !Number.isFinite(question.marks) ||
      question.marks < 0
    )
    if (invalid !== -1) return toast.error(`Question ${invalid + 1}: add a prompt, at least two options, choose a valid answer, and use non-negative marks`)
    setSaving(true)
    try {
      const payloadQuestions = questions.map(({ rawAnswer, rawMarks, ...question }) => question)
      const payload = { course: form.course, title: form.title.trim(), status: form.status, instructions: form.instructions.trim(), questions: payloadQuestions }
      const r = editing ? await api.put(`/lms/quizzes/${editing._id}`, payload) : await api.post('/lms/quizzes', payload)
      setQuizzes(q => editing ? q.map(item => item._id === editing._id ? r.data : item) : [r.data, ...q])
      setOpen(false)
      setEditing(null)
      setForm(blankForm())
      toast.success(editing ? 'Quiz updated' : 'Quiz created')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  const openEdit = quiz => { setEditing(quiz); setForm({ course: quiz.course?._id || quiz.course, title: quiz.title || '', status: quiz.status || 'draft', instructions: quiz.instructions || '', questions: quiz.questions.map(q => ({ prompt:q.prompt, options:q.options, answer:String(q.answer), marks:String(q.marks) })) }); setOpen(true) }
  const remove = async quiz => { if (!window.confirm(`Delete "${quiz.title}"? Attempts will also be removed.`)) return; try { await api.delete(`/lms/quizzes/${quiz._id}`); setQuizzes(items => items.filter(item => item._id !== quiz._id)); toast.success('Quiz deleted') } catch (e) { toast.error(e.message) } }
  return <div className="space-y-5"><div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Quizzes</h1><p className="text-sm text-gray-500">Create, edit, publish, and review scored quizzes.</p></div><button className="btn-primary" onClick={()=>{ setEditing(null); setForm(blankForm()); setOpen(true) }}><FaPlus/> New Quiz</button></div><div className="card overflow-hidden"><table className="w-full"><thead><tr><th className="table-head">Quiz</th><th className="table-head">Course</th><th className="table-head">Status</th><th className="table-head">Questions</th><th className="table-head">Actions</th></tr></thead><tbody>{quizzes.map(q=><tr className="table-row" key={q._id}><td className="table-cell font-semibold">{q.title}</td><td className="table-cell">{q.course?.title}</td><td className="table-cell">{q.status}</td><td className="table-cell">{q.questions?.length || 0}</td><td className="table-cell"><div className="flex gap-2"><button className="btn-ghost !p-2" title="Edit quiz" onClick={()=>openEdit(q)}><FaEdit/></button><Link className="btn-ghost !p-2" title="Review attempts" to={`/admin/lms/quizzes/${q._id}/attempts`}><FaClipboardCheck/></Link><button className="btn-ghost !p-2 text-red-500" title="Delete quiz" onClick={()=>remove(q)}><FaTrash/></button></div></td></tr>)}{!quizzes.length&&<tr><td colSpan="5" className="table-cell text-center py-10"><FaQuestionCircle className="mx-auto mb-2 text-gray-300"/>No quizzes yet.</td></tr>}</tbody></table></div>{open&&<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"><form className="card p-6 max-w-3xl w-full space-y-4 my-8" onSubmit={save}><div className="flex items-center justify-between">  <h2 className="text-lg font-bold">{editing ? 'Edit Quiz' : 'Create Quiz'}</h2><button type="button" className="text-gray-400 hover:text-gray-700" onClick={()=>setOpen(false)} aria-label="Close"><FaTimes/></button></div><select required className="field" value={form.course} onChange={e=>setForm({...form,course:e.target.value})}><option value="">Select course</option>{courses.map(c=><option value={c._id} key={c._id}>{c.title}</option>)}</select><input required className="field" placeholder="Quiz title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="field" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select><textarea className="field" placeholder="Instructions" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/><div className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-semibold">Questions</h3><button type="button" className="btn-ghost" onClick={addQuestion}><FaPlus/> Add Question</button></div>{form.questions.map((question, questionIndex) => <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3" key={questionIndex}><div className="flex items-center justify-between"><h4 className="font-semibold">Question {questionIndex + 1}</h4>{form.questions.length > 1 && <button type="button" className="text-red-500" onClick={()=>removeQuestion(questionIndex)} aria-label={`Remove question ${questionIndex + 1}`}><FaTrash/></button>}</div><input required className="field" placeholder="Question prompt" value={question.prompt} onChange={e=>updateQuestion(questionIndex,'prompt',e.target.value)}/><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{question.options.map((option, optionIndex) => <div className="flex gap-2" key={optionIndex}><input required className="field" placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} value={option} onChange={e=>updateOption(questionIndex, optionIndex, e.target.value)}/>{question.options.length > 2 && <button type="button" className="text-red-500 px-2" onClick={()=>removeOption(questionIndex,optionIndex)} aria-label={`Remove option ${optionIndex + 1}`}><FaTimes/></button>}</div>)}</div><div className="flex flex-wrap gap-2 items-center"><select required className="field flex-1 min-w-[12rem]" value={question.answer} onChange={e=>updateQuestion(questionIndex,'answer',e.target.value)}><option value="">Correct answer</option>{question.options.map((option, optionIndex) => <option value={optionIndex} key={optionIndex}>{option || `Option ${String.fromCharCode(65 + optionIndex)}`}</option>)}</select><input required min="0" step="0.01" type="number" className="field w-32" placeholder="Marks" value={question.marks} onChange={e=>updateQuestion(questionIndex,'marks',e.target.value)}/><button type="button" className="btn-ghost" onClick={()=>addOption(questionIndex)}><FaPlus/> Option</button></div></div>)}</div><div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>  <button className="btn-primary" disabled={saving}>{saving?'Saving…':editing?'Save Changes':'Create Quiz'}</button></div></form></div>}</div>
}
