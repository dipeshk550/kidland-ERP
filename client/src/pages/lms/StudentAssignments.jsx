import { useEffect, useState } from 'react'
import { FaClipboardList, FaPaperPlane, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../services/api'
import NotificationBell from '../../components/lms/NotificationBell'

export default function StudentAssignments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/lms/assignments')
      .then(r => setItems(r?.data || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const submit = async assignment => {
    if (!text.trim() && !file) {
      toast.error('Type your homework or attach a file before submitting')
      return
    }
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Homework files must be 5 MB or smaller')
      return
    }
    setSaving(true)
    try {
      const body = new FormData()
      if (text.trim()) body.append('text', text.trim())
      if (file) body.append('file', file)
      const response = await api.post(`/lms/assignments/${assignment._id}/submissions`, body)
      setItems(current => current.map(item => item._id === assignment._id
        ? { ...item, submission: response.data }
        : item))
      setOpen(null)
      setText('')
      setFile(null)
      toast.success('Homework submitted successfully')
    } catch (e) {
      toast.error(e.message || 'Unable to submit homework')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Assignments</h1>
            <p className="text-sm text-gray-500 mt-1">Published homework remains available when you are absent or on leave.</p>
          </div>
          <NotificationBell />
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <span>Study the instructions from home and submit written work or a PDF/image. Attendance does not block published homework.</span>
        </div>
        {loading ? <div className="card p-5">Loading assignments...</div> : items.length ? items.map(item => (
          <div className="card p-5" key={item._id}>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="text-sm text-gray-500">{item.course?.title} · {item.maxMarks} marks {item.dueDate ? `· Due ${new Date(item.dueDate).toLocaleDateString()}` : ''}</p>
                <p className="text-sm mt-3 whitespace-pre-wrap">{item.instructions}</p>
              </div>
              <span className={item.submission ? 'badge-green' : 'badge-yellow'}>{item.submission ? item.submission.status : 'Not submitted'}</span>
            </div>
            {item.submission ? (
              <div className="text-sm text-gray-500 mt-4">
                Your submission has been received. {item.submission.marks != null ? `Marks: ${item.submission.marks}/${item.maxMarks}` : 'Awaiting review.'}
                {item.submission.attachment?.name && <p className="mt-2">Attached work: <a className="text-primary-600 underline" href={`/api/lms/submissions/${item.submission._id}/attachment`} target="_blank" rel="noreferrer">{item.submission.attachment.name}</a></p>}
                {item.submission.feedback && <p className="mt-2"><strong>Teacher feedback:</strong> {item.submission.feedback}</p>}
              </div>
            ) : (
              <button className="btn-primary mt-4" onClick={() => { setOpen(item); setText(''); setFile(null) }}><FaPaperPlane /> Submit homework</button>
            )}
            {open?._id === item._id && (
              <div className="mt-4 border-t pt-4">
                <label className="label">Your written work</label>
                <textarea className="field min-h-32" value={text} onChange={e => setText(e.target.value)} placeholder="Type your answer or explain your homework here." />
                <label className="label mt-3">Attach completed work (optional)</label>
                <input className="field mt-1" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif" onChange={e => setFile(e.target.files[0] || null)} />
                <p className="text-xs text-gray-500 mt-1">PDF or image, maximum 5 MB.</p>
                <button className="btn-primary mt-3" disabled={saving} onClick={() => submit(item)}>{saving ? 'Submitting...' : 'Submit homework'}</button>
              </div>
            )}
          </div>
        )) : <div className="card p-12 text-center text-gray-400"><FaClipboardList className="mx-auto mb-2" size={26} />No published assignments available.</div>}
      </div>
    </div>
  )
}
