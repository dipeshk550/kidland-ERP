import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaUndo, FaExclamationTriangle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Pagination } from '../../../components/ui/index'

export default function ReturnBook() {
  const [search, setSearch]     = useState('')
  const [data, setData]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [returning, setReturning] = useState(null) // issueId being returned
  const [returnResult, setReturnResult] = useState(null)
  const [recentReturns, setRecentReturns] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ status: 'issued', page, limit: 15 })
      if (search) p.set('search', search)
      const res = await api.get(`/library/issues?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/library/issues?status=returned&limit=8').then(r => setRecentReturns(r.data || [])).catch(() => {})
  }, [])

  const doReturn = async (issue) => {
    setReturning(issue._id)
    try {
      const r = await api.put(`/library/issues/${issue._id}/return`, {})
      setReturnResult({ ...r, issue })
      toast.success('Book returned!')
      load()
      api.get('/library/issues?status=returned&limit=8').then(r => setRecentReturns(r.data || [])).catch(() => {})
    } catch (e) { toast.error(e.message) } finally { setReturning(null) }
  }

  const daysDiff = (due) => {
    const d = Math.floor((new Date() - new Date(due)) / (1000*60*60*24))
    return d
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
          <FaUndo size={16} className="text-amber-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Return Book</h1>
          <p className="text-xs text-gray-400">Process book returns and generate fines</p>
        </div>
      </div>

      <div className="relative mb-4">
        <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="field pl-9" placeholder="Search by borrower name, issue no…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}/>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Currently Issued Books ({total})</h3>
        </div>
        {loading ? <div className="flex justify-center py-12"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No issued books found" sub="All books have been returned."/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue No</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Issue Date</th>
              <th className="table-head">Due Date</th>
              <th className="table-head text-center">Status</th>
              <th className="table-head text-right">Action</th>
            </tr></thead>
            <tbody>
              {data.map(row => {
                const overdueDays = daysDiff(row.dueDate)
                const isOverdue = overdueDays > 0
                return (
                  <tr key={row._id} className={`table-row ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{row.issueNo}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{row.borrowerName}</div>
                      <div className="text-[11px] text-gray-400 capitalize">{row.borrowerType} · {row.borrowerClass||''}</div>
                    </td>
                    <td className="table-cell text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.book?.title}</td>
                    <td className="table-cell text-gray-400 text-xs">{new Date(row.issueDate).toLocaleDateString()}</td>
                    <td className="table-cell text-xs">
                      <span className={isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}>
                        {new Date(row.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      {isOverdue ? (
                        <span className="flex items-center justify-center gap-1 text-red-500 text-xs font-semibold">
                          <FaExclamationTriangle size={11}/> {overdueDays}d late
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-semibold">On time</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => doReturn(row)}
                        disabled={returning === row._id}
                        className="btn-primary py-1.5 px-3 text-xs">
                        {returning === row._id
                          ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                          : <><FaUndo size={11}/> Return</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="issues"/>

      {/* Recent Returns */}
      {recentReturns.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Recent Returns</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue No</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Returned On</th>
            </tr></thead>
            <tbody>
              {recentReturns.map(r => (
                <tr key={r._id} className="table-row">
                  <td className="table-cell font-mono text-xs text-primary-600 dark:text-primary-400">{r.issueNo}</td>
                  <td className="table-cell font-medium text-gray-700 dark:text-gray-200">{r.borrowerName}</td>
                  <td className="table-cell text-gray-500 truncate max-w-[180px]">{r.book?.title}</td>
                  <td className="table-cell text-gray-400 text-xs">{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Result Modal */}
      <Modal open={!!returnResult} onClose={() => setReturnResult(null)} title="Return Processed" size="sm">
        {returnResult && (
          <div className="text-sm space-y-3">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold text-center">
              ✓ Book returned successfully
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Book</span><span className="font-semibold">{returnResult.issue?.book?.title || returnResult.data?.book?.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Borrower</span><span>{returnResult.issue?.borrowerName || returnResult.data?.borrowerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Late Days</span>
                <span className={returnResult.lateDays > 0 ? 'text-red-500 font-bold' : 'text-green-600'}>{returnResult.lateDays || 0} days</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Fine</span>
                <span className={returnResult.fineAmount > 0 ? 'text-red-500 font-bold text-lg' : 'text-green-600'}>
                  {returnResult.fineAmount > 0 ? `Rs. ${returnResult.fineAmount}` : 'No fine'}
                </span>
              </div>
            </div>
            {returnResult.fineAmount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">A fine has been generated. Collect it from the Fine Collection page.</p>
            )}
            <button onClick={() => setReturnResult(null)} className="btn-primary w-full justify-center">Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
