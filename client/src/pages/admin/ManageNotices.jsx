import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import { FaEdit, FaTrash } from 'react-icons/fa'
import { motion } from 'framer-motion'
import api from '../../services/api'

const CATS = ['Admission','Academic','Event','Holiday','Achievement','General']
const PER  = 8
const PRI_BADGE = { high:'badge-red', medium:'badge-yellow', low:'badge-gray' }

export default function ManageNotices() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('All')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirmId,setConfirmId]= useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Load from backend
  useEffect(() => {
    setLoading(true)
    api.get('/notices')
      .then(r => { if (r?.data?.length) setItems(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it =>
    (catFilter === 'All' || it.cat === catFilter) &&
    (it.title || '').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page-1)*PER, page*PER)

  const openAdd = () => {
    setEditing(null)
    reset({ title:'', cat:'General', priority:'medium', status:'published', desc:'' })
    setModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    // Explicitly reset with ALL existing field values
    reset({
      title:    item.title    || '',
      cat:      item.cat      || 'General',
      priority: item.priority || 'medium',
      status:   item.status   || 'published',
      desc:     item.desc     || item.description || '',
    })
    setModal(true)
  }

  const onSubmit = async (data) => {
    const now = new Date().toISOString().slice(0,10)
    try {
      if (editing) {
        await api.put(`/notices/${editing._id||editing.id}`, data)
        setItems(its => its.map(it => (it._id||it.id) === (editing._id||editing.id) ? { ...it, ...data } : it))
        toast.success('Notice updated successfully')
      } else {
        const r = await api.post('/notices', data)
        const newItem = { ...data, _id: r?.data?._id || Date.now().toString(), createdAt: now }
        setItems(its => [newItem, ...its])
        toast.success('Notice published successfully')
      }
    } catch (error) {
      toast.error(error.message || 'Unable to save notice')
      return
    }
    setModal(false)
    reset()
  }

  const onDelete = async (id) => {
    try { await api.delete(`/notices/${id}`) } catch (error) {
      toast.error(error.message || 'Unable to remove notice')
      return
    }
    setItems(its => its.filter(it => (it._id||it.id) !== id))
    toast.success('Notice removed')
  }

  return (
    <AdminPage title="Notice Board" subtitle="Publish and manage school announcements" onAdd={openAdd} addLabel="New Notice">
      <SearchBar
        value={search} onChange={v => { setSearch(v); setPage(1) }}
        placeholder="Search notices..."
        filters={['All', ...CATS]} activeFilter={catFilter}
        onFilter={f => { setCatFilter(f); setPage(1) }}
      />

      {loading ? <SkeletonTable rows={5} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Title','Category','Priority','Date','Status','Actions'].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">No notices found</td></tr>
                ) : paged.map((row, i) => (
                  <motion.tr key={row._id||row.id||i}
                    initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                    className="table-row">
                    <td className="table-cell">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{row.title}</span>
                    </td>
                    <td className="table-cell">{row.cat}</td>
                    <td className="table-cell">
                      <span className={`badge ${PRI_BADGE[row.priority]||'badge-gray'}`}>{row.priority}</span>
                    </td>
                    <td className="table-cell text-gray-500">{(row.createdAt||'').slice(0,10)}</td>
                    <td className="table-cell"><Badge status={row.status||'published'}/></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(row)}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <FaEdit size={12}/>
                        </button>
                        <button onClick={() => setConfirmId(row._id||row.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <FaTrash size={12}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); reset() }}
        title={editing ? 'Edit Notice' : 'New Notice'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Notice Title *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className={`field ${errors.title ? 'field-error' : ''}`}
              placeholder="e.g. Admission Open – 2083 B.S."
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          {/* Category / Priority / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('cat')} className="field">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="field">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="field">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea
              {...register('desc', { required: 'Description is required' })}
              rows={5}
              className={`field resize-none ${errors.desc ? 'field-error' : ''}`}
              placeholder="Write the full notice details here..."
            />
            {errors.desc && <p className="error-msg">{errors.desc.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Update Notice' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => onDelete(confirmId)}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
      />
    </AdminPage>
  )
}
