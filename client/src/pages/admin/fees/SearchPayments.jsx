import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaEye, FaTimes, FaPrint } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

const METHODS = ['','cash','bank','cheque','esewa','khalti','fonepay','other']

export default function SearchPayments() {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search:'', paymentMethod:'', status:'', dateFrom:'', dateTo:'', academicYear:'' })
  const [viewItem, setViewItem] = useState(null)
  const [viewItems, setViewItems] = useState([])
  const [loadingView, setLoadingView] = useState(false)
  const [cancelItem, setCancelItem] = useState(null)

  const setF = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 15 })
      Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v) })
      const res = await api.get(`/fees/payments?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const openView = async (row) => {
    setViewItem(row); setLoadingView(true)
    try {
      const r = await api.get(`/fees/payments/${row._id}`)
      setViewItem(r.data)
      setViewItems(r.items || [])
    } catch (e) { toast.error(e.message) } finally { setLoadingView(false) }
  }

  const doCancel = async () => {
    try {
      await api.delete(`/fees/payments/${cancelItem._id}`)
      toast.success('Payment cancelled'); setCancelItem(null); load()
    } catch (e) { toast.error(e.message) }
  }

  const methodBadge = (m) => {
    const c = { cash:'badge-green', bank:'badge-gray', esewa:'badge-yellow', khalti:'badge-yellow', fonepay:'badge-yellow' }
    return <span className={`badge ${c[m] || 'badge-gray'} capitalize`}>{m}</span>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <FaSearch size={16} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Search Payments</h1>
          <p className="text-xs text-gray-400">{total} payment{total !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <input className="field text-sm col-span-2 md:col-span-1" placeholder="Student / Receipt No" value={filters.search} onChange={e => setF('search', e.target.value)}/>
        <select className="field text-sm" value={filters.paymentMethod} onChange={e => setF('paymentMethod', e.target.value)}>
          <option value="">All Methods</option>
          {METHODS.filter(Boolean).map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
        </select>
        <select className="field text-sm" value={filters.status} onChange={e => setF('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="field text-sm" placeholder="From" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)}/>
        <input type="date" className="field text-sm" placeholder="To" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)}/>
        <input className="field text-sm" placeholder="Academic Year" value={filters.academicYear} onChange={e => setF('academicYear', e.target.value)}/>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner/></div>
        ) : data.length === 0 ? (
          <EmptyState title="No payments found" sub="Try adjusting your filters."/>
        ) : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Receipt No</th>
              <th className="table-head">Student</th>
              <th className="table-head">Date</th>
              <th className="table-head text-right">Amount</th>
              <th className="table-head text-right">Discount</th>
              <th className="table-head text-right">Net Paid</th>
              <th className="table-head">Method</th>
              <th className="table-head">Status</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">{row.receiptNo}</td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{row.student?.studentName}</div>
                    <div className="text-[11px] text-gray-400">{row.student?.classApplying}</div>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{new Date(row.paymentDate).toLocaleDateString()}</td>
                  <td className="table-cell text-right font-mono">Rs. {Number(row.totalAmount).toLocaleString()}</td>
                  <td className="table-cell text-right font-mono text-blue-500">{row.discount > 0 ? `Rs. ${Number(row.discount).toLocaleString()}` : '—'}</td>
                  <td className="table-cell text-right font-mono font-bold text-green-600">Rs. {Number(row.netAmount).toLocaleString()}</td>
                  <td className="table-cell">{methodBadge(row.paymentMethod)}</td>
                  <td className="table-cell">
                    <span className={`badge ${row.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{row.status}</span>
                  </td>
                  <td className="table-cell text-right flex gap-2 justify-end">
                    <button onClick={() => openView(row)} className="text-primary-500 hover:text-primary-700"><FaEye size={14}/></button>
                    {row.status === 'paid' && (
                      <button onClick={() => setCancelItem(row)} className="text-red-400 hover:text-red-600"><FaTimes size={14}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="payments"/>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => { setViewItem(null); setViewItems([]) }} title="Payment Receipt" size="lg">
        {loadingView ? <div className="flex justify-center py-8"><Spinner/></div> : viewItem && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="label">Receipt No</span><p className="font-mono font-bold text-primary-600 dark:text-primary-400">{viewItem.receiptNo}</p></div>
              <div><span className="label">Date</span><p>{new Date(viewItem.paymentDate).toLocaleString()}</p></div>
              <div><span className="label">Student</span><p className="font-semibold">{viewItem.student?.studentName}</p></div>
              <div><span className="label">Class</span><p>{viewItem.student?.classApplying}</p></div>
              <div><span className="label">Method</span><p className="capitalize">{viewItem.paymentMethod}</p></div>
              <div><span className="label">Collected By</span><p>{viewItem.collectedBy?.name || '—'}</p></div>
            </div>
            {viewItems.length > 0 && (
              <table className="w-full text-sm mb-4 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <thead><tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="table-head">Fee Type</th>
                  <th className="table-head text-right">Amount</th>
                  <th className="table-head text-right">Discount</th>
                  <th className="table-head text-right">Net</th>
                </tr></thead>
                <tbody>
                  {viewItems.map(item => (
                    <tr key={item._id} className="border-t border-gray-50 dark:border-gray-800">
                      <td className="table-cell">{item.feeType?.name}</td>
                      <td className="table-cell text-right font-mono">Rs. {Number(item.amount).toLocaleString()}</td>
                      <td className="table-cell text-right font-mono text-blue-500">{item.discount > 0 ? `Rs. ${Number(item.discount).toLocaleString()}` : '—'}</td>
                      <td className="table-cell text-right font-mono font-bold text-green-600">Rs. {Number(item.net).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                    <td className="table-cell">Total</td>
                    <td className="table-cell text-right font-mono">Rs. {Number(viewItem.totalAmount).toLocaleString()}</td>
                    <td className="table-cell text-right font-mono text-blue-500">Rs. {Number(viewItem.discount).toLocaleString()}</td>
                    <td className="table-cell text-right font-mono text-primary-600 dark:text-primary-400">Rs. {Number(viewItem.netAmount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            )}
            <button onClick={() => window.print()} className="btn-primary w-full justify-center"><FaPrint size={13}/> Print Receipt</button>
          </div>
        )}
      </Modal>

      <Confirm open={!!cancelItem} onClose={() => setCancelItem(null)} onConfirm={doCancel}
        title="Cancel Payment" message={`Cancel receipt ${cancelItem?.receiptNo}? This cannot be undone.`}/>
    </div>
  )
}
