import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import ImageUpload from '../../components/ui/ImageUpload'
import api from '../../services/api'

const DEMO = [
  { _id:'1', title:'Kidland Wins Inter-School Debate 2025', cat:'Achievement', status:'published', createdAt:'2025-05-15', views:248, excerpt:'Our students brought home first place at the Lalitpur debate championship.' },
  { _id:'2', title:'New Computer Lab Inaugurated',          cat:'Infrastructure',status:'published',createdAt:'2025-05-10', views:183, excerpt:'State-of-the-art lab with 40 workstations launched.' },
  { _id:'3', title:'Annual Science Fair 2025 Highlights',   cat:'Academic',     status:'published',createdAt:'2025-04-28', views:312, excerpt:'Students showcased innovative science projects.' },
  { _id:'4', title:'Scholarship Programme Open for 2083',   cat:'Admission',    status:'draft',    createdAt:'2025-03-25', views:0,   excerpt:'Merit and need-based scholarships available for new admissions.' },
]
const CATS = ['Achievement','Infrastructure','Academic','Admission','Event','General']
const PER = 8

export default function ManageNews() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirmId,setConfirmId]= useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    setLoading(true)
    api.get('/news').then(r => {
      const items = Array.isArray(r) ? r : (r?.data ?? [])
      if (items.length) setItems(items)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it =>
    (filter === 'All' || it.status === filter.toLowerCase()) &&
    (it.title||'').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page-1)*PER, page*PER)

  const openAdd = () => {
    setEditing(null)
    setImgPreview(null)
    reset({ title:'', cat:'General', status:'draft', excerpt:'', content:'' })
    setModal(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    setImgPreview(item.img || item.image || null)
    reset({ title:item.title||'', cat:item.cat||'General', status:item.status||'draft', excerpt:item.excerpt||'', content:item.content||'' })
    setModal(true)
  }
  const onSubmit = async (formValues) => {
    const data = { ...formValues, img: imgPreview }
    const now = new Date().toISOString().slice(0, 10)
    try {
      if (editing) {
        const r = await api.put(`/news/${editing._id || editing.id}`, data)
        const saved = r?.data ?? { ...data }
        setItems(its => its.map(it => (it._id || it.id) === (editing._id || editing.id) ? { ...it, ...saved } : it))
        toast.success('Article updated')
      } else {
        const r = await api.post('/news', data)
        const saved = r?.data ?? {}
        setItems(its => [{ ...data, _id: saved._id || Date.now().toString(), createdAt: now, views: 0 }, ...its])
        toast.success('Article published')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save article')
      return
    }
    setModal(false); reset(); setImgPreview(null)
  }
  const onDelete = async (id) => {
    try { await api.delete(`/news/${id}`) } catch {}
    setItems(its => its.filter(it => (it._id||it.id) !== id)); toast.success('Article deleted')
  }

  return (
    <AdminPage title="News & Blog" subtitle="Manage school news articles and blog posts" onAdd={openAdd} addLabel="New Article">
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search articles..."
        filters={['All','Published','Draft']} activeFilter={filter} onFilter={f=>{setFilter(f);setPage(1)}}/>
      {loading ? <SkeletonTable rows={5}/> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>{['Image','Title','Category','Views','Date','Status','Actions'].map(h=><th key={h} className="table-head">{h}</th>)}</tr>
              </thead>
              <tbody>
                {paged.length===0?<tr><td colSpan={7} className="text-center py-16 text-gray-400">No articles found</td></tr>
                  :paged.map((row,i)=>(
                  <motion.tr key={row._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="table-row">
                    <td className="table-cell">
                      {row.img ? <img src={row.img} alt="" className="w-12 h-9 object-cover rounded-lg" /> : <div className="w-12 h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />}
                    </td>
                    <td className="table-cell"><span className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{row.title}</span></td>
                    <td className="table-cell">{row.cat}</td>
                    <td className="table-cell"><span className="flex items-center gap-1 text-gray-500"><FaEye size={11}/>{row.views||0}</span></td>
                    <td className="table-cell text-gray-500">{(row.createdAt||'').slice(0,10)}</td>
                    <td className="table-cell"><Badge status={row.status||'draft'}/></td>
                    <td className="table-cell">
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>openEdit(row)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"><FaEdit size={12}/></button>
                        <button onClick={()=>setConfirmId(row._id||row.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><FaTrash size={12}/></button>
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
      <Modal open={modal} onClose={()=>{setModal(false);reset();setImgPreview(null)}} title={editing?'Edit Article':'New Article'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Title *</label><input {...register('title',{required:'Required'})} className={`field ${errors.title?'field-error':''}`} placeholder="Article title"/>{errors.title&&<p className="error-msg">{errors.title.message}</p>}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Category</label><select {...register('cat')} className="field">{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Status</label><select {...register('status')} className="field"><option value="draft">Draft</option><option value="published">Published</option></select></div>
          </div>
          <div><label className="label">Excerpt</label><textarea {...register('excerpt')} rows={2} className="field resize-none" placeholder="Short summary..."/></div>
          <div><label className="label">Content *</label><textarea {...register('content',{required:'Required'})} rows={6} className={`field resize-none ${errors.content?'field-error':''}`} placeholder="Full article content..."/>{errors.content&&<p className="error-msg">{errors.content.message}</p>}</div>
          <ImageUpload label="Featured Image" value={imgPreview} onChange={(dataUrl) => setImgPreview(dataUrl)} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>{setModal(false);reset();setImgPreview(null)}} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Update Article':'Publish Article'}</button>
          </div>
        </form>
      </Modal>
      <Confirm open={confirmId!==null} onClose={()=>setConfirmId(null)} onConfirm={()=>onDelete(confirmId)} title="Delete Article" message="Delete this article permanently?"/>
    </AdminPage>
  )
}
