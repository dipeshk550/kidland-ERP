import { useState, useEffect, useRef } from 'react'
import { FaSearch, FaHandHolding, FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'

const DEF_DAYS = 14

export default function IssueBook() {
  // Borrower
  const [borrowerType, setBorrowerType] = useState('student')
  const [stuQuery, setStuQuery] = useState('')
  const [stuSugs, setStuSugs]   = useState([])
  const [selStu, setSelStu]     = useState(null)
  const [manualName, setManualName] = useState('')
  const [manualClass, setManualClass] = useState('')
  // Book
  const [bookQuery, setBookQuery] = useState('')
  const [books, setBooks]       = useState([])
  const [selBook, setSelBook]   = useState(null)
  const [loadingBooks, setLoadingBooks] = useState(false)
  // Form
  const [dueDate, setDueDate]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + DEF_DAYS)
    return d.toISOString().slice(0,10)
  })
  const [remarks, setRemarks]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Recent issues
  const [recent, setRecent]     = useState([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const stuDebRef = useRef()
  const bookDebRef = useRef()

  const loadRecent = async () => {
    setLoadingRecent(true)
    try { const r = await api.get('/library/issues?status=issued&limit=10'); setRecent(r.data || []) }
    catch { } finally { setLoadingRecent(false) }
  }
  useEffect(() => { loadRecent() }, [])

  // Student autocomplete
  useEffect(() => {
    clearTimeout(stuDebRef.current)
    if (stuQuery.length < 2) { setStuSugs([]); return }
    stuDebRef.current = setTimeout(async () => {
      try { const r = await api.get(`/fees/student/search?q=${encodeURIComponent(stuQuery)}`); setStuSugs(r.data || []) }
      catch { setStuSugs([]) }
    }, 300)
  }, [stuQuery])

  // Book search
  useEffect(() => {
    clearTimeout(bookDebRef.current)
    if (bookQuery.length < 2) { setBooks([]); return }
    bookDebRef.current = setTimeout(async () => {
      setLoadingBooks(true)
      try { const r = await api.get(`/library/books?search=${encodeURIComponent(bookQuery)}&status=active`); setBooks(r.data || []) }
      catch { setBooks([]) } finally { setLoadingBooks(false) }
    }, 300)
  }, [bookQuery])

  const handleIssue = async () => {
    if (!selBook) return toast.error('Select a book')
    const borrowerName = borrowerType === 'student' ? selStu?.studentName || manualName : manualName
    if (!borrowerName) return toast.error('Enter borrower name')
    if (!dueDate) return toast.error('Set due date')
    if (selBook.availableQty <= 0) return toast.error('No copies available')

    setSubmitting(true)
    try {
      const r = await api.post('/library/issues', {
        bookId: selBook._id,
        borrowerType,
        borrowerId: selStu?._id,
        borrowerName,
        borrowerClass: selStu?.classApplying || manualClass,
        dueDate, remarks,
      })
      toast.success(r.message || 'Book issued successfully!', { duration: 5000 })
      // Reset
      setSelStu(null); setStuQuery(''); setManualName(''); setManualClass('')
      setSelBook(null); setBookQuery(''); setBooks([]); setRemarks('')
      const d = new Date(); d.setDate(d.getDate() + DEF_DAYS)
      setDueDate(d.toISOString().slice(0,10))
      loadRecent()
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <FaHandHolding size={16} className="text-primary-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Issue Book</h1>
          <p className="text-xs text-gray-400">Issue books to students, teachers or staff</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Borrower Panel */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Borrower Details</h2>
          <div className="mb-3">
            <label className="label">Borrower Type</label>
            <select className="field" value={borrowerType} onChange={e => { setBorrowerType(e.target.value); setSelStu(null); setStuQuery('') }}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          {borrowerType === 'student' ? (
            <div className="relative mb-3">
              <label className="label">Search Student</label>
              <div className="relative">
                <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="field pl-9" value={stuQuery} onChange={e => setStuQuery(e.target.value)} placeholder="Student name or phone…"/>
              </div>
              {stuSugs.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {stuSugs.map(s => (
                    <button key={s._id} type="button" onClick={() => { setSelStu(s); setStuQuery(s.studentName); setStuSugs([]) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
                      <div className="font-semibold">{s.studentName}</div>
                      <div className="text-xs text-gray-400">{s.classApplying} · {s.phone}</div>
                    </button>
                  ))}
                </div>
              )}
              {selStu && (
                <div className="mt-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
                  <FaCheckCircle className="text-green-500"/>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">{selStu.studentName} — {selStu.classApplying}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 mb-3">
              <div>
                <label className="label">Name *</label>
                <input className="field" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Full name"/>
              </div>
              <div>
                <label className="label">Department / Class</label>
                <input className="field" value={manualClass} onChange={e => setManualClass(e.target.value)} placeholder="e.g. Science Dept."/>
              </div>
            </div>
          )}
        </div>

        {/* Book Panel */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Book Details</h2>
          <div className="mb-3">
            <label className="label">Search Book</label>
            <div className="relative">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="field pl-9" value={bookQuery} onChange={e => { setBookQuery(e.target.value); setSelBook(null) }} placeholder="Title, ISBN…"/>
            </div>
            {loadingBooks && <div className="text-xs text-gray-400 mt-1">Searching…</div>}
            {books.length > 0 && !selBook && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {books.map(b => (
                  <button key={b._id} type="button" onClick={() => { setSelBook(b); setBooks([]) }}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm ${b.availableQty === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={b.availableQty === 0}>
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-xs text-gray-400 flex gap-3">
                      <span>{b.category?.name}</span>
                      <span className={b.availableQty > 0 ? 'text-green-600' : 'text-red-500'}>
                        {b.availableQty} available
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selBook && (
              <div className="mt-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm text-blue-800 dark:text-blue-200">{selBook.title}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{selBook.author?.name} · {selBook.isbn || 'No ISBN'}</div>
                  </div>
                  <span className="text-xs font-bold text-green-600">{selBook.availableQty} left</span>
                </div>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="label">Due Date *</label>
            <input type="date" className="field" value={dueDate} onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0,10)}/>
          </div>
          <div>
            <label className="label">Remarks</label>
            <input className="field" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks"/>
          </div>
        </div>
      </div>

      <button onClick={handleIssue} disabled={submitting} className="btn-primary w-full justify-center py-3 text-base mb-6">
        {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Issue Book'}
      </button>

      {/* Recent Issues */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Recently Issued</h3>
        </div>
        {loadingRecent ? <div className="flex justify-center py-8"><Spinner size="sm"/></div>
        : recent.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">No active issues</div>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue No</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Issue Date</th>
              <th className="table-head">Due Date</th>
            </tr></thead>
            <tbody>
              {recent.map(r => {
                const isOverdue = new Date(r.dueDate) < new Date()
                return (
                  <tr key={r._id} className={`table-row ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{r.issueNo}</td>
                    <td className="table-cell">
                      <div className="font-medium">{r.borrowerName}</div>
                      <div className="text-[11px] text-gray-400 capitalize">{r.borrowerType}</div>
                    </td>
                    <td className="table-cell text-gray-600 dark:text-gray-300">{r.book?.title}</td>
                    <td className="table-cell text-gray-400 text-xs">{new Date(r.issueDate).toLocaleDateString()}</td>
                    <td className="table-cell text-xs">
                      <span className={isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}>
                        {new Date(r.dueDate).toLocaleDateString()}{isOverdue && ' (Overdue)'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
