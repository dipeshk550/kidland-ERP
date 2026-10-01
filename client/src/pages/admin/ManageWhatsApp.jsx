import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaWhatsapp, FaReply, FaEye, FaCircle, FaCheckDouble, FaUsers, FaExternalLinkAlt, FaInfoCircle, FaInbox } from 'react-icons/fa'
import { Badge, Modal, Pagination } from '../../components/ui/index'
import { AdminPage, SearchBar } from '../../components/ui/AdminTable'
import api from '../../services/api'

const DEMO=[
  {_id:'1',senderName:'Mrs. Priya Sharma',message:'I would like to know about the admission process for 2083 B.S.',status:'unread',createdAt:'2025-05-20T09:15:00Z',source:'website_widget'},
  {_id:'2',senderName:'Mr. Ram Thapa',message:'What are the fee details and scholarship options?',status:'read',createdAt:'2025-05-19T14:30:00Z',source:'website_widget'},
  {_id:'3',senderName:'Ms. Sunita Gurung',message:'Can I schedule a visit to the school campus?',status:'replied',createdAt:'2025-05-19T10:00:00Z',source:'whatsapp_webhook',reply:'Yes, please call 9841404920 to schedule a visit.'},
  {_id:'4',senderName:'Mr. Bikash Rai',message:'Tell me about the Montessori programme for pre-primary.',status:'unread',createdAt:'2025-05-18T16:45:00Z',source:'website_widget'},
  {_id:'5',senderName:'Mrs. Anita Maharjan',message:'My daughter is in Grade 4. Can she join mid-year?',status:'read',createdAt:'2025-05-17T11:20:00Z',source:'website_widget'},
]
const WA=import.meta.env.VITE_WA_NUMBER||'9779841404920'
const STATUS_MAP={unread:{label:'Unread',cls:'badge-red'},read:{label:'Read',cls:'badge-yellow'},replied:{label:'Replied',cls:'badge-green'}}

function ago(iso){const d=Math.floor((Date.now()-new Date(iso))/1000);if(d<60)return'just now';if(d<3600)return`${Math.floor(d/60)}m ago`;if(d<86400)return`${Math.floor(d/3600)}h ago`;return`${Math.floor(d/86400)}d ago`}

