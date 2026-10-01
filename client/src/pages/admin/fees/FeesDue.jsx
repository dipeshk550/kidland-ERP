import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaExclamationTriangle, FaFileAlt, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { EmptyState, Spinner } from '../../../components/ui/index'

const GRADES = ['Nursery','LKG','UKG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10']
const CY = new Date().getFullYear()
const DEFAULT_YEAR = `${CY}-${String(CY + 1).slice(-2)}`

// Days overdue → aging bucket label + color
function getAgingBucket(outstanding) {
  // We don't have individual due dates per student, so bucket by outstanding amount thresholds
  // Instead we'll track lastPaymentDate to infer aging
  return null
}

function agingFromLastPayment(lastPaymentDate, hasDue) {
  if (!hasDue) return { label: 'Cleared', cls: 'badge-green', days: -1 }
  if (!lastPaymentDate) return { label: 'Never Paid', cls: 'badge-red', days: 9999 }
  const days = Math.floor((new Date() - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24))
  if (days <= 30)  return { label: `${days}d ago`, cls: 'badge-yellow', days }
  if (days <= 60)  return { label: `${days}d ago`, cls: 'badge-yellow', days }
  if (days <= 90)  return { label: `${days}d ago`, cls: 'badge-red',    days }
  return { label: `${days}d ago`, cls: 'badge-red', days }
}

