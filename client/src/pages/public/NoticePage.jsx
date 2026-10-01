import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { PageHero, ScrollTop } from '../../components/ui/index'
import { useNotices } from '../../hooks/useApi'

const CATS=['All','Admission','Academic','Event','Holiday','Achievement']
const CAT_BADGE={Admission:'badge-blue',Academic:'badge-green',Event:'badge-yellow',Holiday:'badge-gray',Achievement:'badge-green'}
const PER=6

export default function NoticePage(){
  const [search,setSearch]=useState('')
  const [cat,setCat]=useState('All')
  const [page,setPage]=useState(1)
  const [expanded,setExpanded]=useState(null)
  const {data}=useNotices({limit:50})
  const items=data?.data || []
  const filtered=useMemo(()=>items.filter(n=>(cat==='All'||n.cat===cat)&&(n.title.toLowerCase().includes(search.toLowerCase())||(n.desc||'').toLowerCase().includes(search.toLowerCase()))),[items,search,cat])
  const totalPages=Math.ceil(filtered.length/PER)
  const paged=filtered.slice((page-1)*PER,page*PER)
  return (
    <>
      <PageHero tag="Notices" title="Notice Board" sub="Latest announcements and important notices from Kidland School." breadcrumbs={[{label:'Notices'}]}/>
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="wrap px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search notices..." className="field pl-9"/></div>
            <div className="flex gap-1.5 flex-wrap">
              {CATS.map(c=><button key={c} onClick={()=>{setCat(c);setPage(1)}} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${c===cat?'bg-primary-400 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}>{c}</button>)}
            </div>
          </div>
          <div className="space-y-2.5">
            <AnimatePresence>
              {paged.length===0?<div className="text-center py-16 text-gray-400"><p>No notices found.</p></div>
                :paged.map((n,i)=>{
                  const d=new Date(n.createdAt||n.date)
                  return (
                    <motion.div key={n._id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                      className="card overflow-hidden cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all"
                      onClick={()=>setExpanded(expanded===n._id?null:n._id)}>
                      <div className="p-4 md:p-5 flex gap-3 md:gap-4">
                        <div className="shrink-0 text-center w-10 md:w-12">
                          <div className="text-[10px] font-bold text-white bg-primary-400 rounded-t px-1 py-0.5">{d.toLocaleString('en',{month:'short'})}</div>
                          <div className="text-base md:text-xl font-bold text-gray-800 dark:text-white border border-t-0 border-gray-200 dark:border-gray-700 rounded-b">{d.getDate()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className={`badge ${CAT_BADGE[n.cat]||'badge-gray'} text-[10px]`}>{n.cat}</span>
                            {n.priority==='high'&&<span className="badge badge-red text-[10px]">Urgent</span>}
                          </div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{n.title}</p>
                          <AnimatePresence>
                            {expanded===n._id&&<motion.p initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed overflow-hidden">{n.desc||n.description}</motion.p>}
                          </AnimatePresence>
                        </div>
                        <FaChevronDown className={`text-gray-300 shrink-0 transition-transform mt-1 ${expanded===n._id?'rotate-180':''}`} size={13}/>
                      </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </div>
          {totalPages>1&&(
            <div className="flex justify-center items-center gap-1.5 mt-8 flex-wrap">
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-40 hover:border-primary-400 text-gray-600 dark:text-gray-400 transition-colors"><FaChevronLeft size={11}/></button>
              {[...Array(totalPages)].map((_,i)=><button key={i} onClick={()=>setPage(i+1)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all border ${page===i+1?'bg-primary-400 border-primary-400 text-white':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400'}`}>{i+1}</button>)}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-40 hover:border-primary-400 text-gray-600 dark:text-gray-400 transition-colors"><FaChevronRight size={11}/></button>
            </div>
          )}
        </div>
      </section>
      <ScrollTop/>
    </>
  )
}