export default function ManageWhatsApp(){
  const [msgs,setMsgs]=useState([])
  const [search,setSearch]=useState('')
  const [filter,setFilter]=useState('All')
  const [page,setPage]=useState(1)
  const [viewing,setViewing]=useState(null)
  const {register,handleSubmit,reset,formState:{errors}}=useForm()
  const PER=8

  useEffect(()=>{
    api.get('/whatsapp/messages').then(r=>{if(r?.data?.length)setMsgs(r.data)}).catch(()=>{})
  },[])

  const displayed=msgs.filter(m=>(filter==='All'||m.status===filter.toLowerCase())&&(m.senderName.toLowerCase().includes(search.toLowerCase())||m.message.toLowerCase().includes(search.toLowerCase())))
  const paged=displayed.slice((page-1)*PER,page*PER)

  const markRead=async(msg)=>{
    try{await api.put(`/whatsapp/messages/${msg._id}/read`)}catch{}
    setMsgs(p=>p.map(m=>m._id===msg._id?{...m,status:'read'}:m))
    setViewing(prev=>prev?._id===msg._id?{...prev,status:'read'}:prev)
  }

  const onReply=async(data)=>{
    try{await api.put(`/whatsapp/messages/${viewing._id}/reply`,{reply:data.reply})}catch{}
    setMsgs(p=>p.map(m=>m._id===viewing._id?{...m,status:'replied',reply:data.reply}:m))
    setViewing(prev=>({...prev,status:'replied',reply:data.reply}))
    toast.success('Reply sent via WhatsApp!')
    reset()
  }

  const openMsg=(msg)=>{setViewing(msg);if(msg.status==='unread')markRead(msg)}

  const stats={total:msgs.length,unread:msgs.filter(m=>m.status==='unread').length,read:msgs.filter(m=>m.status==='read').length,replied:msgs.filter(m=>m.status==='replied').length}

  return(
    <AdminPage title="WhatsApp Messages" subtitle="Messages from the website chat widget and WhatsApp Business">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <FaInfoCircle size={16} className="mt-0.5 shrink-0"/>
        <div>Messages from the website widget are saved automatically. For two-way messaging, set <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs">WA_PHONE_NUMBER_ID</code> and <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs">WA_ACCESS_TOKEN</code> in <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs">server/.env</code>. <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-1">Learn more <FaExternalLinkAlt size={10}/></a></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[{label:'Total',val:stats.total,color:'bg-blue-50 dark:bg-blue-900/20',ic:'text-blue-500'},{label:'Unread',val:stats.unread,color:'bg-red-50 dark:bg-red-900/20',ic:'text-red-500'},{label:'Read',val:stats.read,color:'bg-yellow-50 dark:bg-yellow-900/20',ic:'text-yellow-500'},{label:'Replied',val:stats.replied,color:'bg-green-50 dark:bg-green-900/20',ic:'text-green-500'}].map(s=>(
          <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="card p-4">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-2`}><FaWhatsapp className={s.ic} size={18}/></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </div>
      <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search messages..." filters={['All','Unread','Read','Replied']} activeFilter={filter} onFilter={f=>{setFilter(f);setPage(1)}}/>
      <div className="card overflow-hidden">
        {paged.length===0?<div className="text-center py-16 text-gray-400"><FaInbox size={36} className="mx-auto mb-3 opacity-30"/><p>No messages found</p></div>:(
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {paged.map((msg,i)=>{
              const S=STATUS_MAP[msg.status]
              return(
                <motion.div key={msg._id||i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${msg.status==='unread'?'bg-primary-50/40 dark:bg-primary-900/10':''}`}
                  onClick={()=>openMsg(msg)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{background:'linear-gradient(135deg,#25d366,#128c7e)'}}>{msg.senderName?.[0]||'W'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`font-semibold text-sm ${msg.status==='unread'?'text-gray-900 dark:text-white':'text-gray-700 dark:text-gray-300'}`}>{msg.senderName}</span>
                      <span className={`badge ${S.cls} text-[10px]`}>{S.label}</span>
                      {msg.source==='whatsapp_webhook'&&<span className="badge badge-green text-[10px]"><FaWhatsapp size={8}/>WA</span>}
                    </div>
                    <p className={`text-sm truncate ${msg.status==='unread'?'text-gray-700 dark:text-gray-200':'text-gray-500 dark:text-gray-400'}`}>{msg.message}</p>
                    {msg.reply&&<p className="text-xs text-primary-500 mt-0.5 truncate flex items-center gap-1"><FaReply size={9}/>{msg.reply}</p>}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 flex flex-col items-end gap-1">
                    <span>{ago(msg.createdAt)}</span>
                    {msg.status==='unread'&&<span className="w-2 h-2 rounded-full bg-primary-400 block"/>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <Pagination page={page} total={displayed.length} perPage={PER} onChange={setPage}/>
      <Modal open={!!viewing} onClose={()=>setViewing(null)} title="Message Details" size="md">
        {viewing&&(
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{background:'linear-gradient(135deg,#25d366,#128c7e)'}}>{viewing.senderName?.[0]||'W'}</div>
              <div><div className="font-bold text-gray-900 dark:text-white">{viewing.senderName}</div><div className="flex items-center gap-2 mt-0.5"><span className={`badge ${STATUS_MAP[viewing.status]?.cls}`}>{STATUS_MAP[viewing.status]?.label}</span><span className="text-xs text-gray-400">{ago(viewing.createdAt)}</span></div></div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"><p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Message</p><p className="text-gray-800 dark:text-gray-100 leading-relaxed text-sm">{viewing.message}</p></div>
            {viewing.reply&&<div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800"><p className="text-xs font-bold text-primary-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FaReply size={10}/>Your Reply</p><p className="text-gray-700 dark:text-gray-300 text-sm">{viewing.reply}</p></div>}
            {viewing.status!=='replied'&&(
              <form onSubmit={handleSubmit(onReply)} className="space-y-3">
                <div><label className="label">Send Reply via WhatsApp</label><textarea {...register('reply',{required:'Required'})} rows={3} className={`field resize-none ${errors.reply?'field-error':''}`} placeholder="Type your reply..."/>{errors.reply&&<p className="error-msg">{errors.reply.message}</p>}</div>
                <div className="flex gap-3">
                  <button type="button" onClick={()=>setViewing(null)} className="btn-ghost flex-1 justify-center">Close</button>
                  <button type="submit" className="btn-primary flex-1 justify-center"><FaWhatsapp size={13}/>Send Reply</button>
                </div>
              </form>
            )}
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Re: ${viewing.message}`)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{background:'linear-gradient(135deg,#25d366,#128c7e)'}}>
              <FaWhatsapp size={14}/>Open in WhatsApp
            </a>
          </div>
        )}
      </Modal>
    </AdminPage>
  )
}