const AGING_BUCKETS = [
  { key: 'cleared',  label: '✓ Cleared',       range: 'Fully paid',         cls: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  textCls: 'text-green-600' },
  { key: 'current',  label: 'Current',          range: '0 – 30 days',        cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',      textCls: 'text-blue-600'  },
  { key: 'overdue1', label: '1 Month Overdue',  range: '31 – 60 days',       cls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',  textCls: 'text-amber-600' },
  { key: 'overdue2', label: '2 Months Overdue', range: '61 – 90 days',       cls: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', textCls: 'text-orange-600' },
  { key: 'critical', label: 'Critical',         range: 'No payment >90 days', cls: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',         textCls: 'text-red-600'   },
]

function getBucketKey(row) {
  if (row.outstanding <= 0) return 'cleared'
  const { days } = agingFromLastPayment(row.lastPaymentDate, row.outstanding > 0)
  if (days === 9999) return 'critical'
  if (days <= 30)    return 'current'
  if (days <= 60)    return 'overdue1'
  if (days <= 90)    return 'overdue2'
  return 'critical'
}

export default function FeesDue() {
  const navigate = useNavigate()
  const [data, setData]                 = useState([])
  const [loading, setLoading]           = useState(false)
  const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR)
  const [classFilter, setClassFilter]   = useState('')
  const [activeBucket, setActiveBucket] = useState('all')
  const [loaded, setLoaded]             = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setData([]); setLoaded(false)
    try {
      const p = new URLSearchParams()
      if (academicYear) p.set('academicYear', academicYear)
      if (classFilter)  p.set('class', classFilter)
      const res = await api.get(`/fees/due?${p}`)
      const sorted = (res.data || []).sort((a, b) => b.outstanding - a.outstanding)
      setData(sorted)
      setLoaded(true)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }, [academicYear, classFilter])

  // ── bucket grouping ────────────────────────────────────────────────────────
  const bucketCounts = AGING_BUCKETS.reduce((acc, b) => {
    acc[b.key] = data.filter(r => getBucketKey(r) === b.key)
    return acc
  }, {})

  const filtered = data.filter(r => {
    const bucketOk  = activeBucket === 'all' || getBucketKey(r) === activeBucket
    const searchOk  = !searchFilter || r.student.studentName.toLowerCase().includes(searchFilter.toLowerCase())
    return bucketOk && searchOk
  })

  // ── totals ─────────────────────────────────────────────────────────────────
  const totals = filtered.reduce((acc, r) => ({
    fees:  acc.fees  + r.totalFees,
    paid:  acc.paid  + r.totalPaid,
    disc:  acc.disc  + (r.totalDiscount || 0),
    due:   acc.due   + r.outstanding,
  }), { fees: 0, paid: 0, disc: 0, due: 0 })

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <FaExclamationTriangle size={16} className="text-red-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fees Due</h1>
          <p className="text-xs text-gray-400">Outstanding fee analysis with aging buckets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="label">Academic Year</label>
            <input className="field w-28 text-sm" value={academicYear}
              onChange={e => setAcademicYear(e.target.value)} placeholder="2081-82"/>
          </div>
          <div>
            <label className="label">Class</label>
            <select className="field w-40 text-sm" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button onClick={load} className="btn-primary h-10 px-5">
            <FaSearch size={12}/> Load Due List
          </button>
        </div>
      </div>

      {/* Aging Bucket Cards */}
      {loaded && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {/* All button */}
          <button
            onClick={() => setActiveBucket('all')}
            className={`card p-3 text-left transition-all border-2 ${activeBucket === 'all' ? 'border-gray-400 dark:border-gray-500' : 'border-transparent'}`}>
            <div className="text-lg font-black text-gray-700 dark:text-gray-200">{data.length}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">All Students</div>
          </button>
          {AGING_BUCKETS.map(b => {
            const rows = bucketCounts[b.key] || []
            const total = rows.reduce((s, r) => s + r.outstanding, 0)
            return (
              <button key={b.key}
                onClick={() => setActiveBucket(b.key)}
                className={`card p-3 text-left border-2 transition-all ${b.cls} ${activeBucket === b.key ? 'border-current ring-2 ring-offset-1' : 'border-transparent'}`}>
                <div className={`text-lg font-black ${b.textCls}`}>{rows.length}</div>
                <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{b.label}</div>
                <div className="text-[9px] text-gray-400">{b.range}</div>
                {total > 0 && <div className={`text-[10px] font-mono font-semibold mt-1 ${b.textCls}`}>Rs. {Number(total).toLocaleString()}</div>}
              </button>
            )
          })}
        </div>
      )}

      {/* Summary Row */}
      {loaded && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Students',         filtered.length,                   'text-gray-700 dark:text-gray-200', 'bg-gray-50 dark:bg-gray-800/50'],
            ['Total Billed',     totals.fees,                       'text-gray-700 dark:text-gray-200', 'bg-gray-50 dark:bg-gray-800/50'],
            ['Total Collected',  totals.paid,                       'text-green-600', 'bg-green-50 dark:bg-green-900/20'],
            ['Total Outstanding',totals.due,                        'text-red-600',   'bg-red-50 dark:bg-red-900/20'],
          ].map(([l, v, tc, bg]) => (
            <div key={l} className={`card p-4 ${bg}`}>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{l}</div>
              <div className={`text-xl font-black ${tc}`}>
                {typeof v === 'number' && l !== 'Students' ? `Rs. ${Number(v).toLocaleString()}` : v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search within results */}
      {loaded && data.length > 0 && (
        <div className="relative mb-3">
          <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="field pl-9 text-sm" placeholder="Filter by student name…"
            value={searchFilter} onChange={e => setSearchFilter(e.target.value)}/>
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3"><Spinner/><p className="text-sm text-gray-400">Calculating outstanding fees…</p></div>
        ) : !loaded ? (
          <div className="text-center py-16 text-gray-400">
            <FaExclamationTriangle size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700"/>
            <p className="font-semibold">Select filters and click Load Due List</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No outstanding fees" sub="All students in this selection are fully paid up!"/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head w-8">#</th>
                  <th className="table-head">Student</th>
                  <th className="table-head">Class</th>
                  <th className="table-head text-right">Total Billed</th>
                  <th className="table-head text-right">Concession</th>
                  <th className="table-head text-right">Paid</th>
                  <th className="table-head text-right">Outstanding</th>
                  <th className="table-head text-center">Last Payment</th>
                  <th className="table-head text-center">Age</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const bucket  = getBucketKey(row)
                  const { label: ageLabel, cls: ageCls } = agingFromLastPayment(row.lastPaymentDate, row.outstanding > 0)
                  const isCleared = row.outstanding <= 0
                  const rowBg = {
                    cleared:  '',
                    current:  '',
                    overdue1: 'bg-amber-50/40 dark:bg-amber-900/5',
                    overdue2: 'bg-orange-50/40 dark:bg-orange-900/5',
                    critical: 'bg-red-50/40 dark:bg-red-900/5',
                  }[bucket]

                  return (
                    <tr key={row.student._id} className={`table-row ${rowBg}`}>
                      <td className="table-cell text-gray-400 text-xs">{i + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {row.student.studentName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100">{row.student.studentName}</div>
                            <div className="text-[10px] text-gray-400">{row.student.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-gray-600 dark:text-gray-400 text-xs">{row.student.classApplying}</td>
                      <td className="table-cell text-right font-mono text-gray-600 dark:text-gray-400">Rs. {Number(row.totalFees).toLocaleString()}</td>
                      <td className="table-cell text-right font-mono text-blue-500">
                        {(row.totalDiscount || 0) > 0 ? `Rs. ${Number(row.totalDiscount).toLocaleString()}` : '—'}
                      </td>
                      <td className="table-cell text-right font-mono text-green-600">Rs. {Number(row.totalPaid).toLocaleString()}</td>
                      <td className="table-cell text-right">
                        {isCleared ? (
                          <FaCheckCircle className="ml-auto text-green-400" size={15}/>
                        ) : (
                          <span className="font-mono font-black text-red-500 text-base">Rs. {Number(row.outstanding).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="table-cell text-center text-xs text-gray-400">
                        {row.lastPaymentDate
                          ? new Date(row.lastPaymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : <span className="text-red-400 font-semibold">Never</span>}
                      </td>
                      <td className="table-cell text-center">
                        {!isCleared && <span className={`badge ${ageCls} text-[10px]`}>{ageLabel}</span>}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex gap-2 justify-end">
                          <button title="View Statement" onClick={() => navigate('/admin/fees/statement')}
                            className="text-primary-500 hover:text-primary-700 transition-colors"><FaFileAlt size={13}/></button>
                          {!isCleared && (
                            <button title="Collect Fees" onClick={() => navigate('/admin/fees/collect')}
                              className="text-green-500 hover:text-green-700 transition-colors"><FaMoneyBillWave size={13}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
