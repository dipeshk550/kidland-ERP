import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaRoute, FaTimes } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY = {
  routeName:'', routeCode:'', description:'', startPoint:'', endPoint:'',
  morningStartTime:'', schoolArrivalTime:'', returnStartTime:'', estimatedReturnTime:'',
  vehicle:'', driver:'', helper:'', status:'active', remarks:''
}

export default function Routes() {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(false)   // 'add' | 'edit' | 'view'
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [viewData, setViewData] = useState(null)
  const [delId, setDelId]       = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers]   = useState([])
  const [helpers, setHelpers]   = useState([])
  const debounce = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/routes', { params: { page, limit: 20, search, status: statusF } })
      setRows(r.data || []); setTotal(r.total || 0)
    } catch { toast.error('Failed to load routes') }
    finally { setLoading(false) }
  }, [page, search, statusF])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      api.get('/transport/vehicles', { params: { limit: 100, status: 'active' } }),
      api.get('/transport/drivers',  { params: { limit: 100, status: 'active' } }),
      api.get('/transport/staff',    { params: { limit: 100, status: 'active' } }),
    ]).then(([v, d, h]) => {
      setVehicles(v.data || []); setDrivers(d.data || []); setHelpers(h.data || [])
    }).catch(() => {})
  }, [])

  const onSearch = v => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setSearch(v); setPage(1) }, 280)
  }

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('add') }
  const openEdit = r => { setForm({ ...EMPTY, ...r, vehicle: r.vehicle?._id||'', driver: r.driver?._id||'', helper: r.helper?._id||'' }); setEditId(r._id); setModal('edit') }
  const openView = async r => {
    try {
      const d = await api.get(`/transport/routes/${r._id}`)
      setViewData(d); setModal('view')
    } catch { toast.error('Failed to load route details') }
  }

  const save = async () => {
    if (!form.routeName.trim() || !form.routeCode.trim() || !form.startPoint.trim() || !form.endPoint.trim())
      return toast.error('Route Name, Code, Start Point, End Point are required')
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/transport/routes/${editId}`, form)
        toast.success('Route updated')
      } else {
        await api.post('/transport/routes', form)
        toast.success('Route created')
      }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try {
      await api.delete(`/transport/routes/${delId}`)
      toast.success('Route deleted'); setDelId(null); load()
    } catch (e) { toast.error(e.message || 'Cannot delete route') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Routes Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} routes configured</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Route</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input className="field pl-9" placeholder="Search route name, code, start point…"
            onChange={e => onSearch(e.target.value)} />
        </div>
        <select className="field w-auto" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No routes found" sub="Add your first transport route" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Code</th>
                <th className="table-cell text-left">Route Name</th>
                <th className="table-cell text-left">From → To</th>
                <th className="table-cell text-left">Morning</th>
                <th className="table-cell text-left">Return</th>
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Driver</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-mono font-semibold text-primary-600">{r.routeCode}</td>
                    <td className="table-cell font-medium">{r.routeName}</td>
                    <td className="table-cell text-xs">{r.startPoint} → {r.endPoint}</td>
                    <td className="table-cell text-xs">{r.morningStartTime || '—'}</td>
                    <td className="table-cell text-xs">{r.returnStartTime || '—'}</td>
                    <td className="table-cell text-xs">{r.vehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-xs">{r.driver?.name || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${r.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{r.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openView(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="View"><FaEye size={13} /></button>
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500" title="Edit"><FaEdit size={13} /></button>
                        <button onClick={() => setDelId(r._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><FaTrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="routes" />

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(false)}
        title={editId ? 'Edit Route' : 'Add Route'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Route Name *</label><input className="field" value={form.routeName} onChange={e => f('routeName', e.target.value)} placeholder="e.g. Koteshwor - School" /></div>
          <div><label className="label">Route Code *</label><input className="field" value={form.routeCode} onChange={e => f('routeCode', e.target.value)} placeholder="e.g. RT-001" /></div>
          <div><label className="label">Start Point *</label><input className="field" value={form.startPoint} onChange={e => f('startPoint', e.target.value)} /></div>
          <div><label className="label">End Point *</label><input className="field" value={form.endPoint} onChange={e => f('endPoint', e.target.value)} /></div>
          <div><label className="label">Morning Start Time</label><input type="time" className="field" value={form.morningStartTime} onChange={e => f('morningStartTime', e.target.value)} /></div>
          <div><label className="label">School Arrival Time</label><input type="time" className="field" value={form.schoolArrivalTime} onChange={e => f('schoolArrivalTime', e.target.value)} /></div>
          <div><label className="label">Return Start Time</label><input type="time" className="field" value={form.returnStartTime} onChange={e => f('returnStartTime', e.target.value)} /></div>
          <div><label className="label">Estimated Return Time</label><input type="time" className="field" value={form.estimatedReturnTime} onChange={e => f('estimatedReturnTime', e.target.value)} /></div>
          <div><label className="label">Assigned Vehicle</label>
            <select className="field" value={form.vehicle} onChange={e => f('vehicle', e.target.value)}>
              <option value="">— None —</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.vehicleType})</option>)}
            </select>
          </div>
          <div><label className="label">Assigned Driver</label>
            <select className="field" value={form.driver} onChange={e => f('driver', e.target.value)}>
              <option value="">— None —</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
            </select>
          </div>
          <div><label className="label">Helper / Attendant</label>
            <select className="field" value={form.helper} onChange={e => f('helper', e.target.value)}>
              <option value="">— None —</option>
              {helpers.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>
          <div><label className="label">Status</label>
            <select className="field" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="field" rows={2} value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Route' : 'Create Route'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(false)} title="Route Details" size="lg">
        {viewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Route Code',    viewData.route?.routeCode],
                ['Route Name',    viewData.route?.routeName],
                ['Start Point',   viewData.route?.startPoint],
                ['End Point',     viewData.route?.endPoint],
                ['Morning Start', viewData.route?.morningStartTime || '—'],
                ['School Arrival',viewData.route?.schoolArrivalTime || '—'],
                ['Return Start',  viewData.route?.returnStartTime || '—'],
                ['Est. Return',   viewData.route?.estimatedReturnTime || '—'],
                ['Vehicle',       viewData.route?.vehicle?.vehicleNumber || '—'],
                ['Driver',        viewData.route?.driver?.name || '—'],
                ['Stops',         viewData.stops?.length || 0],
                ['Active Students', viewData.studentCount || 0],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{l}</div>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            {viewData.stops?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Route Stops</h4>
                <div className="space-y-1">
                  {viewData.stops.map((s, i) => (
                    <div key={s._id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <span className="font-medium">{s.stopName}</span>
                      {s.pickupTime && <span className="text-gray-500">Pickup: {s.pickupTime}</span>}
                      {s.dropoffTime && <span className="text-gray-500">Drop: {s.dropoffTime}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Route" message="Are you sure? Students assigned to this route may be affected." />
    </div>
  )
}
