import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FaEdit, FaTrash, FaGraduationCap } from 'react-icons/fa'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import ImageUpload from '../../components/ui/ImageUpload'
import api from '../../services/api'

const DEMO = [
  { _id:'1', name:'Anish Maharjan', batch:'2079', achievement:'Pursuing Engineering at Pulchowk Campus', quote:'Kidland gave me the discipline and academic foundation that made everything after SEE feel achievable.', status:'active' },
  { _id:'2', name:'Sristi Tamang',  batch:'2078', achievement:'GPA 3.85 — Studying Medicine (MBBS)', quote:"The teachers at Kidland believed in me even when I didn't believe in myself.", status:'active' },
  { _id:'3', name:'Bijay Shrestha', batch:'2077', achievement:'Bachelor in Business Studies, now running own startup', quote:'Kidland is where I learned confidence and curiosity matter as much as grades.', status:'active' },
]
const PER = 10

export default function ManageAlumni() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [batchFilter, setBatchFilter] = useState('All')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirmId,setConfirmId]= useState(null)
  const [photo,    setPhoto]    = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    setLoading(true)
    api.get('/alumni', { params: { status: undefined, limit: 500 } })
      .then(r => { if (r?.data?.length) setItems(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const batches = useMemo(() => {
    const set = new Set(items.map(i => i.batch).filter(Boolean))
    return [...set].sort((a, b) => Number(b) - Number(a))
  }, [items])

  const filtered = items.filter(it =>
    (batchFilter === 'All' || it.batch === batchFilter) &&
    (it.name || '').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page-1)*PER, page*PER)

  const openAdd = () => {
    setEditing(null)
    setPhoto(null)
    reset({ name:'', batch:'', achievement:'', quote:'', status:'active' })
    setModal(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    setPhoto(item.photo || null)
    reset({ name:item.name||'', batch:item.batch||'', achievement:item.achievement||'', quote:item.quote||'', status:item.status||'active' })
    setModal(true)
  }

  const onSubmit = async (formValues) => {
    const data = { ...formValues, photo }
    try {
      if (editing) {
        await api.put(`/alumni/${editing._id||editing.id}`, data)
        setItems(its => its.map(it => (it._id||it.id)===(editing._id||editing.id)?{...it,...data}:it))
        toast.success('Alumni record updated')
      } else {
        const r = await api.post('/alumni', data)
        setItems(its => [{ ...data, _id: r?.data?._id || Date.now().toString() }, ...its])
        toast.success('Alumni added')
      }
    } catch {
      if (editing) setItems(its => its.map(it => (it._id||it.id)===(editing._id||editing.id)?{...it,...data}:it))
      else setItems(its => [{ ...data, _id: Date.now().toString() }, ...its])
      toast.success(editing ? 'Alumni record updated' : 'Alumni added')
    }
    setModal(false); reset(); setPhoto(null)
  }

  const onDelete = async (id) => {
    try { await api.delete(`/alumni/${id}`) } catch {}
    setItems(its => its.filter(it => (it._id||it.id) !== id))
    toast.success('Alumni record removed')
  }

  return (
    <AdminPage title="Alumni" subtitle="Manage alumni profiles, grouped by SEE batch year" onAdd={openAdd} addLabel="Add Alumnus">
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search alumni by name..."
        filters={['All', ...batches]} activeFilter={batchFilter} onFilter={f=>{setBatchFilter(f);setPage(1)}}/>

      {loading ? <SkeletonTable rows={5}/> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>{['Photo','Name','Batch','Achievement','Status','Actions'].map(h=><th key={h} className="table-head">{h}</th>)}</tr>
              </thead>
              <tbody>
                {paged.length===0?<tr><td colSpan={6} className="text-center py-16 text-gray-400">No alumni found</td></tr>
                  :paged.map((row,i)=>(
                  <motion.tr key={row._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="table-row">
                    <td className="table-cell">
                      {row.photo
                        ? <img src={row.photo} alt="" className="w-9 h-9 object-cover rounded-full" />
                        : <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs">
                            <FaGraduationCap size={13}/>
                          </div>}
                    </td>
                    <td className="table-cell"><span className="font-semibold text-gray-800 dark:text-gray-100">{row.name}</span></td>
                    <td className="table-cell"><span className="badge badge-green">Batch {row.batch}</span></td>
                    <td className="table-cell text-gray-500 max-w-xs truncate">{row.achievement || '—'}</td>
                    <td className="table-cell"><Badge status={row.status||'active'}/></td>
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

      <Modal open={modal} onClose={()=>{setModal(false);reset();setPhoto(null)}} title={editing?'Edit Alumnus':'Add Alumnus'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name',{required:'Required'})} className={`field ${errors.name?'field-error':''}`} placeholder="Student full name"/>
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">SEE Batch / Graduation Year *</label>
              <input
                {...register('batch', {
                  required: 'Batch year is required',
                  validate: value => {
                    const year = String(value).trim()
                    return /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 2200
                      ? true
                      : 'Enter a valid 4-digit year (1900–2200)'
                  },
                })}
                className={`field ${errors.batch ? 'field-error' : ''}`}
                placeholder="e.g. 2083"
                inputMode="numeric"
                maxLength={4}
              />
              {errors.batch && <p className="error-msg">{errors.batch.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Current Achievement / Status</label>
            <input {...register('achievement')} className="field" placeholder="e.g. Studying Engineering at Pulchowk Campus"/>
          </div>
          <div>
            <label className="label">Quote / Testimonial</label>
            <textarea {...register('quote')} rows={3} className="field resize-none" placeholder="A short quote from this alumnus about their Kidland experience..."/>
          </div>
          <ImageUpload label="Photo" value={photo} onChange={(d) => setPhoto(d)} aspect="aspect-square" />
          <div>
            <label className="label">Status</label>
            <select {...register('status')} className="field">
              <option value="active">Active (visible on site)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>{setModal(false);reset();setPhoto(null)}} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Update Alumnus':'Add Alumnus'}</button>
          </div>
        </form>
      </Modal>
      <Confirm open={confirmId!==null} onClose={()=>setConfirmId(null)} onConfirm={()=>onDelete(confirmId)} title="Remove Alumnus" message="Remove this alumni record permanently?"/>
    </AdminPage>
  )
}
