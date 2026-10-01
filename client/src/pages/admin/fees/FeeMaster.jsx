import { useState, useEffect, useRef } from 'react'
import { FaPlus, FaTrash, FaSave, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'

const GRADES = [
  'Play Group','Nursery','LKG','UKG',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10',
]
const FREQS  = ['monthly','yearly','one-time','quarterly','half-yearly']
const CY     = new Date().getFullYear()
const DEF_YR = `${CY}-${String(CY + 1).slice(-2)}`

// Common fee names for autocomplete suggestions
const SUGGESTIONS = [
  'Monthly Tuition Fee','Admission Fee','Re-Admission Fee','Examination Fee',
  'Hostel Fee','Mess / Food Fee','Breakfast Fee','Lunch Fee','Dinner Fee',
  'Bus Fee','Van Fee','Mini-Bus Fee','Transportation Fee',
  'Computer Lab Fee','Science Lab Fee','Library Fee',
  'Sports Fee','Scouts Fee','NCC Fee','Extra-Curricular Fee',
  'Additional Classes Fee','Stationery Fee','Uniform Fee',
  'Medical / Health Fee','Development Fee','Building Fund',
  'Annual Function Fee','Tour / Excursion Fee','Miscellaneous Fee',
]

let rowId = 0
const newRow = (name = '', amount = '', freq = 'monthly') => ({
  id:       ++rowId,
  name,
  amount,
  freq,
  typeId:   null,   // existing fee type id (if matched)
  masterId: null,   // existing master id (if loaded)
  saved:    false,
})

export default function FeeMaster() {
  const [grade, setGrade]   = useState('')
  const [year, setYear]     = useState(DEF_YR)
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loaded, setLoaded]   = useState(false)

  // For autocomplete
  const [allTypes, setAllTypes] = useState([])  // { _id, name, frequency, feeGroup }
  const [defaultGroupId, setDefaultGroupId] = useState(null)

  // Load fee types on mount
  useEffect(() => {
    api.get('/fees/types?limit=500').then(r => setAllTypes(r.data || [])).catch(() => {})
    // Ensure a default group exists
    api.get('/fees/groups?limit=100&status=active').then(r => {
      const groups = r.data || []
      if (groups.length > 0) {
        setDefaultGroupId(groups[0]._id)
      } else {
        // Create a default group
        api.post('/fees/groups', { name: 'General', status: 'active' })
          .then(res => setDefaultGroupId(res.data?._id))
          .catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Load existing masters for selected grade+year
  const load = async () => {
    if (!grade) return toast.error('Select a grade first')
    setLoading(true); setLoaded(false); setRows([])
    try {
      const r = await api.get(`/fees/masters?class=${encodeURIComponent(grade)}&academicYear=${year}&limit=500`)
      const masters = r.data || []
      if (masters.length === 0) {
        setRows([newRow()])   // start with one blank row
      } else {
        setRows(masters.map(m => newRow(
          m.feeType?.name || '',
          String(m.amount || ''),
          m.frequency || m.feeType?.frequency || 'monthly',
        )).map((r, i) => ({
          ...r,
          typeId:   masters[i].feeType?._id || null,
          masterId: masters[i]._id,
          saved:    true,
        })))
      }
      setLoaded(true)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const addRow = () => setRows(p => [...p, newRow()])

  const updateRow = (id, field, val) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val, saved: false,
      // if name changes, reset typeId so it can be re-matched on save
      ...(field === 'name' ? { typeId: null } : {}) } : r))

  const removeRow = (id) => setRows(p => p.filter(r => r.id !== id))

  // ── Save all ──────────────────────────────────────────────────────────────
  const saveAll = async () => {
    const valid = rows.filter(r => r.name.trim() && Number(r.amount) > 0)
    if (valid.length === 0) return toast.error('Add at least one fee with a name and amount')

    setSaving(true)
    let saved = 0, skipped = 0

    try {
      for (const row of rows) {
        if (!row.name.trim()) { skipped++; continue }
        if (!row.amount || Number(row.amount) <= 0) { skipped++; continue }

        // 1. Find or create fee type
        let typeId = row.typeId
        if (!typeId) {
          // Check if a type with this name already exists
          const existing = allTypes.find(t => t.name.toLowerCase().trim() === row.name.toLowerCase().trim())
          if (existing) {
            typeId = existing._id
          } else {
            // Create new fee type
            const gid = defaultGroupId
            if (!gid) { toast.error('No fee category found. Please create one in Fee Types first.'); continue }
            const res = await api.post('/fees/types', {
              name: row.name.trim(),
              feeGroup: gid,
              defaultAmount: Number(row.amount),
              frequency: row.freq,
              status: 'active',
            })
            typeId = res.data?._id
            // Update allTypes cache
            if (res.data) setAllTypes(p => [...p, res.data])
          }
        }
        if (!typeId) continue

        // 2. Create or update fee master
        const body = {
          feeType: typeId, class: grade, academicYear: year,
          amount: Number(row.amount), frequency: row.freq, status: 'active',
        }
        if (row.masterId) {
          await api.put(`/fees/masters/${row.masterId}`, body)
        } else {
          const res = await api.post('/fees/masters', body)
          const newMasterId = res.data?._id
          setRows(p => p.map(r => r.id === row.id ? { ...r, masterId: newMasterId, typeId, saved: true } : r))
        }
        saved++
      }

      // Delete masters for removed rows (rows that had masterId but were removed)
      toast.success(`✓ ${saved} fee item${saved !== 1 ? 's' : ''} saved for ${grade}!`)
      await load()   // reload to sync state
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xl">
          📋
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Structure Setup</h1>
          <p className="text-xs text-gray-400">Set fee amounts for each grade</p>
        </div>
      </div>

      {/* Grade + Year selector */}
      <div className="card p-4 mb-4 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Grade / Class</label>
          <select className="field text-sm" value={grade} onChange={e => { setGrade(e.target.value); setLoaded(false); setRows([]) }}>
            <option value="">— Select Grade —</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Academic Year</label>
          <input className="field w-28 text-sm" value={year}
            onChange={e => setYear(e.target.value)} placeholder="2082-83"/>
        </div>
        <button onClick={load} disabled={loading || !grade} className="btn-primary h-10 px-5">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : 'Load'}
        </button>
      </div>

      {/* Fee Spreadsheet */}
      {loaded && (
        <div className="card overflow-hidden mb-4">
          {/* Title bar */}
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between">
            <div>
              <span className="font-bold">{grade}</span>
              <span className="text-indigo-200 mx-1.5">·</span>
              <span className="text-indigo-200 text-sm">{year}</span>
            </div>
            <span className="text-indigo-100 text-sm">{rows.filter(r => r.name).length} fee item{rows.filter(r => r.name).length !== 1 ? 's' : ''}</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <div className="col-span-5">Fee Item Name</div>
            <div className="col-span-3">Amount (Rs.)</div>
            <div className="col-span-3">Frequency</div>
            <div className="col-span-1"/>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {rows.map((row, idx) => (
              <FeeRow key={row.id} row={row} idx={idx}
                allTypes={allTypes}
                onChange={(field, val) => updateRow(row.id, field, val)}
                onDelete={() => removeRow(row.id)}
                canDelete={rows.length > 1}
              />
            ))}
          </div>

          {/* Add row */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <button onClick={addRow}
              className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              <FaPlus size={11}/> Add Fee Item
            </button>
          </div>

          {/* Total */}
          {total > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total per period</span>
              <span className="font-black font-mono text-lg text-primary-600 dark:text-primary-400">
                Rs. {total.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      {loaded && (
        <button onClick={saveAll} disabled={saving}
          className="w-full btn-primary py-3 text-base font-bold justify-center">
          {saving
            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : <><FaSave size={14}/> Save Fee Structure for {grade}</>}
        </button>
      )}

      {/* Empty state */}
      {!loaded && !loading && (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-4">🎒</div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Select a grade and click Load</p>
          <p className="text-xs mt-1">You can add or edit fee items for that grade</p>
        </div>
      )}
    </div>
  )
}

/* ── Single fee row with autocomplete ──────────────────────────────────────── */
function FeeRow({ row, idx, allTypes, onChange, onDelete, canDelete }) {
  const [showSugs, setShowSugs] = useState(false)
  const ref = useRef()

  const suggestions = row.name.length >= 1
    ? [...new Set([
        ...allTypes.map(t => t.name),
        ...SUGGESTIONS,
      ])].filter(s => s.toLowerCase().includes(row.name.toLowerCase()) && s.toLowerCase() !== row.name.toLowerCase())
      .slice(0, 8)
    : []

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">

      {/* Name with autocomplete */}
      <div className="col-span-5 relative" ref={ref}>
        <input
          className={`field text-sm font-medium py-2 ${row.saved ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10' : ''}`}
          placeholder={`Fee item ${idx + 1} name…`}
          value={row.name}
          onChange={e => { onChange('name', e.target.value); setShowSugs(true) }}
          onFocus={() => setShowSugs(true)}
          onBlur={() => setTimeout(() => setShowSugs(false), 150)}
        />
        {row.saved && <FaCheck size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"/>}
        {/* Suggestions */}
        {showSugs && suggestions.length > 0 && (
          <div className="absolute top-full mt-0.5 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button key={s} type="button"
                onMouseDown={() => { onChange('name', s); setShowSugs(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="col-span-3 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Rs.</span>
        <input
          type="number" min={0} step={1}
          className="field text-sm text-right font-mono font-bold py-2 pl-8 pr-3"
          placeholder="0"
          value={row.amount}
          onChange={e => onChange('amount', e.target.value)}
        />
      </div>

      {/* Frequency */}
      <div className="col-span-3">
        <select className="field text-xs py-2 capitalize"
          value={row.freq} onChange={e => onChange('freq', e.target.value)}>
          {FREQS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
        </select>
      </div>

      {/* Delete */}
      <div className="col-span-1 flex justify-center">
        {canDelete && (
          <button onClick={onDelete}
            className="text-red-300 hover:text-red-500 transition-colors p-1">
            <FaTrash size={12}/>
          </button>
        )}
      </div>
    </div>
  )
}
