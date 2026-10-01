import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaHistory, FaSearch, FaUserGraduate, FaRoute, FaMoneyBillWave } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray', suspended: 'badge-yellow' }
const toInput = d => d ? new Date(d).toISOString().split('T')[0] : ''

export default function StudentTransport() {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState('active')
  const [routeF, setRouteF]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [summary, setSummary]   = useState(null)
  const [modal, setModal]       = useState(false)
  const [editId, setEditId]     = useState(null)
  const [histModal, setHistModal] = useState(false)
  const [history, setHistory]   = useState([])
  const [delId, setDelId]       = useState(null)

  // Form state
  const [step, setStep]         = useState(1)
  const [studentQ, setStudentQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selStudent, setSelStudent]   = useState(null)
  const [routes, setRoutes]     = useState([])
  const [stops, setStops]       = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers]   = useState([])
  const [form, setForm]         = useState({ route:'', pickupStop:'', dropoffStop:'', vehicle:'', driver:'', transportFee:'', effectiveFrom: toInput(new Date()), remarks:'' })

  const debounce = useRef(null)
  const searchDebounce = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/students', { params: { page, limit: 20, search, status: statusF, routeId: routeF } })
      setRows(r.data || []); setTotal(r.total || 0)
    } catch { toast.error('Failed to load assignments') }
    finally { setLoading(false) }
  }, [page, search, statusF, routeF])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/transport/routes',   { params: { limit: 100, status: 'active' } }),
      api.get('/transport/vehicles', { params: { limit: 100, status: 'active' } }),
      api.get('/transport/drivers',  { params: { limit: 100, status: 'active' } }),
      api.get('/transport/fees-summary'),
    ]).then(([r, v, d, s]) => {
      setRoutes(r.data || [])
      setVehicles(v.data || [])
      setDrivers(d.data || [])
      setSummary(s)
    }).catch(() => {})
  }, [])

  const onSearch = v => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setSearch(v); setPage(1) }, 280)
  }

  const onStudentQ = async v => {
    setStudentQ(v)
    if (v.length < 2) { setSuggestions([]); return }
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      try { setSuggestions(await api.get('/transport/students/search', { params: { q: v } })) }
      catch { setSuggestions([]) }
    }, 280)
  }

  const selectStudent = s => { setSelStudent(s); setSuggestions([]); setStudentQ(s.studentName); setStep(2) }

  const onRouteChange = async routeId => {
    setForm(p => ({ ...p, route: routeId, pickupStop: '', dropoffStop: '' }))
    if (!routeId) { setStops([]); return }
    try { const r = await api.get('/transport/stops', { params: { routeId } }); setStops(r.data || []) }
    catch { setStops([]) }
  }

  const openAssign = () => {
    setStep(1); setSelStudent(null); setStudentQ(''); setSuggestions([])
    setForm({ route:'', pickupStop:'', dropoffStop:'', vehicle:'', driver:'', transportFee:'', effectiveFrom: toInput(new Date()), remarks:'' })
    setEditId(null); setModal(true)
  }

  const openEdit = async row => {
    setSelStudent(row.student)
    setStudentQ(row.student?.studentName || '')
    const r = row.route?._id || row.route || ''
    setForm({
      route: r,
      pickupStop:  row.pickupStop?._id  || row.pickupStop  || '',
      dropoffStop: row.dropoffStop?._id || row.dropoffStop || '',
      vehicle:     row.vehicle?._id     || row.vehicle     || '',
      driver:      row.driver?._id      || row.driver      || '',
      transportFee: row.transportFee || '',
      effectiveFrom: toInput(row.effectiveFrom),
      remarks: row.remarks || '',
    })
    if (r) {
      try { const res = await api.get('/transport/stops', { params: { routeId: r } }); setStops(res.data || []) }
      catch { setStops([]) }
    }
    setEditId(row._id); setStep(2); setModal(true)
  }

  const save = async () => {
    if (!selStudent) return toast.error('Please select a student')
    if (!form.route) return toast.error('Route is required')
    if (!form.transportFee || form.transportFee <= 0) return toast.error('Transport fee must be valid')
    setSaving(true)
    try {
      const body = { ...form, student: selStudent._id }
      if (editId) { await api.put(`/transport/students/${editId}`, body); toast.success('Assignment updated') }
      else        { await api.post('/transport/students', body);           toast.success('Transport assigned successfully') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    try { await api.delete(`/transport/students/${delId}`); toast.success('Transport assignment removed'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Failed to remove') }
  }

  const viewHistory = async studentId => {
    try { setHistory(await api.get(`/transport/students/${studentId}/history`)); setHistModal(true) }
    catch { toast.error('Failed to load history') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Transport</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} assignment(s)</p>
        </div>
        <button className="btn-primary" onClick={openAssign}><FaPlus size={12} /> Assign Student</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600"><FaUserGraduate size={16} /></div>
            <div><div className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalStudents}</div><div className="text-xs text-gray-500">Active Students</div></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600"><FaRoute size={16} /></div>
            <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {(summary.totalMonthlyFees || 0).toLocaleString()}</div><div className="text-xs text-gray-500">Monthly Transport Fees</div></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600"><FaMoneyBillWave size={16} /></div>
            <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {summary.avgFee || 0}</div><div className="text-xs text-gray-500">Average Fee / Student</div></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input className="field pl-9" placeholder="Search student name, class…" onChange={e => onSearch(e.target.value)} />
        </div>
        <select className="field w-auto" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="field w-auto" value={routeF} onChange={e => { setRouteF(e.target.value); setPage(1) }}>
          <option value="">All Routes</option>
          {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No assignments found" sub="Assign students to transport routes using the button above" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Student</th>
                <th className="table-cell text-left">Class</th>
                <th className="table-cell text-left">Route</th>
                <th className="table-cell text-left">Pickup Stop</th>
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-right">Fee (Rs.)</th>
                <th className="table-cell text-left">Eff. From</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-semibold">{r.student?.studentName}</td>
                    <td className="table-cell text-xs">{r.student?.classApplying}</td>
                    <td className="table-cell text-xs">{r.route?.routeCode}</td>
                    <td className="table-cell text-xs">{r.pickupStop?.stopName || '—'}</td>
                    <td className="table-cell text-xs">{r.vehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-right font-semibold text-green-600">{r.transportFee?.toLocaleString()}</td>
                    <td className="table-cell text-xs">{r.effectiveFrom ? new Date(r.effectiveFrom).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => viewHistory(r.student?._id)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="History"><FaHistory size={13} /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500" title="Edit"><FaEdit size={13} /></button>
                        {r.status === 'active' && <button onClick={() => setDelId(r._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Remove"><span className="text-xs font-bold">✕</span></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="assignments" />

      {/* Assign/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Transport Assignment' : 'Assign Student Transport'} size="lg">
        {/* Step 1: Student Search */}
        {step === 1 && !editId && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Step 1: Search and select a student</p>
            <div className="relative">
              <input className="field" value={studentQ} onChange={e => onStudentQ(e.target.value)} placeholder="Type student name to search…" autoFocus />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-52 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s._id} onClick={() => selectStudent(s)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-b last:border-0 border-gray-100 dark:border-gray-700">
                      <div className="font-semibold">{s.studentName}</div>
                      <div className="text-xs text-gray-500">{s.classApplying} — {s.parentName} — {s.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selStudent && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-sm">
                <div className="font-semibold text-green-800 dark:text-green-400">{selStudent.studentName}</div>
                <div className="text-green-700 dark:text-green-500 text-xs mt-1">{selStudent.classApplying} — {selStudent.parentName} — {selStudent.phone}</div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!selStudent}>Next: Route & Vehicle →</button>
            </div>
          </div>
        )}

        {/* Step 2: Route, Stop, Vehicle */}
        {(step === 2 || editId) && (
          <div className="space-y-4">
            {!editId && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">{selStudent?.studentName}</div>
                <div className="text-xs text-gray-500">{selStudent?.classApplying}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="label">Route *</label>
                <select className="field" value={form.route} onChange={e => onRouteChange(e.target.value)}>
                  <option value="">— Select Route —</option>
                  {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
                </select>
              </div>
              <div><label className="label">Pickup Stop</label>
                <select className="field" value={form.pickupStop} onChange={e => f('pickupStop', e.target.value)} disabled={!form.route}>
                  <option value="">— Select Stop —</option>
                  {stops.map(s => <option key={s._id} value={s._id}>{s.stopName} {s.pickupTime ? `(${s.pickupTime})` : ''}</option>)}
                </select>
              </div>
              <div><label className="label">Drop-off Stop</label>
                <select className="field" value={form.dropoffStop} onChange={e => f('dropoffStop', e.target.value)} disabled={!form.route}>
                  <option value="">— Select Stop —</option>
                  {stops.map(s => <option key={s._id} value={s._id}>{s.stopName} {s.dropoffTime ? `(${s.dropoffTime})` : ''}</option>)}
                </select>
              </div>
              <div><label className="label">Vehicle</label>
                <select className="field" value={form.vehicle} onChange={e => f('vehicle', e.target.value)}>
                  <option value="">— None —</option>
                  {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
                </select>
              </div>
              <div><label className="label">Driver</label>
                <select className="field" value={form.driver} onChange={e => f('driver', e.target.value)}>
                  <option value="">— None —</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="label">Monthly Transport Fee (Rs.) *</label>
                <input type="number" className="field" value={form.transportFee} onChange={e => f('transportFee', e.target.value)} placeholder="e.g. 2500" />
              </div>
              <div><label className="label">Effective From</label>
                <input type="date" className="field" value={form.effectiveFrom} onChange={e => f('effectiveFrom', e.target.value)} />
              </div>
              <div className="md:col-span-2"><label className="label">Remarks</label>
                <textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              {!editId && <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>}
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Assignment' : 'Assign Transport'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal open={histModal} onClose={() => setHistModal(false)} title="Transport Assignment History" size="lg">
        {history.length === 0 ? <EmptyState title="No history" /> : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h._id} className="border dark:border-gray-700 rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{h.route?.routeName || 'Unknown Route'}</span>
                  <span className={`badge ${STATUS_BADGE[h.status] || 'badge-gray'}`}>{h.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  From: {h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : '—'} {h.effectiveTo ? `→ ${new Date(h.effectiveTo).toLocaleDateString()}` : '(active)'}
                </div>
                <div className="text-xs text-gray-500">Fee: Rs. {h.transportFee?.toLocaleString() || 0}/month</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={remove}
        title="Remove Transport" message="Remove this student's transport assignment? The record will be kept for history." />
    </div>
  )
}
