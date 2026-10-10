import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaTimes,
  FaUserShield, FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash,
  FaPlus, FaKey, FaExclamationTriangle, FaDownload, FaSync,
  FaCalendarAlt, FaClock, FaChevronLeft, FaChevronRight,
  FaDatabase, FaUser, FaShieldAlt
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../services/api'

/* ─── Constants ─────────────────────────────────────────── */
const ACTIONS = ['login','logout','create','edit','delete','approve','export',
                 'password-reset','password-reset-request','admin-password-reset']
const ENTITIES = ['user','role','user-permissions','admission','fee','library',
                  'transport','lms','attendance','news','events','notice']
const PER_PAGE = 30

/* ─── Action styles ─────────────────────────────────────── */
const ACTION_META = {
  login:                   { icon: FaSignInAlt,          cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',  dot: 'bg-green-400'  },
  logout:                  { icon: FaSignOutAlt,         cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',        dot: 'bg-gray-400'   },
  create:                  { icon: FaPlus,               cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     dot: 'bg-blue-400'   },
  edit:                    { icon: FaEdit,               cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-400'  },
  delete:                  { icon: FaTrash,              cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-400'    },
  approve:                 { icon: FaShieldAlt,          cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-400' },
  export:                  { icon: FaDownload,           cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-400' },
  'password-reset':        { icon: FaKey,                cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-400' },
  'password-reset-request':{ icon: FaKey,                cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-400' },
  'admin-password-reset':  { icon: FaUserShield,         cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-400'    },
}
const getAction = a => ACTION_META[a] || { icon: FaExclamationTriangle, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' }

/* ─── Helpers ───────────────────────────────────────────── */
const fmt = iso => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
const fmtDate = iso => {
  const d = new Date(iso)
  const today = new Date(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
const dayKey = iso => new Date(iso).toDateString()

/* Group log entries by calendar day */
function groupByDay(items) {
  const map = {}
  items.forEach(item => {
    const key = dayKey(item.createdAt)
    if (!map[key]) map[key] = { label: fmtDate(item.createdAt), items: [] }
    map[key].items.push(item)
  })
  return Object.values(map)
}

/* Pretty-print details object */
function DetailsCell({ details }) {
  const [open, setOpen] = useState(false)
  if (!details || Object.keys(details).length === 0) return <span className="text-gray-400 text-xs">—</span>
  const str = JSON.stringify(details, null, 2)
  const preview = Object.entries(details).slice(0, 2).map(([k, v]) =>
    `${k}: ${typeof v === 'object' ? '[object]' : String(v).slice(0, 30)}`
  ).join(' · ')
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
        {open ? <FaChevronUp size={9}/> : <FaChevronDown size={9}/>}
        {open ? 'Hide' : preview}
      </button>
      {open && (
        <pre className="mt-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-w-xs">
          {str}
        </pre>
      )}
    </div>
  )
}

/* Role badge */
function RolePill({ role }) {
  const cls = { superadmin:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', admin:'bg-purple-100 text-purple-700', coadmin:'bg-blue-100 text-blue-700', teacher:'bg-green-100 text-green-700', parent:'bg-amber-100 text-amber-700' }
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cls[role] || 'bg-gray-100 text-gray-600'}`}>{role}</span>
}

/* Single log entry row */
function LogRow({ log }) {
  const { icon: Icon, cls, dot } = getAction(log.action)
  return (
    <div className="flex gap-3 sm:gap-4 py-3 group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <div className={`w-2 h-2 rounded-full ${dot} ring-2 ring-white dark:ring-gray-900 mt-1`}/>
        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1"/>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          {/* Action badge */}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
            <Icon size={9}/>{log.action}
          </span>
          {/* Entity */}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full capitalize">
            <FaDatabase size={8} className="inline mr-1 opacity-50"/>{log.entity}
          </span>
          {/* Time */}
          <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto shrink-0">
            <FaClock size={9}/>{fmt(log.createdAt)}
          </span>
        </div>

        {/* Actor */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <FaUser size={8} className="text-primary-600 dark:text-primary-400"/>
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {log.actor?.name || 'System'}
          </span>
          {log.actor?.role && <RolePill role={log.actor.role}/>}
          {log.actor?.email && (
            <span className="hidden sm:inline text-xs text-gray-400 truncate">{log.actor.email}</span>
          )}
        </div>

        {/* Details */}
        <div className="pl-7">
          <DetailsCell details={log.details}/>
          {log.ip && (
            <p className="text-[10px] text-gray-400 mt-1">IP: {log.ip}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* Day group heading */
function DayGroup({ label, count, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group mb-1"
      >
        <FaCalendarAlt size={12} className="text-primary-500 shrink-0"/>
        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{label}</span>
        <span className="ml-auto text-xs text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full font-semibold">
          {count} {count === 1 ? 'entry' : 'entries'}
        </span>
        {collapsed
          ? <FaChevronDown size={10} className="text-gray-400 shrink-0"/>
          : <FaChevronUp   size={10} className="text-gray-400 shrink-0"/>}
      </button>
      {!collapsed && (
        <div className="pl-2 sm:pl-3 border-l-2 border-gray-100 dark:border-gray-800 ml-3">
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Filter panel ──────────────────────────────────────── */
function FilterPanel({ filters, setFilters, onApply, onReset, loading }) {
  const [open, setOpen] = useState(false)
  const activeCount = [filters.action, filters.entity, filters.search, filters.from, filters.to].filter(Boolean).length
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
          activeCount > 0
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-300'
        }`}
      >
        <FaFilter size={12}/>
        Filters
        {activeCount > 0 && (
          <span className="bg-primary-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {open ? <FaChevronUp size={10}/> : <FaChevronDown size={10}/>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-80 sm:w-96 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-800 dark:text-white text-sm">Filter Logs</p>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">
              <FaTimes size={11}/>
            </button>
          </div>

          <div className="space-y-3">
            {/* Action */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Action</label>
              <select
                value={filters.action}
                onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                className="field text-sm"
              >
                <option value="">All Actions</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Entity */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Module / Entity</label>
              <select
                value={filters.entity}
                onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))}
                className="field text-sm"
              >
                <option value="">All Modules</option>
                {ENTITIES.map(e => <option key={e} value={e} className="capitalize">{e}</option>)}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                  className="field text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                  className="field text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { onReset(); setOpen(false) }}
              className="flex-1 btn-ghost text-sm py-2"
            >
              Reset
            </button>
            <button
              onClick={() => { onApply(); setOpen(false) }}
              disabled={loading}
              className="flex-1 btn-primary text-sm py-2 justify-center"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main component ────────────────────────────────────── */
export default function AuditLog() {
  const [items,    setItems]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [filters,  setFilters]  = useState({ action:'', entity:'', from:'', to:'' })
  const debounceRef = useRef(null)

  const load = useCallback(async (pg = 1, srch = search, flt = filters) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: pg, limit: PER_PAGE })
      if (srch)      params.set('search', srch)
      if (flt.action) params.set('action', flt.action)
      if (flt.entity) params.set('entity', flt.entity)
      if (flt.from)   params.set('from',   flt.from)
      if (flt.to)     params.set('to',     flt.to)
      const res = await api.get(`/rbac/audit?${params}`)
      setItems(res.data  || [])
      setTotal(res.total || 0)
      setPages(res.pages || 1)
      setPage(pg)
    } catch (e) { setError(e.message) }
    finally     { setLoading(false) }
  }, [search, filters])

  useEffect(() => { load(1) }, [])

  // Debounced search
  const handleSearch = val => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(1, val, filters), 380)
  }

  const handleApply = () => load(1, search, filters)
  const handleReset = () => {
    const blank = { action:'', entity:'', from:'', to:'' }
    setFilters(blank); setSearch(''); load(1, '', blank)
  }

  const grouped = groupByDay(items)

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <FaShieldAlt className="text-primary-600" size={18}/>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Audit Log</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Complete trace of all system activity and security events
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Events', value: total, icon: FaDatabase,    cls: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20'    },
          { label: 'Today',        value: grouped[0]?.label === 'Today' ? grouped[0]?.items?.length : 0, icon: FaCalendarAlt, cls: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Showing',      value: items.length, icon: FaFilter,       cls: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Page',         value: `${page} / ${pages}`, icon: FaChevronRight, cls: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
        ].map(s => (
          <div key={s.label} className="card p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={s.cls} size={15}/>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13}/>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by user, action, module…"
            className="field pl-9 text-sm w-full"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors">
              <FaTimes size={12}/>
            </button>
          )}
        </div>

        {/* Filters + Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <FilterPanel filters={filters} setFilters={setFilters} onApply={handleApply} onReset={handleReset} loading={loading}/>
          <button
            onClick={() => load(page)}
            disabled={loading}
            title="Refresh"
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 transition-all"
          >
            <FaSync size={13} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {(filters.action || filters.entity || filters.from || filters.to) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.action && (
            <span className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800">
              Action: {filters.action}
              <button onClick={() => { const f = {...filters, action:''}; setFilters(f); load(1, search, f) }}><FaTimes size={9}/></button>
            </span>
          )}
          {filters.entity && (
            <span className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800">
              Module: {filters.entity}
              <button onClick={() => { const f = {...filters, entity:''}; setFilters(f); load(1, search, f) }}><FaTimes size={9}/></button>
            </span>
          )}
          {(filters.from || filters.to) && (
            <span className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800">
              {filters.from && `From: ${filters.from}`}{filters.from && filters.to && ' · '}{filters.to && `To: ${filters.to}`}
              <button onClick={() => { const f = {...filters, from:'', to:''}; setFilters(f); load(1, search, f) }}><FaTimes size={9}/></button>
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="card p-4 sm:p-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm mb-4">
            <FaExclamationTriangle size={14} className="shrink-0"/>
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl mb-2"/>
                {[...Array(3)].map((__, j) => (
                  <div key={j} className="flex gap-3 py-2 pl-4">
                    <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-2 shrink-0"/>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3"/>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"/>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FaDatabase size={24} className="text-gray-400"/>
            </div>
            <p className="font-bold text-gray-500 dark:text-gray-400">No audit entries found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term</p>
            <button onClick={handleReset} className="mt-4 btn-ghost text-sm">Clear all filters</button>
          </div>
        ) : (
          grouped.map(group => (
            <DayGroup key={group.label} label={group.label} count={group.items.length}>
              {group.items.map(log => <LogRow key={log._id} log={log}/>)}
            </DayGroup>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)}</span> of <span className="font-semibold">{total}</span> entries
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft size={12}/>
            </button>
            {[...Array(Math.min(pages, 7))].map((_, i) => {
              const pg = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i
              if (pg < 1 || pg > pages) return null
              return (
                <button
                  key={pg}
                  onClick={() => load(pg)}
                  className={`w-9 h-9 rounded-xl border text-sm font-semibold transition-all ${
                    pg === page
                      ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-300 hover:text-primary-500'
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              disabled={page >= pages}
              onClick={() => load(page + 1)}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronRight size={12}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
