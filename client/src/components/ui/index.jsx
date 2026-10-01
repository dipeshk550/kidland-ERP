import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowUp, FaChevronRight, FaInbox, FaTimes } from 'react-icons/fa'

export function PageHero({ tag, title, sub, breadcrumbs = [] }) {
  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2d06 0%, #1a4a0a 50%, #0f2d06 100%)' }}>
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none"/>
      {/* Green top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #54B435, #86ef67, #54B435, transparent)' }}/>
      {/* Content */}
      <div className="relative z-10 wrap py-14 sm:py-20 md:py-24 text-center px-4">
        {tag && (
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-green-400 opacity-70"/>
            <p className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: '#86ef67' }}>{tag}</p>
            <span className="w-8 h-px bg-green-400 opacity-70"/>
          </div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
          {title}
        </motion.h1>
        {sub && (
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="text-white/65 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            {sub}
          </motion.p>
        )}
        {breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-1.5 mt-6 text-xs flex-wrap">
            <Link to="/" className="text-white/50 hover:text-green-300 transition-colors font-medium">Home</Link>
            {breadcrumbs.map(b => (
              <span key={b.label} className="flex items-center gap-1.5">
                <FaChevronRight size={8} className="text-white/30"/>
                {b.to
                  ? <Link to={b.to} className="text-white/50 hover:text-green-300 transition-colors font-medium">{b.label}</Link>
                  : <span className="text-white font-semibold">{b.label}</span>
                }
              </span>
            ))}
          </motion.div>
        )}
      </div>
      {/* Green bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #54B435, #86ef67, #54B435, transparent)' }}/>
    </div>
  )
}


export function SectionHeader({ tag, title, sub, center=true }) {
  return (
    <div className={`mb-10 md:mb-12 ${center?'text-center':''}`}>
      {tag && <p className={`section-tag mb-2 ${center?'flex justify-center':''}`}>{tag}</p>}
      <h2 className="section-title">{title}</h2>
      <div className={`section-div ${center?'mx-auto':''}`}/>
      {sub && <p className={`section-sub text-sm md:text-base ${center?'mx-auto':''}`}>{sub}</p>}
    </div>
  )
}

export function ScrollTop() {
  return null
}


export function EmptyState({ title='No data found', sub='' }) {
  return (
    <div className="text-center py-16 px-4">
      <FaInbox size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600"/>
      <p className="font-semibold text-gray-500 dark:text-gray-400">{title}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function Spinner({ size='md' }) {
  const s={sm:'w-5 h-5',md:'w-8 h-8',lg:'w-12 h-12'}[size]
  return <div className={`${s} border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin`}/>
}

export function Modal({ open, onClose, title, children, size='md' }) {
  const w={sm:'max-w-sm',md:'max-w-lg',lg:'max-w-2xl',xl:'max-w-4xl'}[size]
  useEffect(()=>{ if(open) document.body.style.overflow='hidden'; else document.body.style.overflow=''; return()=>{document.body.style.overflow=''} },[open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}>
          <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}}
            transition={{type:'spring',stiffness:320,damping:28}}
            className={`bg-white dark:bg-gray-900 w-full ${w} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl`}
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FaTimes size={13}/>
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Confirm({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={()=>{onConfirm();onClose()}} className="btn-danger">Delete</button>
      </div>
    </Modal>
  )
}

export function Badge({ status }) {
  const map={pending:'badge-yellow',approved:'badge-green',rejected:'badge-red',active:'badge-green',inactive:'badge-gray',published:'badge-green',draft:'badge-gray',unread:'badge-red',read:'badge-yellow',replied:'badge-green'}
  return <span className={`badge ${map[status]||'badge-gray'} capitalize`}>{status}</span>
}

export function Pagination({ page, total, perPage = 10, onChange, label = 'items' }) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null

  const handleChange = (p) => {
    onChange(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build smart page number list with ellipsis
  const getPages = () => {
    if (pages <= 7) return [...Array(pages)].map((_, i) => i + 1)
    const arr = []
    arr.push(1)
    if (page > 4) arr.push('...')
    const start = Math.max(2, page - 1)
    const end   = Math.min(pages - 1, page + 1)
    for (let i = start; i <= end; i++) arr.push(i)
    if (page < pages - 3) arr.push('...')
    arr.push(pages)
    return arr
  }

  const pageList = getPages()
  const btnBase = 'min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center'

  return (
    <div className="flex flex-col items-center gap-3 mt-10">
      <p className="text-xs text-gray-400">
        Page <span className="font-semibold text-gray-600 dark:text-gray-300">{page}</span> of <span className="font-semibold text-gray-600 dark:text-gray-300">{pages}</span>
        {' '}·{' '}
        <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span> {label} total
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Prev */}
        <button
          onClick={() => handleChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 disabled:opacity-35 disabled:cursor-not-allowed`}
        >
          <FaChevronRight className="rotate-180" size={11} />
        </button>

        {pageList.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => handleChange(p)}
              className={`${btnBase} ${
                page === p
                  ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => handleChange(page + 1)}
          disabled={page === pages}
          className={`${btnBase} border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400 disabled:opacity-35 disabled:cursor-not-allowed`}
        >
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}