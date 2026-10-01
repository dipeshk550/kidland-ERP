import { useState, useEffect, useCallback } from 'react'
import { FaGavel } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

const statusBadge = (s) => {
  const cls = { unpaid:'badge-red', partial:'badge-yellow', paid:'badge-green', waived:'badge-gray' }
  return <span className={`badge ${cls[s]||'badge-gray'} capitalize`}>{s}</span>
}

export default function FineCollection() {
  const [data, setData]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState('')
  const [collectItem, setCollectItem] = useState(null)
  const [waiverItem, setWaiverItem]   = useState(null)
  const [paidAmount, setPaidAmount]   = useState('')
  const [payMethod, setPayMethod]     = useState('cash')
  const [waiverRemark, setWaiverRemark] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 15 })
      if (status) p.set('status', status)
      const res = await api.get(`/library/fines?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, status])

  useEffect(() => { load() }, [load])

  const doCollect = async () => {
    if (!paidAmount || Number(paidAmount) <= 0) return toast.error('Enter a valid amount')
    setSaving(true)
    try {
      await api.put(`/library/fines/${collectItem._id}/collect`, { paidAmount, paymentMethod: payMethod })
      toast.success('Fine collected!'); setCollectItem(null); setPaidAmount(''); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const doWaive = async () => {
    setSaving(true)
    try {
      await api.put(`/library/fines/${waiverItem._id}/waive`, { remarks: waiverRemark })
      toast.success('Fine waived'); setWaiverItem(null); setWaiverRemark(''); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <FaGavel size={16} className="text-red-500"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fine Collection</h1>
            <p className="text-xs text-gray-400">{total} fine record{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <select className="field text-sm w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No fines found"/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Type</th>
              <th className="table-head text-center">Late Days</th>
              <th className="table-head text-right">Fine</th>
              <th className="table-head text-right">Paid</th>
              <th className="table-head">Status</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell font-mono text-xs text-primary-600 dark:text-primary-400">{row.issue?.issueNo}</td>
                  <td className="table-cell font-medium text-gray-800 dark:text-gray-100">{row.issue?.borrowerName}</td>
                  <td className="table-cell text-gray-500 max-w-[120px] truncate">{row.issue?.book?.title}</td>
                  <td className="table-cell capitalize text-xs">
                    <span className="badge badge-yellow">{row.fineType?.replace('-',' ')}</span>
                  </td>
                  <td className="table-cell text-center">
                    {row.lateDays > 0 ? <span className="text-red-500 font-bold">{row.lateDays}</span> : '—'}
                  </td>
                  <td className="table-cell text-right font-mono font-bold text-red-500">Rs. {Number(row.fineAmount).toLocaleString()}</td>
                  <td className="table-cell text-right font-mono text-green-600">{row.paidAmount > 0 ? `Rs. ${Number(row.paidAmount).toLocaleString()}` : '—'}</td>
                  <td className="table-cell">{statusBadge(row.status)}</td>
                  <td className="table-cell text-right flex gap-2 justify-end">
                    {['unpaid','partial'].includes(row.status) && (
                      <button onClick={() => { setCollectItem(row); setPaidAmount(String(row.fineAmount - (row.paidAmount||0))) }}
                        className="text-xs btn-primary py-1 px-2">Collect</button>
                    )}
                    {['unpaid','partial'].includes(row.status) && (
                      <button onClick={() => setWaiverItem(row)}
                        className="text-xs btn-ghost py-1 px-2">Waive</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="fines"/>

      {/* Collect Modal */}
      <Modal open={!!collectItem} onClose={() => setCollectItem(null)} title="Collect Fine" size="sm">
        {collectItem && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm space-y-1">
              <div><span className="text-gray-400">Borrower:</span> <span className="font-semibold">{collectItem.issue?.borrowerName}</span></div>
              <div><span className="text-gray-400">Total Fine:</span> <span className="font-bold text-red-500">Rs. {Number(collectItem.fineAmount).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Already Paid:</span> <span>Rs. {Number(collectItem.paidAmount||0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Balance Due:</span> <span className="font-bold">Rs. {Number(collectItem.fineAmount - (collectItem.paidAmount||0)).toLocaleString()}</span></div>
            </div>
            <div>
              <label className="label">Amount to Collect (Rs.) *</label>
              <input type="number" min="1" max={collectItem.fineAmount - (collectItem.paidAmount||0)}
                className="field" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}/>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="field" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCollectItem(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={doCollect} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Collect'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Waive Modal */}
      <Modal open={!!waiverItem} onClose={() => setWaiverItem(null)} title="Waive Fine" size="sm">
        {waiverItem && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Waiving <span className="font-bold text-red-500">Rs. {Number(waiverItem.fineAmount).toLocaleString()}</span> fine for <span className="font-semibold">{waiverItem.issue?.borrowerName}</span>.
            </p>
            <div>
              <label className="label">Reason for Waiver</label>
              <textarea className="field" rows={2} value={waiverRemark} onChange={e => setWaiverRemark(e.target.value)} placeholder="Reason…"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWaiverItem(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={doWaive} disabled={saving} className="btn-danger flex-1 justify-center">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Confirm Waiver'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
