import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBook } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'

export default function Books() {
  const [data, setData]         = useState([])
  const [categories, setCategories] = useState([])
  const [authors, setAuthors]   = useState([])
  const [publishers, setPublishers] = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [delItem, setDelItem]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    Promise.all([
      api.get('/library/categories?limit=200&status=active'),
      api.get('/library/authors?limit=200&status=active'),
      api.get('/library/publishers?limit=200&status=active'),
    ]).then(([c, a, p]) => {
      setCategories(c.data || [])
      setAuthors(a.data || [])
      setPublishers(p.data || [])
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: 15 })
      if (search)    p.set('search', search)
      if (catFilter) p.set('category', catFilter)
      const res = await api.get(`/library/books?${p}`)
      setData(res.data || [])
      setTotal(res.total || 0)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [page, search, catFilter])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    reset({ isbn:'', title:'', category:'', author:'', publisher:'', edition:'', pubYear:'', language:'English', price:0, totalQty:1, rack:'', shelf:'', description:'', status:'active' })
    setModal(true)
  }
  const openEdit = (r) => {
    setEditing(r)
    reset({ isbn:r.isbn||'', title:r.title, category:r.category?._id||'', author:r.author?._id||'', publisher:r.publisher?._id||'',
      edition:r.edition||'', pubYear:r.pubYear||'', language:r.language||'English', price:r.price||0,
      totalQty:r.totalQty, rack:r.rack||'', shelf:r.shelf||'', description:r.description||'', status:r.status })
    setModal(true)
  }

  const onSubmit = async (d) => {
    setSaving(true)
    try {
      if (editing) { await api.put(`/library/books/${editing._id}`, d); toast.success('Updated') }
      else { await api.post('/library/books', d); toast.success('Book added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const onDelete = async () => {
    try { await api.delete(`/library/books/${delItem._id}`); toast.success('Deleted'); setDelItem(null); load() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <FaBook size={16} className="text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Books</h1>
            <p className="text-xs text-gray-400">{total} books in library</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary"><FaPlus size={12}/> Add Book</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="field pl-9 text-sm" placeholder="Search by title…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}/>
        </div>
        <select className="field text-sm w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? <div className="flex justify-center py-16"><Spinner/></div>
        : data.length === 0 ? <EmptyState title="No books found" sub="Add books to the library collection."/>
        : (
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Title</th>
              <th className="table-head">ISBN</th>
              <th className="table-head">Category</th>
              <th className="table-head">Author</th>
              <th className="table-head text-center">Total</th>
              <th className="table-head text-center">Available</th>
              <th className="table-head text-center">Issued</th>
              <th className="table-head">Status</th>
              <th className="table-head text-right">Actions</th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 max-w-[180px] truncate">{row.title}</div>
                    <div className="text-[11px] text-gray-400">{row.publisher?.name || ''}</div>
                  </td>
                  <td className="table-cell font-mono text-xs text-gray-500">{row.isbn||'—'}</td>
                  <td className="table-cell"><span className="badge badge-gray">{row.category?.name||'—'}</span></td>
                  <td className="table-cell text-gray-500 text-xs">{row.author?.name||'—'}</td>
                  <td className="table-cell text-center font-bold text-gray-700 dark:text-gray-200">{row.totalQty}</td>
                  <td className="table-cell text-center">
                    <span className={`font-bold ${row.availableQty > 0 ? 'text-green-600' : 'text-red-500'}`}>{row.availableQty}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`font-bold ${row.issuedQty > 0 ? 'text-blue-500' : 'text-gray-400'}`}>{row.issuedQty}</span>
                  </td>
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
      <Pagination page={page} total={total} perPage={15} onChange={setPage} label="books"/>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Book' : 'Add Book'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Title *</label>
              <input className="field" {...register('title', { required: 'Required' })} placeholder="Book title"/>
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div><label className="label">ISBN</label><input className="field" {...register('isbn')} placeholder="e.g. 978-3-16-148410-0"/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="field" {...register('category')}>
                <option value="">Select</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Author</label>
              <select className="field" {...register('author')}>
                <option value="">Select</option>
                {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Publisher</label>
              <select className="field" {...register('publisher')}>
                <option value="">Select</option>
                {publishers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Edition</label><input className="field" {...register('edition')} placeholder="e.g. 3rd"/></div>
            <div><label className="label">Year</label><input className="field" {...register('pubYear')} placeholder="2023"/></div>
            <div><label className="label">Language</label><input className="field" {...register('language')}/></div>
            <div><label className="label">Price (Rs.)</label><input type="number" min="0" className="field" {...register('price')}/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Total Copies *</label>
              <input type="number" min="1" className="field" {...register('totalQty', { required: 'Required', min: 1 })}/>
              {errors.totalQty && <p className="text-red-500 text-xs mt-1">{errors.totalQty.message}</p>}
            </div>
            <div><label className="label">Rack</label><input className="field" {...register('rack')} placeholder="e.g. A-1"/></div>
            <div><label className="label">Shelf</label><input className="field" {...register('shelf')} placeholder="e.g. Top"/></div>
          </div>
          <div><label className="label">Description</label><textarea className="field" rows={2} {...register('description')}/></div>
          <div><label className="label">Status</label>
            <select className="field" {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : editing ? 'Update' : 'Add Book'}
            </button>
          </div>
        </form>
      </Modal>
      <Confirm open={!!delItem} onClose={() => setDelItem(null)} onConfirm={onDelete}
        title="Delete Book" message={`Delete "${delItem?.title}"? Active issues must be returned first.`}/>
    </div>
  )
}
