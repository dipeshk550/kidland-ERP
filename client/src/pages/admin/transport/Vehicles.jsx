import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaExclamationTriangle } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY = {
  vehicleNumber:'', registrationNumber:'', vehicleType:'bus', vehicleModel:'',
  manufacturer:'', manufacturingYear:'', seatingCapacity:'', purchaseDate:'',
  insuranceNumber:'', insuranceExpiry:'', taxExpiry:'', fitnessExpiry:'',
  assignedRoute:'', assignedDriver:'', status:'active', remarks:''
}

const STATUS_BADGE = { active:'badge-green', inactive:'badge-gray', maintenance:'badge-yellow', retired:'badge-gray' }

function dateStr(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function warnBadge(days) {
  if (days === null) return null
  if (days < 0) return <span className="badge badge-red ml-1">Expired</span>
  if (days <= 30) return <span className="badge badge-yellow ml-1">{days}d left</span>
  return null
}

export default function Vehicles() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [typeF, setTypeF]     = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [viewData, setViewData] = useState(null)
  const [delId, setDelId]     = useState(null)
  const [routes, setRoutes]   = useState([])
  const [drivers, setDrivers] = useState([])
  const debounce = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/vehicles', { params: { page, limit: 20, search, status: statusF, type: typeF } })
      setRows(r.data || []); setTotal(r.total || 0)
    } catch { toast.error('Failed to load vehicles') }
    finally { setLoading(false) }
  }, [page, search, statusF, typeF])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([
      api.get('/transport/routes',  { params: { limit: 100, status: 'active' } }),
      api.get('/transport/drivers', { params: { limit: 100, status: 'active' } }),
    ]).then(([r, d]) => { setRoutes(r.data || []); setDrivers(d.data || []) }).catch(() => {})
  }, [])

  const onSearch = v => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setSearch(v); setPage(1) }, 280)
  }

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal('add') }
  const openEdit = r => {
    const toDateInput = d => d ? new Date(d).toISOString().split('T')[0] : ''
    setForm({ ...EMPTY, ...r,
      assignedRoute: r.assignedRoute?._id || r.assignedRoute || '',
      assignedDriver: r.assignedDriver?._id || r.assignedDriver || '',
      purchaseDate: toDateInput(r.purchaseDate),
      insuranceExpiry: toDateInput(r.insuranceExpiry),
      taxExpiry: toDateInput(r.taxExpiry),
      fitnessExpiry: toDateInput(r.fitnessExpiry),
    })
    setEditId(r._id); setModal('add')
  }
  const openView = async r => {
    try {
      const d = await api.get(`/transport/vehicles/${r._id}`)
      setViewData(d); setModal('view')
    } catch { toast.error('Failed to load vehicle details') }
  }

  const save = async () => {
    if (!form.vehicleNumber.trim()) return toast.error('Vehicle number is required')
    if (!form.seatingCapacity || form.seatingCapacity < 1) return toast.error('Seating capacity must be valid')
    setSaving(true)
    try {
      if (editId) { await api.put(`/transport/vehicles/${editId}`, form); toast.success('Vehicle updated') }
      else { await api.post('/transport/vehicles', form); toast.success('Vehicle added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/transport/vehicles/${delId}`); toast.success('Vehicle deleted'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Cannot delete vehicle') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vehicles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} vehicles registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Vehicle</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input className="field pl-9" placeholder="Search vehicle number, model, registration…" onChange={e => onSearch(e.target.value)} />
        </div>
        <select className="field w-auto" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        <select className="field w-auto" value={typeF} onChange={e => { setTypeF(e.target.value); setPage(1) }}>
          <option value="">All Types</option>
          <option value="bus">Bus</option>
          <option value="van">Van</option>
          <option value="mini-bus">Mini-Bus</option>
          <option value="car">Car</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No vehicles found" sub="Add your first vehicle" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Vehicle No</th>
                <th className="table-cell text-left">Type / Model</th>
                <th className="table-cell text-center">Capacity</th>
                <th className="table-cell text-left">Route</th>
                <th className="table-cell text-left">Driver</th>
                <th className="table-cell text-left">Insurance</th>
                <th className="table-cell text-left">Tax</th>
                <th className="table-cell text-left">Fitness</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-semibold font-mono">{r.vehicleNumber}</td>
                    <td className="table-cell text-xs">{r.vehicleType} {r.vehicleModel ? `— ${r.vehicleModel}` : ''}</td>
                    <td className="table-cell text-center">{r.seatingCapacity}</td>
                    <td className="table-cell text-xs">{r.assignedRoute?.routeCode || '—'}</td>
                    <td className="table-cell text-xs">{r.assignedDriver?.name || '—'}</td>
                    <td className="table-cell text-xs">{dateStr(r.insuranceExpiry)}{warnBadge(r.insuranceDays)}</td>
                    <td className="table-cell text-xs">{dateStr(r.taxExpiry)}{warnBadge(r.taxDays)}</td>
                    <td className="table-cell text-xs">{dateStr(r.fitnessExpiry)}{warnBadge(r.fitnessDays)}</td>
                    <td className="table-cell">
                      <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openView(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><FaEye size={13} /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500"><FaEdit size={13} /></button>
                        <button onClick={() => setDelId(r._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><FaTrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="vehicles" />

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(false)} title={editId ? 'Edit Vehicle' : 'Add Vehicle'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Vehicle Number *</label><input className="field" value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} placeholder="e.g. BA 1 KHA 1234" /></div>
          <div><label className="label">Registration Number</label><input className="field" value={form.registrationNumber} onChange={e => f('registrationNumber', e.target.value)} /></div>
          <div><label className="label">Vehicle Type</label>
            <select className="field" value={form.vehicleType} onChange={e => f('vehicleType', e.target.value)}>
              {['bus','van','mini-bus','car','other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Vehicle Model</label><input className="field" value={form.vehicleModel} onChange={e => f('vehicleModel', e.target.value)} /></div>
          <div><label className="label">Manufacturer</label><input className="field" value={form.manufacturer} onChange={e => f('manufacturer', e.target.value)} /></div>
          <div><label className="label">Manufacturing Year</label><input className="field" value={form.manufacturingYear} onChange={e => f('manufacturingYear', e.target.value)} placeholder="e.g. 2015" /></div>
          <div><label className="label">Seating Capacity *</label><input type="number" className="field" value={form.seatingCapacity} onChange={e => f('seatingCapacity', e.target.value)} min={1} /></div>
          <div><label className="label">Purchase Date</label><input type="date" className="field" value={form.purchaseDate} onChange={e => f('purchaseDate', e.target.value)} /></div>
          <div><label className="label">Insurance Number</label><input className="field" value={form.insuranceNumber} onChange={e => f('insuranceNumber', e.target.value)} /></div>
          <div><label className="label">Insurance Expiry</label><input type="date" className="field" value={form.insuranceExpiry} onChange={e => f('insuranceExpiry', e.target.value)} /></div>
          <div><label className="label">Tax Expiry</label><input type="date" className="field" value={form.taxExpiry} onChange={e => f('taxExpiry', e.target.value)} /></div>
          <div><label className="label">Fitness Certificate Expiry</label><input type="date" className="field" value={form.fitnessExpiry} onChange={e => f('fitnessExpiry', e.target.value)} /></div>
          <div><label className="label">Assigned Route</label>
            <select className="field" value={form.assignedRoute} onChange={e => f('assignedRoute', e.target.value)}>
              <option value="">— None —</option>
              {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
            </select>
          </div>
          <div><label className="label">Assigned Driver</label>
            <select className="field" value={form.assignedDriver} onChange={e => f('assignedDriver', e.target.value)}>
              <option value="">— None —</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
            </select>
          </div>
          <div><label className="label">Status</label>
            <select className="field" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div><label className="label">Remarks</label><input className="field" value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(false)} title="Vehicle Details" size="lg">
        {viewData?.vehicle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Vehicle Number',    viewData.vehicle.vehicleNumber],
                ['Registration No',  viewData.vehicle.registrationNumber || '—'],
                ['Type',             viewData.vehicle.vehicleType],
                ['Model',            viewData.vehicle.vehicleModel || '—'],
                ['Manufacturer',     viewData.vehicle.manufacturer || '—'],
                ['Year',             viewData.vehicle.manufacturingYear || '—'],
                ['Capacity',         viewData.vehicle.seatingCapacity],
                ['Active Students',  viewData.studentCount],
                ['Insurance Expiry', dateStr(viewData.vehicle.insuranceExpiry)],
                ['Tax Expiry',       dateStr(viewData.vehicle.taxExpiry)],
                ['Fitness Expiry',   dateStr(viewData.vehicle.fitnessExpiry)],
                ['Status',           viewData.vehicle.status],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500">{l}</div>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Vehicle" message="Are you sure you want to delete this vehicle?" />
    </div>
  )
}
