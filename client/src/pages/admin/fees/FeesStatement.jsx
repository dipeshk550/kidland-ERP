import { useState, useRef } from 'react'
import { FaSearch, FaFileAlt, FaPrint, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'

const CY = new Date().getFullYear()
const DEFAULT_YEAR = `${CY}-${String(CY + 1).slice(-2)}`

function printStatement() {
  const style = document.createElement('style')
  style.id = '__stmt_print'
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #fee-statement-printable, #fee-statement-printable * { visibility: visible !important; }
      #fee-statement-printable {
        position: fixed !important; top: 0 !important; left: 0 !important;
        width: 100% !important; padding: 24px !important;
        background: white !important; z-index: 99999 !important;
      }
    }
  `
  document.head.appendChild(style)
  window.print()
  setTimeout(() => { document.getElementById('__stmt_print')?.remove() }, 500)
}

export default function FeesStatement() {
  const [query, setQuery]       = useState('')
  const [suggestions, setSugs]  = useState([])
  const [student, setStudent]   = useState(null)
  const [academicYear, setYear] = useState(DEFAULT_YEAR)
  const [loading, setLoading]   = useState(false)
  // Ledger data
  const [ledger, setLedger]     = useState([])   // built from account + payments
  const [summary, setSummary]   = useState(null)
  const [account, setAccount]   = useState([])   // fee-wise breakdown
  const debRef = useRef()

  // ── student autocomplete ───────────────────────────────────────────────────
  const handleSearch = (v) => {
    setQuery(v)
    if (!v) { setStudent(null); setLedger([]); setSummary(null); setAccount([]) }
    clearTimeout(debRef.current)
    if (v.length < 2) { setSugs([]); return }
    debRef.current = setTimeout(async () => {
      try { const r = await api.get(`/fees/student/search?q=${encodeURIComponent(v)}`); setSugs(r.data || []) }
      catch { setSugs([]) }
    }, 280)
  }

  const pickStudent = (s) => { setStudent(s); setQuery(s.studentName); setSugs([]) }

  // ── load statement ─────────────────────────────────────────────────────────
  const loadStatement = async () => {
    if (!student) return toast.error('Select a student first')
    setLoading(true); setLedger([]); setSummary(null); setAccount([])
    try {
      // Load fee account (bills) and payments in parallel
      const [accRes, payRes] = await Promise.all([
        api.get(`/fees/student/${student._id}?academicYear=${academicYear}`),
        api.get(`/fees/statement/${student._id}?academicYear=${academicYear}`),
      ])
      const acc      = accRes.account  || []
      const payments = payRes.payments || []
      setSummary(accRes.summary)
      setAccount(acc)

      // Build ledger rows
      // Opening row = total billed
      const rows = []

      // Bill rows (debit = amounts charged)
      acc.forEach(a => {
        rows.push({
          type:        'bill',
          date:        null,
          ref:         '—',
          description: a.feeTypeName,
          group:       a.feeGroupName,
          debit:       a.totalAmt,
          discount:    a.discAmt,
          credit:      0,
          status:      'bill',
        })
      })

      // Payment rows (credit)
      payments.forEach(p => {
        rows.push({
          type:        'payment',
          date:        p.paymentDate,
          ref:         p.receiptNo,
          description: 'Fee Payment',
          method:      p.paymentMethod,
          debit:       0,
          discount:    0,
          credit:      p.netAmount,
          status:      p.status,
        })
      })

      // Sort: bills first (no date), then payments by date
      rows.sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return -1
        if (!b.date) return 1
        return new Date(a.date) - new Date(b.date)
      })

      // Add running balance
      const totalBilled = (accRes.summary?.totalFees || 0) - (accRes.summary?.totalDiscount || 0)
      let bal = totalBilled
      const withBalance = rows.map(r => {
        if (r.type === 'bill')    bal = bal  // balance stays after billing (already set)
        if (r.type === 'payment') bal = bal - r.credit
        return { ...r, balance: bal }
      })
      // recalculate properly - running balance starts from net billed amount
      let runBal = totalBilled
      const finalRows = withBalance.map((r, i) => {
        if (r.type === 'payment') { runBal -= r.credit; return { ...r, balance: runBal } }
        // For bill rows, show cumulative billed
        return r
      })

      setLedger(finalRows)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const billRows    = ledger.filter(r => r.type === 'bill')
  const paymentRows = ledger.filter(r => r.type === 'payment')
  const outstanding = summary ? (summary.totalFees - summary.totalDiscount - summary.totalPaid) : 0

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <FaFileAlt size={16} className="text-purple-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fees Statement</h1>
          <p className="text-xs text-gray-400">Complete fee account ledger per student</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <label className="label">Search Student</label>
            <div className="relative">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"/>
              <input className="field pl-9" value={query} onChange={e => handleSearch(e.target.value)}
                placeholder="Student name or phone…"/>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-30 max-h-52 overflow-y-auto">
                {suggestions.map(s => (
                  <button key={s._id} type="button" onClick={() => pickStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
                    <div className="font-semibold">{s.studentName}</div>
                    <div className="text-xs text-gray-400">{s.classApplying} · {s.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="field w-28 text-sm" value={academicYear}
              onChange={e => setYear(e.target.value)} placeholder="2081-82"/>
          </div>
          <button onClick={loadStatement} className="btn-primary h-10 px-5">Load Statement</button>
          {ledger.length > 0 && (
            <button onClick={printStatement} className="btn-ghost h-10 px-4 flex items-center gap-2">
              <FaPrint size={13}/> Print
            </button>
          )}
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner/></div>}

      {/* Main Statement */}
      {!loading && summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              ['Total Billed',   summary.totalFees,                      'text-gray-800 dark:text-gray-100', 'bg-gray-50 dark:bg-gray-800/50'],
              ['Concession',     summary.totalDiscount,                  'text-blue-600',  'bg-blue-50 dark:bg-blue-900/20'],
              ['Total Paid',     summary.totalPaid,                      'text-green-600', 'bg-green-50 dark:bg-green-900/20'],
              ['Outstanding',    Math.max(0, outstanding),               'text-red-600',   'bg-red-50 dark:bg-red-900/20'],
            ].map(([l, v, tc, bg]) => (
              <div key={l} className={`card p-4 ${bg}`}>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{l}</div>
                <div className={`text-xl font-black ${tc}`}>Rs. {Number(v || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Student Info */}
          <div className="card p-4 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-black shrink-0">
              {student?.studentName[0]}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><span className="label">Student</span><p className="font-bold text-gray-800 dark:text-gray-100">{student?.studentName}</p></div>
              <div><span className="label">Class</span><p className="font-semibold">{student?.classApplying}</p></div>
              <div><span className="label">Academic Year</span><p className="font-semibold">{academicYear}</p></div>
              <div><span className="label">Phone</span><p className="text-gray-500">{student?.phone}</p></div>
            </div>
          </div>

          {/* Fee-wise Breakdown */}
          {billRows.length > 0 && (
            <div className="card overflow-hidden mb-4">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Fee Schedule — {academicYear}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-head">#</th>
                    <th className="table-head">Fee Head</th>
                    <th className="table-head">Group</th>
                    <th className="table-head text-right">Billed</th>
                    <th className="table-head text-right">Concession</th>
                    <th className="table-head text-right">Net Chargeable</th>
                    <th className="table-head text-right">Paid</th>
                    <th className="table-head text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {account.map((row, i) => {
                    const netChargeable = row.totalAmt - row.discAmt
                    const due = row.netDue
                    return (
                      <tr key={row.feeTypeId} className="table-row">
                        <td className="table-cell text-gray-400 text-xs">{i + 1}</td>
                        <td className="table-cell font-semibold text-gray-800 dark:text-gray-100">{row.feeTypeName}</td>
                        <td className="table-cell"><span className="badge badge-gray text-[10px]">{row.feeGroupName}</span></td>
                        <td className="table-cell text-right font-mono text-gray-600 dark:text-gray-400">Rs. {Number(row.totalAmt).toLocaleString()}</td>
                        <td className="table-cell text-right font-mono text-blue-600 dark:text-blue-400">
                          {row.discAmt > 0 ? `Rs. ${Number(row.discAmt).toLocaleString()}` : '—'}
                        </td>
                        <td className="table-cell text-right font-mono font-semibold text-gray-700 dark:text-gray-200">Rs. {Number(netChargeable).toLocaleString()}</td>
                        <td className="table-cell text-right font-mono text-green-600 dark:text-green-400">
                          {row.paidAmt > 0 ? `Rs. ${Number(row.paidAmt).toLocaleString()}` : '—'}
                        </td>
                        <td className="table-cell text-right">
                          {due > 0
                            ? <span className="font-mono font-black text-red-500">Rs. {Number(due).toLocaleString()}</span>
                            : <span className="badge badge-green text-[10px]">Cleared</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Total row */}
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-bold">
                    <td className="table-cell" colSpan={3}>Total</td>
                    <td className="table-cell text-right font-mono">Rs. {Number(summary.totalFees).toLocaleString()}</td>
                    <td className="table-cell text-right font-mono text-blue-600">{summary.totalDiscount > 0 ? `Rs. ${Number(summary.totalDiscount).toLocaleString()}` : '—'}</td>
                    <td className="table-cell text-right font-mono">Rs. {Number(summary.totalFees - summary.totalDiscount).toLocaleString()}</td>
                    <td className="table-cell text-right font-mono text-green-600">Rs. {Number(summary.totalPaid).toLocaleString()}</td>
                    <td className="table-cell text-right font-mono text-red-500">Rs. {Number(Math.max(0, outstanding)).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Payment History Ledger */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Payment Ledger</h3>
            </div>
            {paymentRows.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No payments recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-head">Date</th>
                    <th className="table-head">Receipt No</th>
                    <th className="table-head">Description</th>
                    <th className="table-head">Method</th>
                    <th className="table-head text-right">Amount Paid</th>
                    <th className="table-head">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((r, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{r.ref}</td>
                      <td className="table-cell text-gray-600 dark:text-gray-400">{r.description}</td>
                      <td className="table-cell capitalize text-gray-500">{r.method}</td>
                      <td className="table-cell text-right font-mono font-bold text-green-600 dark:text-green-400">
                        Rs. {Number(r.credit).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${r.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-bold text-sm">
                    <td className="table-cell" colSpan={4}>Total Payments Made</td>
                    <td className="table-cell text-right font-mono text-green-600 dark:text-green-400">
                      Rs. {Number(summary.totalPaid).toLocaleString()}
                    </td>
                    <td className="table-cell"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {outstanding > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center justify-between">
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">Outstanding Balance</div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">Rs. {Number(outstanding).toLocaleString()}</div>
            </div>
          )}
          {outstanding <= 0 && summary.totalPaid > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center gap-3">
              <FaCheckCircle className="text-green-500" size={18}/>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">All fees cleared. No outstanding balance.</div>
            </div>
          )}
        </>
      )}

      {/* Hidden printable */}
      <div id="fee-statement-printable" style={{ display: 'none', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#111' }}>
        {summary && student && (
          <>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>KIDLAND SCHOOL</div>
              <div style={{ fontSize: '11px', color: '#555' }}>Kusunti, Lalitpur-13, Nepal</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#54B435', marginTop: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>Fee Account Statement — {academicYear}</div>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '10px', background: '#f9fafb', padding: '8px 10px', borderRadius: '4px' }}>
              <div><strong>Student:</strong> {student.studentName}</div>
              <div><strong>Class:</strong> {student.classApplying}</div>
              <div><strong>Phone:</strong> {student.phone}</div>
              <div><strong>Year:</strong> {academicYear}</div>
            </div>
            {/* Fee Schedule */}
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#374151' }}>Fee Schedule</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['#','Fee Head','Group','Billed','Concession','Net','Paid','Balance'].map(h => (
                    <th key={h} style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: h === '#' ? 'center' : 'right', ...(h === 'Fee Head' || h === 'Group' ? { textAlign: 'left' } : {}) }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {account.map((row, i) => (
                  <tr key={row.feeTypeId}>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px' }}>{row.feeTypeName}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px' }}>{row.feeGroupName}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right' }}>Rs. {Number(row.totalAmt).toLocaleString()}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right' }}>{row.discAmt > 0 ? `Rs. ${Number(row.discAmt).toLocaleString()}` : '—'}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right' }}>Rs. {Number(row.totalAmt - row.discAmt).toLocaleString()}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right', color: '#16a34a' }}>{row.paidAmt > 0 ? `Rs. ${Number(row.paidAmt).toLocaleString()}` : '—'}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{row.netDue > 0 ? `Rs. ${Number(row.netDue).toLocaleString()}` : 'Cleared'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Payments */}
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#374151' }}>Payment History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['Date','Receipt No','Method','Amount Paid','Status'].map(h => (
                    <th key={h} style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: h === 'Amount Paid' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paymentRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', fontFamily: 'monospace', color: '#54B435', fontWeight: 700 }}>{r.ref}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textTransform: 'capitalize' }}>{r.method}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>Rs. {Number(r.credit).toLocaleString()}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '5px 7px', textTransform: 'capitalize' }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Summary footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden', minWidth: '260px' }}>
                {[['Total Billed', summary.totalFees],['Concession', -summary.totalDiscount],['Total Paid', -summary.totalPaid]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '11px' }}>
                    <span>{l}</span>
                    <span style={{ fontFamily: 'monospace' }}>Rs. {Math.abs(v).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: outstanding > 0 ? '#fef2f2' : '#f0fdf4', fontSize: '13px', fontWeight: 900 }}>
                  <span>Outstanding</span>
                  <span style={{ color: outstanding > 0 ? '#dc2626' : '#16a34a', fontFamily: 'monospace' }}>Rs. {Math.max(0, outstanding).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: '#9ca3af' }}>
              Generated on {new Date().toLocaleString()} — Kidland School Management System
            </div>
          </>
        )}
      </div>
    </div>
  )
}
