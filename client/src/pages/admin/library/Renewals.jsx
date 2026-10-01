import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaSyncAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Pagination } from '../../../components/ui/index'

export default function Renewals() {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [renewItem, setRenewItem] = useState(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [renewing, setRenewing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ status: 'issued', page, limit: 15 })
      if (search) p.set('search', search)
      const res = await api.get(`/library/issues?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openRenew = (row) => {
    // Default new due date = current due + 14 days
    const d = new Date(row.dueDate)
    d.setDate(d.getDate() + 14)
    setNewDueDate(d.toISOString().slice(0,10))
    setRenewItem(row)
  }

  const doRenew = async () => {
    setRenewing(true)
    try {
      await api.put(`/library/issues/${renewItem._id}/renew`, { newDueDate })
      toast.success('Book renewed successfully!')
      setRenewItem(null); load()
    } catch (e) { toast.error(e.message) } finally { setRenewing(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
          <FaSyncAlt size={16} className="text-cyan-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Renewals</h1>
          <p className="text-xs text-gray-400">Renew book issues (max 2 renewals per issue)</p>
        </div>
      </div>

      <div className="relative mb-4">
        <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="field pl-9" placeholder="Search by borrower name…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}/>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No active issues" sub="No books are currently issued."/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue No</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Issue Date</th>
              <th className="table-head">Due Date</th>
              <th className="table-head text-center">Renewals</th>
              <th className="table-head text-right">Action</th>
            </tr></thead>
            <tbody>
              {data.map(row => {
                const canRenew = row.renewalCount < row.maxRenewals
                const isOverdue = new Date(row.dueDate) < new Date()
                return (
                  <tr key={row._id} className={`table-row ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{row.issueNo}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{row.borrowerName}</div>
                      <div className="text-[11px] text-gray-400 capitalize">{row.borrowerType}</div>
                    </td>
                    <td className="table-cell text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.book?.title}</td>
                    <td className="table-cell text-gray-400 text-xs">{new Date(row.issueDate).toLocaleDateString()}</td>
                    <td className="table-cell text-xs">
                      <span className={isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}>
                        {new Date(row.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        {[...Array(row.maxRenewals)].map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < row.renewalCount ? 'bg-primary-400' : 'bg-gray-200 dark:bg-gray-700'}`}/>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{row.renewalCount}/{row.maxRenewals}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <button onClick={() => openRenew(row)} disabled={!canRenew}
                        className={`py-1.5 px-3 text-xs rounded-lg font-semibold transition-all flex items-center gap-1 ml-auto ${canRenew ? 'btn-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}>
                        <FaSyncAlt size={11}/> {canRenew ? 'Renew' : 'Max reached'}
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

      <Modal open={!!renewItem} onClose={() => setRenewItem(null)} title="Renew Book Issue" size="sm">
        {renewItem && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm space-y-1">
              <div><span className="text-gray-400">Book:</span> <span className="font-semibold">{renewItem.book?.title}</span></div>
              <div><span className="text-gray-400">Borrower:</span> <span>{renewItem.borrowerName}</span></div>
              <div><span className="text-gray-400">Current Due:</span> <span>{new Date(renewItem.dueDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-400">Renewals Used:</span> <span className="font-semibold text-primary-600 dark:text-primary-400">{renewItem.renewalCount} of {renewItem.maxRenewals}</span></div>
            </div>
            <div>
              <label className="label">New Due Date *</label>
              <input type="date" className="field" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                min={new Date().toISOString().slice(0,10)}/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRenewItem(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={doRenew} disabled={renewing} className="btn-primary flex-1 justify-center">
                {renewing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
