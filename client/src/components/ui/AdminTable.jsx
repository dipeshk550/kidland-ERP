import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa'
import { Confirm, Pagination, EmptyState } from './index'

export function AdminPage({ title, subtitle, onAdd, addLabel='Add New', children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {onAdd && <button onClick={onAdd} className="btn-primary shrink-0"><FaPlus size={12}/>{addLabel}</button>}
      </div>
      {children}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder='Search...', filters=[], activeFilter, onFilter }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13}/>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="field pl-9"/>
      </div>
      {filters.length>0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <FaFilter className="text-gray-400" size={13}/>
          {filters.map(f=>(
            <button key={f} onClick={()=>onFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${f===activeFilter?'bg-primary-400 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function DataTable({ columns, data, onEdit, onDelete, emptyTitle='No records found' }) {
  const [confirmId, setConfirmId] = useState(null)
  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {columns.map(c=><th key={c.key} className="table-head">{c.label}</th>)}
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length===0 ? (
                <tr><td colSpan={columns.length+1}><EmptyState title={emptyTitle}/></td></tr>
              ) : data.map((row,i)=>(
                <motion.tr key={row.id||row._id||i}
                  initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className="table-row">
                  {columns.map(c=>(
                    <td key={c.key} className="table-cell">
                      {c.render ? c.render(row[c.key],row) : <span className="truncate max-w-[180px] block">{row[c.key]||'—'}</span>}
                    </td>
                  ))}
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && <button onClick={()=>onEdit(row)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><FaEdit size={12}/></button>}
                      {onDelete && <button onClick={()=>setConfirmId(row.id||row._id||i)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><FaTrash size={12}/></button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Confirm open={confirmId!==null} onClose={()=>setConfirmId(null)} onConfirm={()=>onDelete(confirmId)} title="Confirm Delete" message="Are you sure you want to delete this item? This action cannot be undone."/>
    </>
  )
}