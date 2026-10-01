import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaLayerGroup } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

export default function FeeGroups() {
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
      const res = await api.get(`/fees/groups?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); reset({ name: '', description: '', status: 'active' }); setModal(true) }
  const openEdit = (row) => { setEditing(row); reset({ name: row.name, description: row.description || '', status: row.status }); setModal(true) }

  const onSubmit = async (d) => {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/fees/groups/${editing._id}`, d)
        toast.success('Fee Group updated')
      } else {
        await api.post('/fees/groups', d)
        toast.success('Fee Group created')
      }
      setModal(false); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onDelete = async () => {
    try {
      await api.delete(`/fees/groups/${delItem._id}`)
      toast.success('Deleted'); setDelItem(null); load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <FaLayerGroup size={16} className="text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Groups</h1>
            <p className="text-xs text-gray-400">{total} group{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><FaPlus size={12}/> Add Fee Group</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="field pl-9 text-sm" placeholder="Search by name…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="field text-sm w-36" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner/></div>
        ) : data.length === 0 ? (
          <EmptyState title="No Fee Groups found" sub="Add your first fee group to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Name</th>
              <th className="table-head">Description</th>
              <th className="table-head">Status</th>
              <th className="table-head">Created</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell font-semibold text-gray-800 dark:text-gray-100">{row.name}</td>
                  <td className="table-cell text-gray-500">{row.description || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${row.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{row.status}</span>
                  </td>
                  <td className="table-cell text-gray-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => openEdit(row)} className="text-primary-500 hover:text-primary-700 mr-3 transition-colors"><FaEdit size={14}/></button>
                    <button onClick={() => setDelItem(row)} className="text-red-400 hover:text-red-600 transition-colors"><FaTrash size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="groups"/>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Fee Group' : 'Add Fee Group'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Group Name *</label>
            <input className="field" {...register('name', { required: 'Name is required' })} placeholder="e.g. Tuition Fees"/>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field" rows={2} {...register('description')} placeholder="Optional description"/>
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
        title="Delete Fee Group" message={`Delete "${delItem?.name}"? This cannot be undone.`}/>
    </div>
  )
}
