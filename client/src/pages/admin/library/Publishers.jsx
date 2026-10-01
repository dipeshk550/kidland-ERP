import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBuilding } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

export default function Publishers() {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [delItem, setDelItem] = useState(null)
  const [saving, setSaving]   = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 15 })
      if (search) p.set('search', search)
      if (status) p.set('status', status)
      const res = await api.get(`/library/publishers?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    reset({ name:'', address:'', contact:'', email:'', website:'', status:'active' })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r)
    reset({ name:r.name, address:r.address||'', contact:r.contact||'', email:r.email||'', website:r.website||'', status:r.status })
    setModal(true)
  }

  const onSubmit = async (d) => {
    setSaving(true)
    try {
      if (editing) { await api.put(`/library/publishers/${editing._id}`, d); toast.success('Updated') }
      else { await api.post('/library/publishers', d); toast.success('Publisher created') }
      setModal(false); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onDelete = async () => {
    try { await api.delete(`/library/publishers/${delItem._id}`); toast.success('Deleted'); setDelItem(null); load() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <FaBuilding size={16} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Publishers</h1>
            <p className="text-xs text-gray-400">{total} publishers</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><FaPlus size={12}/> Add Publisher</button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="field pl-9 text-sm" placeholder="Search publishers…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}/>
        </div>
        <select className="field text-sm w-36" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No publishers found"/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Name</th>
              <th className="table-head">Address</th>
              <th className="table-head">Contact</th>
              <th className="table-head">Email</th>
              <th className="table-head">Status</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell font-semibold text-gray-800 dark:text-gray-100">{row.name}</td>
                  <td className="table-cell text-gray-500 max-w-[140px] truncate">{row.address||'—'}</td>
                  <td className="table-cell text-gray-500">{row.contact||'—'}</td>
                  <td className="table-cell text-gray-500">{row.email||'—'}</td>
                  <td className="table-cell"><span className={`badge ${row.status==='active'?'badge-green':'badge-gray'}`}>{row.status}</span></td>
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
      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="publishers"/>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Publisher' : 'Add Publisher'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Publisher Name *</label>
            <input className="field" {...register('name', { required: 'Required' })} placeholder="e.g. Oxford University Press"/>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div><label className="label">Address</label><input className="field" {...register('address')} placeholder="City, Country"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Contact</label><input className="field" {...register('contact')}/></div>
            <div><label className="label">Email</label><input type="email" className="field" {...register('email')}/></div>
          </div>
          <div><label className="label">Website</label><input className="field" {...register('website')} placeholder="https://…"/></div>
          <div><label className="label">Status</label>
            <select className="field" {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select>
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
        title="Delete Publisher" message={`Delete "${delItem?.name}"?`}/>
    </div>
  )
}
