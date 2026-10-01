import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaPercentage } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

const TYPES = ['scholarship','sibling','merit','special','transport','other']

export default function Discounts() {
  const [data, setData]         = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [delItem, setDelItem]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [stuQuery, setStuQuery] = useState('')
  const [stuSugs, setStuSugs]   = useState([])
  const [selStu, setSelStu]     = useState(null)
  const debRef = useRef()
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()

  const isPercent = watch('isPercent')

  useEffect(() => {
    api.get('/fees/types?limit=200&status=active').then(r => setFeeTypes(r.data || [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 15 })
      if (status) p.set('status', status)
      const res = await api.get(`/fees/discounts?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, status])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    clearTimeout(debRef.current)
    if (stuQuery.length < 2) { setStuSugs([]); return }
    debRef.current = setTimeout(async () => {
      try { const r = await api.get(`/fees/student/search?q=${encodeURIComponent(stuQuery)}`); setStuSugs(r.data || []) }
      catch { setStuSugs([]) }
    }, 300)
  }, [stuQuery])

  const openAdd = () => {
    setEditing(null); setSelStu(null); setStuQuery('')
    reset({ feeType:'', discountType:'other', value:'', isPercent:false, reason:'', startDate:'', endDate:'', status:'active', remarks:'' })
    setModal(true)
  }
  const openEdit = (row) => {
    setEditing(row)
    setSelStu(row.student)
    setStuQuery(row.student?.studentName || '')
    reset({
      feeType: row.feeType?._id || '', discountType: row.discountType, value: row.value,
      isPercent: row.isPercent, reason: row.reason || '', status: row.status,
      startDate: row.startDate ? row.startDate.slice(0,10) : '',
      endDate:   row.endDate   ? row.endDate.slice(0,10)   : '',
      remarks:   row.remarks   || '',
    })
    setModal(true)
  }

  const onSubmit = async (d) => {
    if (!selStu && !editing) return toast.error('Select a student')
    setSaving(true)
    try {
      const payload = { ...d, student: selStu?._id || editing?.student?._id }
      if (editing) { await api.put(`/fees/discounts/${editing._id}`, payload); toast.success('Updated') }
      else { await api.post('/fees/discounts', payload); toast.success('Discount created') }
      setModal(false); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onDelete = async () => {
    try { await api.delete(`/fees/discounts/${delItem._id}`); toast.success('Deleted'); setDelItem(null); load() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
            <FaPercentage size={16} className="text-pink-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Discounts & Scholarships</h1>
            <p className="text-xs text-gray-400">{total} record{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><FaPlus size={12}/> Add Discount</button>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="field text-sm w-36" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No discounts found"/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Student</th>
              <th className="table-head">Type</th>
              <th className="table-head">Value</th>
              <th className="table-head">Fee Type</th>
              <th className="table-head">Status</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell">
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{row.student?.studentName}</div>
                    <div className="text-[11px] text-gray-400">{row.student?.classApplying}</div>
                  </td>
                  <td className="table-cell capitalize"><span className="badge badge-yellow">{row.discountType}</span></td>
                  <td className="table-cell font-mono font-bold text-primary-600 dark:text-primary-400">
                    {row.isPercent ? `${row.value}%` : `Rs. ${Number(row.value).toLocaleString()}`}
                  </td>
                  <td className="table-cell text-gray-500">{row.feeType?.name || 'All Fees'}</td>
                  <td className="table-cell">
                    <span className={`badge ${row.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{row.status}</span>
                  </td>
                  <td className="table-cell text-right">
                    <button onClick={() => openEdit(row)} className="text-primary-500 hover:text-primary-700 mr-3"><FaEdit size={14}/></button>
                    <button onClick={() => setDelItem(row)} className="text-red-400 hover:text-red-600"><FaTrash size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="discounts"/>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Discount' : 'Add Discount / Scholarship'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Student Search */}
          <div>
            <label className="label">Student *</label>
            <div className="relative">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="field pl-9" value={stuQuery} onChange={e => setStuQuery(e.target.value)}
                placeholder="Search student…" autoComplete="off"/>
              {stuSugs.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                  {stuSugs.map(s => (
                    <button key={s._id} type="button" onClick={() => { setSelStu(s); setStuQuery(s.studentName); setStuSugs([]) }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="font-semibold">{s.studentName}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.classApplying}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selStu && <p className="text-xs text-green-600 mt-1">✓ {selStu.studentName} — {selStu.classApplying}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Discount Type</label>
              <select className="field" {...register('discountType')}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Applicable Fee Type</label>
              <select className="field" {...register('feeType')}>
                <option value="">All Fees</option>
                {feeTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Value *</label>
              <input type="number" min="0" className="field" {...register('value', { required: 'Required', min: 0 })} placeholder="0"/>
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex items-center gap-3 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isPercent')} className="w-4 h-4 accent-primary-500"/>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Percentage (%)</span>
                </label>
                {isPercent && <span className="text-xs text-gray-400">Enter 0–100</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <input className="field" {...register('reason')} placeholder="Reason for discount"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" className="field" {...register('startDate')}/></div>
            <div><label className="label">End Date</label><input type="date" className="field" {...register('endDate')}/></div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
      <Confirm open={!!delItem} onClose={() => setDelItem(null)} onConfirm={onDelete}
        title="Delete Discount" message={`Remove this discount for ${delItem?.student?.studentName}?`}/>
    </div>
  )
}
