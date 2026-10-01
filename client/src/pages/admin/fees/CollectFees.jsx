import { useState, useEffect, useRef } from 'react'
import {
  FaSearch, FaPrint, FaRupeeSign, FaCheckCircle,
  FaHistory, FaChevronDown, FaChevronUp, FaTimesCircle
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner, Modal } from '../../../components/ui/index'

const METHODS = ['cash','bank','cheque','esewa','khalti','fonepay','other']
const CY = new Date().getFullYear()
const TODAY = new Date().toISOString().slice(0, 10)
const DEFAULT_YEAR = `${CY}-${String(CY + 1).slice(-2)}`

/* ─── print helper ─── */
function doPrint(id) {
  const el = document.getElementById(id)
  if (!el) return
  const w = window.open('', '_blank', 'width=800,height=700')
  w.document.write(`
    <html><head><title>Print</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
      body { padding: 20px; font-size: 13px; color: #111; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; }
      th { background: #f3f4f6; text-align: left; }
      td.right, th.right { text-align: right; }
      .green { color: #16a34a; } .red { color: #dc2626; } .blue { color: #2563eb; }
      .total-row { font-weight: 900; font-size: 15px; background: #f0fdf4; }
      .school { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 14px; }
      .school h1 { font-size: 20px; letter-spacing: 1px; }
      .school p { font-size: 12px; color: #555; }
      .school .doc-title { font-size: 16px; font-weight: 700; color: #54B435; margin-top: 6px; text-transform: uppercase; letter-spacing: 2px; }
      .meta { display: flex; gap: 20px; background: #f9fafb; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 12px; }
      .sigs { display: flex; justify-content: space-between; margin-top: 28px; border-top: 1px dashed #ccc; padding-top: 16px; }
      .sig { text-align: center; }
      .sig .line { width: 150px; border-bottom: 1px solid #333; margin: 0 auto 4px; padding-bottom: 24px; }
      .watermark { position: fixed; top: 40%; left: 25%; font-size: 72px; font-weight: 900; color: rgba(34,197,94,0.07); transform: rotate(-35deg); letter-spacing: 6px; pointer-events: none; }
      .note { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 12px; }
      .summary-box { float: right; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; min-width: 240px; margin-top: 10px; }
      .summary-row { display: flex; justify-content: space-between; padding: 5px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
      .summary-total { display: flex; justify-content: space-between; padding: 8px 12px; font-weight: 900; font-size: 14px; }
    </style></head><body>
    ${el.innerHTML}
    <div class="watermark">PAID</div>
    </body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); w.close() }, 400)
}

/* ─── hidden print content ─── */
function PrintContent({ id, docTitle, student, year, items, totalPaying, discTotal, method, txnRef, payDate, receiptNo, remarks }) {
  return (
    <div id={id} style={{ display: 'none' }}>
      <div className="school">
        <h1>KIDLAND SCHOOL</h1>
        <p>Kusunti, Lalitpur-13, Nepal | Tel: 01-5XXXXXX</p>
        <div className="doc-title">{docTitle}</div>
      </div>
      <div className="meta">
        {receiptNo && <span><b>Receipt No:</b> {receiptNo}</span>}
        <span><b>Date:</b> {payDate ? new Date(payDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
        <span><b>Academic Year:</b> {year}</span>
        {method && <span><b>Method:</b> {method.charAt(0).toUpperCase() + method.slice(1)}</span>}
        {txnRef && <span><b>Ref:</b> {txnRef}</span>}
      </div>
      <div className="meta">
        <span><b>Student:</b> {student?.studentName}</span>
        <span><b>Class:</b> {student?.classApplying}</span>
        {student?.parentName && <span><b>Parent:</b> {student.parentName}</span>}
        <span><b>Phone:</b> {student?.phone}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fee Head</th>
            <th>Group</th>
            <th className="right">Amount</th>
            <th className="right">Discount</th>
            <th className="right">{docTitle === 'FEE BILL' ? 'Outstanding' : 'Paid'}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{it.feeTypeName}</td>
              <td>{it.feeGroupName}</td>
              <td className="right">Rs. {Number(it.amount).toLocaleString()}</td>
              <td className="right">{it.discount > 0 ? `Rs. ${Number(it.discount).toLocaleString()}` : '—'}</td>
              <td className="right"><b>Rs. {Number(it.net).toLocaleString()}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="summary-box">
        <div className="summary-row"><span>Gross Amount</span><span>Rs. {(totalPaying + discTotal).toLocaleString()}</span></div>
        {discTotal > 0 && <div className="summary-row blue"><span>Discount / Concession</span><span>- Rs. {discTotal.toLocaleString()}</span></div>}
        <div className="summary-total green"><span>{docTitle === 'FEE BILL' ? 'Total Outstanding' : 'Amount Paid'}</span><span>Rs. {totalPaying.toLocaleString()}</span></div>
      </div>
      <div style={{ clear: 'both' }}/>
      {remarks && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}><b>Remarks:</b> {remarks}</p>}
      <div className="sigs">
        <div className="sig"><div className="line"/><div>Cashier's Signature</div><div style={{ fontSize: '10px', color: '#9ca3af' }}>(Authorized Signatory)</div></div>
        <div className="sig"><div className="line"/><div>Parent / Student Signature</div></div>
      </div>
      <div className="note">Thank you for your payment. — Kidland School Management System</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function CollectFees() {
  /* student */
  const [query, setQuery]       = useState('')
  const [sugs, setSugs]         = useState([])
  const [student, setStudent]   = useState(null)
  const [year, setYear]         = useState(DEFAULT_YEAR)

  /* fee account */
  const [account, setAccount]   = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(false)

  /* selection: feeTypeId → payAmount (0 = unchecked) */
  const [sel, setSel]           = useState({})

  /* payment */
  const [method, setMethod]     = useState('cash')
  const [payDate, setPayDate]   = useState(TODAY)
  const [txnRef, setTxnRef]     = useState('')
  const [remarks, setRemarks]   = useState('')
  const [saving, setSaving]     = useState(false)

  /* receipt */
  const [receipt, setReceipt]   = useState(null)
  const [rcptItems, setRcptItems] = useState([])

  /* history */
  const [histOpen, setHistOpen] = useState(false)
  const [history, setHistory]   = useState([])
  const [histLoading, setHistLoading] = useState(false)

  const debRef = useRef()

  /* ── autocomplete ── */
  useEffect(() => {
    clearTimeout(debRef.current)
    if (query.length < 2) { setSugs([]); return }
    debRef.current = setTimeout(async () => {
      try { const r = await api.get(`/fees/student/search?q=${encodeURIComponent(query)}`); setSugs(r.data || []) }
      catch { setSugs([]) }
    }, 280)
  }, [query])

  /* ── pick student ── */
  const pickStudent = async (s) => {
    setStudent(s); setSugs([]); setQuery(s.studentName)
    await fetchAccount(s._id)
  }

  /* ── fetch fee account ── */
  const fetchAccount = async (id) => {
    setLoading(true); setAccount([]); setSummary(null); setSel({})
    try {
      const r = await api.get(`/fees/student/${id}?academicYear=${year}`)
      const acc = r.account || []
      setAccount(acc); setSummary(r.summary)
      /* auto-select all rows with outstanding due */
      const init = {}
      acc.forEach(a => { if (a.netDue > 0) init[a.feeTypeId] = a.netDue })
      setSel(init)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  /* ── history ── */
  const openHistory = async () => {
    setHistOpen(p => !p)
    if (!histOpen && student) {
      setHistLoading(true)
      try { const r = await api.get(`/fees/payments?studentId=${student._id}&academicYear=${year}&limit=20`); setHistory(r.data || []) }
      catch { setHistory([]) } finally { setHistLoading(false) }
    }
  }

  /* ── toggle row ── */
  const toggleRow = (id, dueAmt) => {
    setSel(prev => {
      const copy = { ...prev }
      if (copy[id] !== undefined) { delete copy[id] } else { copy[id] = dueAmt }
      return copy
    })
  }

  const setPayAmt = (id, val, max) => {
    const n = Math.min(Math.max(0, Number(val)), max)
    setSel(prev => ({ ...prev, [id]: n }))
  }

  /* ── totals ── */
  const selectedEntries = Object.entries(sel)
  const totalPaying = selectedEntries.reduce((s, [, v]) => s + Number(v), 0)
  const totalDisc   = selectedEntries.reduce((s, [id]) => {
    const row = account.find(a => a.feeTypeId === id)
    return s + (row?.discAmt || 0)
  }, 0)

  /* ── collect ── */
  const collect = async () => {
    if (selectedEntries.length === 0) return toast.error('Select at least one fee')
    if (totalPaying <= 0) return toast.error('Amount must be greater than 0')
    setSaving(true)
    try {
      const items = selectedEntries.map(([id, paying]) => {
        const row = account.find(a => a.feeTypeId === id)
        return {
          feeTypeId:    id,
          feeTypeName:  row?.feeTypeName,
          feeGroupName: row?.feeGroupName,
          amount:       Number(paying),
          discount:     Math.min(row?.discAmt || 0, Number(paying)),
          net:          Number(paying),
        }
      })
      const r = await api.post('/fees/payments', {
        studentId: student._id, academicYear: year,
        paymentDate: payDate, paymentMethod: method,
        transactionRef: txnRef, remarks, items,
      })
      const data = { ...r.data, student }
      setReceipt(data); setRcptItems(items)
      toast.success(`✓ ${r.data.receiptNo} — Rs. ${totalPaying.toLocaleString()} collected`, { duration: 5000 })
      setSel({}); setTxnRef(''); setRemarks('')
      await fetchAccount(student._id)
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  /* ── bill print items (outstanding dues) ── */
  const billPrintItems = account.filter(a => a.netDue > 0).map(a => ({
    feeTypeName: a.feeTypeName, feeGroupName: a.feeGroupName,
    amount: a.totalAmt, discount: a.discAmt, net: a.netDue,
  }))
  const billTotal = billPrintItems.reduce((s, i) => s + i.net, 0)
  const billDisc  = billPrintItems.reduce((s, i) => s + i.discount, 0)

  const allDue = account.filter(a => a.netDue > 0)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">

      {/* ══ STEP 1: Find Student ═══════════════════════════════════════════════ */}
      <div className="card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Step 1 — Find Student</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="relative flex-1 min-w-[220px]">
            <label className="label">Student Name / Phone</label>
            <div className="relative">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"/>
              <input className="field pl-9" value={query}
                onChange={e => { setQuery(e.target.value); if (!e.target.value) { setStudent(null); setAccount([]); setSummary(null) } }}
                placeholder="Search student…"/>
            </div>
            {sugs.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-40 max-h-52 overflow-y-auto">
                {sugs.map(s => (
                  <button key={s._id} type="button" onClick={() => pickStudent(s)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {s.studentName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.studentName}</div>
                        <div className="text-xs text-gray-400">{s.classApplying} · {s.phone}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="field w-28 text-sm" value={year}
              onChange={e => setYear(e.target.value)} placeholder="2082-83"/>
          </div>
          {student && (
            <button onClick={() => fetchAccount(student._id)} className="btn-ghost h-10 px-4 text-sm">
              Reload
            </button>
          )}
        </div>
      </div>

      {/* ══ STUDENT CARD ═══════════════════════════════════════════════════════ */}
      {student && (
        <div className="card p-4 flex items-center gap-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
            {student.studentName[0]}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-1 text-sm">
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Student</p><p className="font-bold text-gray-800 dark:text-gray-100">{student.studentName}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Class</p><p className="font-semibold">{student.classApplying}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Parent</p><p className="text-gray-600 dark:text-gray-300">{student.parentName || '—'}</p></div>
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Phone</p><p className="text-gray-600 dark:text-gray-300">{student.phone}</p></div>
          </div>
          {summary && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Outstanding</p>
              <p className="text-2xl font-black text-red-500">Rs. {Number(summary.totalDue || 0).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2: FEE BILL ═══════════════════════════════════════════════════ */}
      {student && (
        <div className="card overflow-hidden">
          {/* Bill header */}
          <div className="px-5 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-black tracking-wide">FEE BILL — {year}</h2>
              <p className="text-primary-100 text-xs mt-0.5">KIDLAND SCHOOL · Kusunti, Lalitpur-13</p>
            </div>
            <div className="flex items-center gap-2">
              {billPrintItems.length > 0 && (
                <button
                  onClick={() => doPrint('bill-print-content')}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-xs font-semibold">
                  <FaPrint size={11}/> Print Bill
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <Spinner/><p className="text-sm text-gray-400">Loading fee account…</p>
            </div>
          ) : account.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <FaRupeeSign size={28} className="mx-auto mb-3 opacity-20"/>
              <p className="font-semibold">No fee structure found</p>
              <p className="text-xs mt-1">No fees configured for {student.classApplying} in {year}</p>
            </div>
          ) : (
            <>
              {/* Fee rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="col-span-1 text-center">Pay</div>
                  <div className="col-span-4">Fee Head</div>
                  <div className="col-span-2 text-right">Billed</div>
                  <div className="col-span-2 text-right">Discount</div>
                  <div className="col-span-2 text-right">Outstanding</div>
                  <div className="col-span-1 text-right">Paying</div>
                </div>

                {account.map(row => {
                  const isPaid = row.netDue <= 0
                  const isSelected = sel[row.feeTypeId] !== undefined
                  return (
                    <div key={row.feeTypeId}
                      className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors
                        ${isPaid ? 'opacity-50' : isSelected ? 'bg-primary-50/70 dark:bg-primary-900/15' : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/30'}`}>

                      {/* Checkbox */}
                      <div className="col-span-1 flex justify-center">
                        {isPaid
                          ? <FaCheckCircle className="text-green-400" size={16}/>
                          : <input type="checkbox" className="w-4 h-4 accent-primary-500 cursor-pointer"
                              checked={isSelected} onChange={() => toggleRow(row.feeTypeId, row.netDue)}/>
                        }
                      </div>

                      {/* Name */}
                      <div className="col-span-4">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{row.feeTypeName}</p>
                        <p className="text-[10px] text-gray-400">{row.feeGroupName}</p>
                      </div>

                      {/* Billed */}
                      <div className="col-span-2 text-right font-mono text-sm text-gray-500">
                        {Number(row.totalAmt).toLocaleString()}
                      </div>

                      {/* Discount */}
                      <div className="col-span-2 text-right font-mono text-sm text-blue-500">
                        {row.discAmt > 0 ? `- ${Number(row.discAmt).toLocaleString()}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </div>

                      {/* Outstanding */}
                      <div className="col-span-2 text-right">
                        {isPaid
                          ? <span className="text-[10px] badge badge-green">Paid</span>
                          : <span className="font-mono font-bold text-red-500">{Number(row.netDue).toLocaleString()}</span>
                        }
                      </div>

                      {/* Now paying editable */}
                      <div className="col-span-1 text-right">
                        {isSelected ? (
                          <input
                            type="number" min={1} max={row.netDue} step={1}
                            className="w-full text-right text-sm font-mono font-bold text-primary-700 dark:text-primary-300
                              bg-white dark:bg-gray-900 border border-primary-300 dark:border-primary-700
                              rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            value={sel[row.feeTypeId] ?? row.netDue}
                            onChange={e => setPayAmt(row.feeTypeId, e.target.value, row.netDue)}
                          />
                        ) : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bill totals footer */}
              {summary && (
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-xs text-gray-500">
                      <p>Total Billed: <span className="font-mono">Rs. {Number(summary.totalFees || 0).toLocaleString()}</span></p>
                      <p>Previously Paid: <span className="font-mono text-green-600">Rs. {Number(summary.totalPaid || 0).toLocaleString()}</span></p>
                      {summary.totalDiscount > 0 && <p>Discount: <span className="font-mono text-blue-500">Rs. {Number(summary.totalDiscount || 0).toLocaleString()}</span></p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">Total Outstanding</p>
                      <p className="text-3xl font-black text-red-500 font-mono">Rs. {Number(summary.totalDue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ STEP 3: PAYMENT FORM ════════════════════════════════════════════════ */}
      {student && account.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Step 2 — Process Payment</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div>
              <label className="label">Payment Method</label>
              <select className="field text-sm capitalize" value={method} onChange={e => setMethod(e.target.value)}>
                {METHODS.map(m => <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input type="date" className="field text-sm" value={payDate} onChange={e => setPayDate(e.target.value)}/>
            </div>
            <div>
              <label className="label">Transaction Ref. <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
              <input className="field text-sm" value={txnRef} onChange={e => setTxnRef(e.target.value)} placeholder="Bank ref / cheque no."/>
            </div>
            <div>
              <label className="label">Remarks <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
              <input className="field text-sm" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Aug tuition"/>
            </div>
          </div>

          {/* Payment amount summary + collect button */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-2xl px-6 py-4 gap-4">
            <div className="space-y-1 text-sm">
              <div className="flex gap-8">
                <span className="text-gray-400">Items selected</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{selectedEntries.length}</span>
              </div>
              {totalDisc > 0 && (
                <div className="flex gap-8">
                  <span className="text-gray-400">Discount applied</span>
                  <span className="font-mono text-blue-500">Rs. {totalDisc.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Collecting Now</p>
                <p className="text-3xl font-black text-primary-600 dark:text-primary-400 font-mono">
                  Rs. {totalPaying.toLocaleString()}
                </p>
              </div>
              <button
                onClick={collect}
                disabled={saving || selectedEntries.length === 0 || totalPaying <= 0}
                className="btn-primary px-8 py-3 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                {saving
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : '✓ Collect & Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT HISTORY ═════════════════════════════════════════════════════ */}
      {student && (
        <div className="card overflow-hidden">
          <button onClick={openHistory}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <FaHistory size={13} className="text-gray-400"/>
              Payment History — {year}
              {history.length > 0 && <span className="badge badge-gray text-[10px]">{history.length} payments</span>}
            </div>
            {histOpen ? <FaChevronUp size={12} className="text-gray-400"/> : <FaChevronDown size={12} className="text-gray-400"/>}
          </button>
          {histOpen && (
            <div className="border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
              {histLoading ? <div className="flex justify-center py-6"><Spinner size="sm"/></div>
              : history.length === 0 ? <p className="text-center py-6 text-sm text-gray-400">No payments recorded yet.</p>
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="table-head">Date</th>
                      <th className="table-head">Receipt No</th>
                      <th className="table-head">Method</th>
                      <th className="table-head text-right">Net Paid</th>
                      <th className="table-head">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h._id} className="table-row">
                        <td className="table-cell text-xs text-gray-400">{new Date(h.paymentDate).toLocaleDateString('en-GB')}</td>
                        <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{h.receiptNo}</td>
                        <td className="table-cell capitalize text-gray-500">{h.paymentMethod}</td>
                        <td className="table-cell text-right font-mono font-bold text-green-600">Rs. {Number(h.netAmount).toLocaleString()}</td>
                        <td className="table-cell"><span className={`badge ${h.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ HIDDEN PRINT TEMPLATES ══════════════════════════════════════════════ */}
      {/* Bill (before payment) */}
      <PrintContent id="bill-print-content" docTitle="FEE BILL"
        student={student} year={year}
        items={billPrintItems} totalPaying={billTotal} discTotal={billDisc}
        method={null} txnRef={null} payDate={null} receiptNo={null} remarks={null}/>

      {/* Receipt (after payment) */}
      {receipt && (
        <PrintContent id="receipt-print-content" docTitle="FEE RECEIPT"
          student={student} year={year}
          items={rcptItems}
          totalPaying={rcptItems.reduce((s, i) => s + i.net, 0)}
          discTotal={rcptItems.reduce((s, i) => s + (i.discount || 0), 0)}
          method={receipt.paymentMethod} txnRef={receipt.transactionRef}
          payDate={receipt.paymentDate} receiptNo={receipt.receiptNo} remarks={remarks}/>
      )}

      {/* ══ RECEIPT MODAL ═══════════════════════════════════════════════════════ */}
      <Modal open={!!receipt} onClose={() => { setReceipt(null); setRcptItems([]) }} title="" size="md">
        {receipt && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <FaCheckCircle size={32} className="text-green-500"/>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Payment Collected!</h2>
            <p className="text-primary-600 dark:text-primary-400 font-mono font-bold text-lg">{receipt.receiptNo}</p>
            <p className="text-xs text-gray-400 mb-5">{new Date(receipt.paymentDate || receipt.createdAt).toLocaleString()}</p>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl py-4 mb-5">
              <p className="text-xs text-primary-500 uppercase tracking-widest mb-1">Amount Collected</p>
              <p className="text-4xl font-black text-primary-600 dark:text-primary-400 font-mono">
                Rs. {Number(receipt.netAmount).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 capitalize mt-1">via {receipt.paymentMethod}</p>
            </div>

            {/* Itemized */}
            <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden mb-5 text-sm">
              {rcptItems.map((it, i) => (
                <div key={i} className="flex justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <span className="text-gray-600 dark:text-gray-400">{it.feeTypeName}</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-100">Rs. {Number(it.net).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setReceipt(null); setRcptItems([]) }} className="btn-ghost flex-1">Close</button>
              <button onClick={() => doPrint('receipt-print-content')} className="btn-primary flex-1 justify-center gap-2">
                <FaPrint size={13}/> Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
