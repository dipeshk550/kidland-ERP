import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { name:'', employeeId:'', phone:'', address:'', assignedVehicle:'', assignedRoute:'', joiningDate:'', emergencyContact:'', status:'active', remarks:'' }
const toInput = d => d ? new Date(d).toISOString().split('T')[0] : ''

export default function VehicleStaff() {
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [statusF, setStatusF] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [delId, setDelId]     = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes]     = useState([])
  const debounce = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/staff', { params: { page, limit: 20, search, status: statusF } })
      setRows(r.data || []); setTotal(r.total || 0)
    } catch { toast.error('Failed to load staff') }
    finally { setLoading(false) }
  }, [page, search, statusF])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([
      api.get('/transport/vehicles', { params: { limit: 100, status: 'active' } }),
      api.get('/transport/routes',   { params: { limit: 100, status: 'active' } }),
    ]).then(([v, r]) => { setVehicles(v.data || []); setRoutes(r.data || []) }).catch(() => {})
  }, [])

  const onSearch = v => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { setSearch(v); setPage(1) }, 280)
  }

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = s => {
    setForm({ ...EMPTY, ...s, assignedVehicle: s.assignedVehicle?._id || s.assignedVehicle || '', assignedRoute: s.assignedRoute?._id || s.assignedRoute || '', joiningDate: toInput(s.joiningDate) })
    setEditId(s._id); setModal(true)
  }

  const save = async () => {
    if (!form.name.trim())  return toast.error('Name is required')
    if (!form.phone.trim()) return toast.error('Phone is required')
    setSaving(true)
    try {
      if (editId) { await api.put(`/transport/staff/${editId}`, form); toast.success('Staff updated') }
      else        { await api.post('/transport/staff', form);           toast.success('Staff added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/transport/staff/${delId}`); toast.success('Staff deleted'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Cannot delete') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Staff / Helpers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} staff registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Staff</button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input className="field pl-9" placeholder="Search name, phone…" onChange={e => onSearch(e.target.value)} />
        </div>
        <select className="field w-auto" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On Leave</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No staff found" sub="Add your first vehicle helper/attendant" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Name</th>
                <th className="table-cell text-left">Emp ID</th>
                <th className="table-cell text-left">Phone</th>
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Route</th>
                <th className="table-cell text-left">Joining Date</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s._id} className="table-row">
                    <td className="table-cell font-semibold">{s.name}</td>
                    <td className="table-cell text-xs">{s.employeeId || '—'}</td>
                    <td className="table-cell text-xs">{s.phone}</td>
                    <td className="table-cell text-xs">{s.assignedVehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-xs">{s.assignedRoute?.routeCode || '—'}</td>
                    <td className="table-cell text-xs">{s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'on-leave' ? 'badge-yellow' : 'badge-gray'}`}>{s.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500"><FaEdit size={13} /></button>
                        <button onClick={() => setDelId(s._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><FaTrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="staff" />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Staff' : 'Add Vehicle Staff'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Full Name *</label><input className="field" value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">Employee ID</label><input className="field" value={form.employeeId} onChange={e => f('employeeId', e.target.value)} /></div>
          <div><label className="label">Phone *</label><input className="field" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">Emergency Contact</label><input className="field" value={form.emergencyContact} onChange={e => f('emergencyContact', e.target.value)} /></div>
          <div><label className="label">Joining Date</label><input type="date" className="field" value={form.joiningDate} onChange={e => f('joiningDate', e.target.value)} /></div>
          <div><label className="label">Status</label>
            <select className="field" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
          <div><label className="label">Assigned Vehicle</label>
            <select className="field" value={form.assignedVehicle} onChange={e => f('assignedVehicle', e.target.value)}>
              <option value="">— None —</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div><label className="label">Assigned Route</label>
            <select className="field" value={form.assignedRoute} onChange={e => f('assignedRoute', e.target.value)}>
              <option value="">— None —</option>
              {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Address</label><input className="field" value={form.address} onChange={e => f('address', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Staff' : 'Add Staff'}
          </button>
        </div>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Staff" message="Are you sure you want to remove this staff member?" />
    </div>
  )
}
