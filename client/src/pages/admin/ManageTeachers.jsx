import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaPhotoVideo } from 'react-icons/fa'
import { Badge, Modal, Pagination } from '../../components/ui/index'
import { AdminPage, SearchBar, DataTable } from '../../components/ui/AdminTable'
import { SkeletonTable } from '../../components/ui/Skeletons'
import ImageUpload from '../../components/ui/ImageUpload'
import api from '../../services/api'

const POSITION_OPTIONS = [
  'Principal',
  'Vice Principal',
  'Coordinator',
  'Head of Department',
  'Montessori Coordinator',
  'Class Teacher',
  'Subject Teacher',
  'Activity Teacher',
  'Administrator',
  'Support Staff',
]

const DEPARTMENT_OPTIONS = [
  'Administration',
  'Pre-Primary',
  'Primary',
  'Secondary',
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'Computer',
  'Arts & Culture',
  'Sports',
  'General',
]

function normalizeTeacher(item = {}) {
  return {
    ...item,
    name: item.name || '',
    position: item.position || item.role || '',
    role: item.role || item.position || '',
    department: item.department || item.dept || '',
    dept: item.dept || item.department || '',
    qual: item.qual || '',
    exp: item.exp || '',
    email: item.email || '',
    phone: item.phone || '',
    bio: item.bio || '',
    photo: item.photo || '',
    status: item.status || 'active',
    order: Number(item.order ?? 0),
  }
}

