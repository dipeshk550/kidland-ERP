import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaEdit, FaTrash } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { Badge, Modal, Pagination, Confirm } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import api from '../../services/api'

const DEMO = [
  { _id:'1', title:'Annual Sports Day 2025',       date:'June 5, 2025',   time:'7:00 AM',  venue:'School Ground',   cat:'Sports',   status:'active' },
  { _id:'2', title:'Science and Innovation Fair',  date:'June 20, 2025',  time:'9:00 AM',  venue:'Auditorium',      cat:'Academic', status:'active' },
  { _id:'3', title:'Annual Cultural Programme',    date:'July 15, 2025',  time:'10:00 AM', venue:'School Ground',   cat:'Cultural', status:'active' },
  { _id:'4', title:'Inter-School Debate',          date:'August 10, 2025',time:'11:00 AM', venue:'Conference Hall', cat:'Academic', status:'active' },
]
const CATS = ['Academic','Cultural','Sports','Social','Other']
const PER = 8

export default function ManageEvents() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirmId,setConfirmId]= useState(null)
  const { register, handleSubmit, reset, formState:{errors} } = useForm()

  useEffect(() => {
    setLoading(true)
    api.get('/events').then(r => { if (r?.data?.length) setItems(r.data) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it => (it.title||'').toLowerCase().includes(search.toLowerCase()))
  const paged    = filtered.slice((page-1)*PER, page*PER)

  const openAdd  = () => { setEditing(null); reset({ title:'', cat:'Academic', date:'', time:'', venue:'', desc:'', status:'active' }); setModal(true) }
  const openEdit = (item) => { setEditing(item); reset({ title:item.title||'', cat:item.cat||'Academic', date:item.date||'', time:item.time||'', venue:item.venue||'', desc:item.desc||item.description||'', status:item.status||'active' }); setModal(true) }

  const onSubmit = async (data) => {
    try {
      if (editing) { await api.put(`/events/${editing._id||editing.id}`, data); setItems(its => its.map(it=>(it._id||it.id)===(editing._id||editing.id)?{...it,...data}:it)); toast.success('Event updated') }
      else { const r = await api.post('/events', data); setItems(its => [{ ...data, _id:r?.data?._id||Date.now().toString() }, ...its]); toast.success('Event created') }
    } catch {
      if (editing) setItems(its => its.map(it=>(it._id||it.id)===(editing._id||editing.id)?{...it,...data}:it))
      else setItems(its => [{ ...data, _id:Date.now().toString() }, ...its])
      toast.success(editing ? 'Event updated' : 'Event created')
    }
    setModal(false); reset()
  }
  const onDelete = async (id) => {
    try { await api.delete(`/events/${id}`) } catch {}
    setItems(its => its.filter(it=>(it._id||it.id)!==id)); toast.success('Event deleted')
  }

  return (
    <AdminPage title="Events" subtitle="Manage school events and activities" onAdd={openAdd} addLabel="New Event">
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search events..."/>
      {loading?<SkeletonTable rows={5}/>:(
        <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700"><tr>{['Event Title','Category','Date','Time','Venue','Status','Actions'].map(h=><th key={h} className="table-head">{h}</th>)}</tr></thead>
          <tbody>
            {paged.length===0?<tr><td colSpan={7} className="text-center py-16 text-gray-400">No events found</td></tr>
              :paged.map((row,i)=>(
              <motion.tr key={row._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="table-row">
                <td className="table-cell"><span className="font-semibold text-gray-800 dark:text-gray-100">{row.title}</span></td>
                <td className="table-cell">{row.cat}</td>
                <td className="table-cell">{row.date}</td>
                <td className="table-cell">{row.time}</td>
                <td className="table-cell">{row.venue}</td>
                <td className="table-cell"><Badge status={row.status||'active'}/></td>
                <td className="table-cell"><div className="flex gap-2 justify-end">
                  <button onClick={()=>openEdit(row)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"><FaEdit size={12}/></button>
                  <button onClick={()=>setConfirmId(row._id||row.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><FaTrash size={12}/></button>
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table></div></div>
      )}
      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
      <Modal open={modal} onClose={()=>{setModal(false);reset()}} title={editing?'Edit Event':'New Event'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Event Title *</label><input {...register('title',{required:'Required'})} className={`field ${errors.title?'field-error':''}`} placeholder="Event name"/>{errors.title&&<p className="error-msg">{errors.title.message}</p>}</div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="label">Category</label><select {...register('cat')} className="field">{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Date *</label><input {...register('date',{required:'Required'})} className={`field ${errors.date?'field-error':''}`} placeholder="June 5, 2025"/>{errors.date&&<p className="error-msg">{errors.date.message}</p>}</div>
            <div><label className="label">Time</label><input {...register('time')} className="field" placeholder="9:00 AM"/></div>
          </div>
          <div><label className="label">Venue *</label><input {...register('venue',{required:'Required'})} className={`field ${errors.venue?'field-error':''}`} placeholder="School Ground"/>{errors.venue&&<p className="error-msg">{errors.venue.message}</p>}</div>
          <div><label className="label">Description</label><textarea {...register('desc')} rows={4} className="field resize-none" placeholder="Event description..."/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>{setModal(false);reset()}} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Update Event':'Create Event'}</button>
          </div>
        </form>
      </Modal>
      <Confirm open={confirmId!==null} onClose={()=>setConfirmId(null)} onConfirm={()=>onDelete(confirmId)} title="Delete Event" message="Delete this event permanently?"/>
    </AdminPage>
  )
}