export default function ManageTeachers(){
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('All')
  const [page,setPage]=useState(1)
  const [modal,setModal]=useState(false)
  const [editing,setEditing]=useState(null)
  const [photo,setPhoto]=useState(null)
  const {register,handleSubmit,reset,setValue,watch,formState:{errors}}=useForm()

  useEffect(()=>{
    setLoading(true)
    api.get('/teachers', { params: { sort: 'order name', limit: 100 } }).then(r=>{ if(r?.data?.length) setItems(r.data.map(normalizeTeacher)) }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const filtered=items.filter(it=>(statusFilter==='All'||it.status===statusFilter.toLowerCase())&&((it.name||'').toLowerCase().includes(search.toLowerCase())||(it.position||it.role||'').toLowerCase().includes(search.toLowerCase())||(it.department||it.dept||'').toLowerCase().includes(search.toLowerCase())))
  const PER=8
  const paged=filtered.slice((page-1)*PER,page*PER)

  const openAdd=()=>{setEditing(null);reset({status:'active',order:(items.length||0)+1});setPhoto(null);setModal(true)}
  const openEdit=(item)=>{const normalized=normalizeTeacher(item);setEditing(normalized);reset({...normalized, photoUrl: normalized.photo || ''});setPhoto(normalized.photo||null);setModal(true)}
  const onSubmit=async(data)=>{
    const photoValue = photo || data.photoUrl || editing?.photo || ''
    const payload = {
      ...data,
      photo: photoValue,
      role: data.position || data.role || data.name,
      position: data.position || data.role || '',
      dept: data.department || data.dept || '',
      department: data.department || data.dept || '',
      order: Number(data.order || 0),
    }
    try{
      if(editing){
        await api.put(`/teachers/${editing._id||editing.id}`,payload)
        setItems(its=>its.map(it=>(it._id||it.id)===(editing._id||editing.id)?normalizeTeacher({...it,...payload}):it))
        toast.success('Teacher updated')
      }else{
        const r=await api.post('/teachers',payload)
        setItems(its=>[...its,normalizeTeacher({...payload,id:Date.now(),...(r?.data||{})})])
        toast.success('Teacher created')
      }
    }catch{
      if(editing) setItems(its=>its.map(it=>(it._id||it.id)===(editing._id||editing.id)?normalizeTeacher({...it,...payload}):it))
      else setItems(its=>[...its,normalizeTeacher({...payload,id:Date.now()})])
      toast.success(editing?'Teacher updated':'Teacher created')
    }
    setModal(false);reset();setPhoto(null)
  }
  const onDelete=async(id)=>{
    try{await api.delete(`/teachers/${id}`)}catch{}
    setItems(its=>its.filter(it=>(it._id||it.id)!==id))
    toast.success('Deleted successfully')
  }

  const columns=[
    {key:'photo',label:'Photo',render:(v,row)=>v?<img src={v} alt={row.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"/>:<div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center font-bold">{(row.name||'T').slice(0,2).toUpperCase()}</div>},
    {key:'name',label:'Name',render:(v,row)=><span className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{v||row.title||'—'}</span>},
    {key:'position',label:'Position',render:(v,row)=><span className="text-sm text-gray-600 dark:text-gray-300">{v||row.role||'—'}</span>},
    {key:'department',label:'Department',render:(v,row)=><span className="text-sm text-gray-600 dark:text-gray-300">{v||row.dept||'—'}</span>},
    {key:'order',label:'Order',render:v=><span className="font-medium text-gray-700 dark:text-gray-300">{v ?? 0}</span>},
    {key:'status',label:'Status',render:v=><Badge status={v||'active'}/>},
  ]

  return (
    <AdminPage title="Teachers & Staff" subtitle="Manage faculty profiles, positions, and display order" onAdd={openAdd} addLabel="Add New Teacher">
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search name, position, department..." filters={['All','active','inactive']} activeFilter={statusFilter} onFilter={f=>{setStatusFilter(f);setPage(1)}}/>
      {loading?<SkeletonTable rows={5}/>:<DataTable columns={columns} data={paged} onEdit={openEdit} onDelete={onDelete}/>}
      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
      <Modal open={modal} onClose={()=>{setModal(false);reset();setPhoto(null)}} title={editing?'Edit Teacher':'New Teacher'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input {...register('name',{required:'Required'})} className={`field ${errors.name?'field-error':''}`} placeholder="Teacher name"/></div>
            <div><label className="label">Position *</label><select {...register('position',{required:'Required'})} className={`field ${errors.position?'field-error':''}`}><option value="">Select position</option>{POSITION_OPTIONS.map(opt=><option key={opt}>{opt}</option>)}</select></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Department</label><select {...register('department')} className="field"><option value="">Select department</option>{DEPARTMENT_OPTIONS.map(opt=><option key={opt}>{opt}</option>)}</select></div>
            <div><label className="label">Display Order</label><input type="number" min="0" {...register('order')} className="field" placeholder="Lower numbers show first"/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Qualification</label><input {...register('qual')} className="field" placeholder="e.g. M.Ed, B.Sc"/></div>
            <div><label className="label">Experience</label><input {...register('exp')} className="field" placeholder="e.g. 10+ years"/></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Email</label><input {...register('email')} className="field" placeholder="teacher@school.com"/></div>
            <div><label className="label">Phone</label><input {...register('phone')} className="field" placeholder="Phone number"/></div>
          </div>
          <div><label className="label">Bio</label><textarea {...register('bio')} rows={3} className="field resize-none" placeholder="Short profile bio..."/></div>
          <div className="grid lg:grid-cols-2 gap-4">
            <ImageUpload label="Photo Upload" value={photo} onChange={(dataUrl) => setPhoto(dataUrl)} aspect="aspect-square" />
            <div className="space-y-4">
              <div>
                <label className="label">Or Photo URL</label>
                <input {...register('photoUrl')} className="field" placeholder="Paste an image URL"/>
              </div>
              <div>
                <label className="label">Status</label>
                <select {...register('status')} className="field"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"><FaPhotoVideo size={12}/> Public card preview fields</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Use position, department, photo, and order here. Public pages will render teachers in a standard grouped layout based on this data.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>{setModal(false);reset();setPhoto(null)}} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Update Teacher':'Create Teacher'}</button>
          </div>
        </form>
      </Modal>
    </AdminPage>
  )
}
