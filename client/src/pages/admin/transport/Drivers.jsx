import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY = {
  name:'', employeeId:'', phone:'', address:'', licenseNumber:'', licenseCategory:'',
  licenseIssueDate:'', licenseExpiry:'', joiningDate:'', assignedVehicle:'',
  assignedRoute:'', emergencyContact:'', status:'active', remarks:''
}

function dateStr(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function toInput(d) { return d ? new Date(d).toISOString().split('T')[0] : '' }

export default function Drivers() {
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
      const r = await api.get('/transport/drivers', { params: { page, limit: 20, search, status: statusF } })
      setRows(r.data || []); setTotal(r.total || 0)
    } catch { toast.error('Failed to load drivers') }
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
  const openEdit = d => {
    setForm({ ...EMPTY, ...d,
      assignedVehicle: d.assignedVehicle?._id || d.assignedVehicle || '',
      assignedRoute:   d.assignedRoute?._id   || d.assignedRoute || '',
      licenseIssueDate: toInput(d.licenseIssueDate),
      licenseExpiry:    toInput(d.licenseExpiry),
      joiningDate:      toInput(d.joiningDate),
    })
    setEditId(d._id); setModal(true)
  }

  const save = async () => {
    if (!form.name.trim())          return toast.error('Driver name is required')
    if (!form.phone.trim())         return toast.error('Phone number is required')
    if (!form.licenseNumber.trim()) return toast.error('License number is required')
    setSaving(true)
    try {
      if (editId) { await api.put(`/transport/drivers/${editId}`, form); toast.success('Driver updated') }
      else        { await api.post('/transport/drivers', form);          toast.success('Driver added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/transport/drivers/${delId}`); toast.success('Driver deleted'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Cannot delete') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const licenseStatus = (d) => {
    if (!d.licenseExpiry) return null
    const days = Math.ceil((new Date(d.licenseExpiry) - new Date()) / 86400000)
    if (days < 0) return <span className="badge badge-red ml-1">Expired</span>
    if (days <= 30) return <span className="badge badge-yellow ml-1">{days}d left</span>
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Drivers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} drivers registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Driver</button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input className="field pl-9" placeholder="Search name, phone, license…" onChange={e => onSearch(e.target.value)} />
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
         rows.length === 0 ? <div className="py-10"><EmptyState title="No drivers found" sub="Add your first driver" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Name</th>
                <th className="table-cell text-left">Emp ID</th>
                <th className="table-cell text-left">Phone</th>
                <th className="table-cell text-left">License No</th>
                <th className="table-cell text-left">License Expiry</th>
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Route</th>
                <th className="table-cell text-left">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(d => (
                  <tr key={d._id} className="table-row">
                    <td className="table-cell font-semibold">{d.name}</td>
                    <td className="table-cell text-xs">{d.employeeId || '—'}</td>
                    <td className="table-cell text-xs">{d.phone}</td>
                    <td className="table-cell text-xs">{d.licenseNumber}</td>
                    <td className="table-cell text-xs">
                      <span className={d.licenseExpired ? 'text-red-600 font-semibold' : ''}>
                        {dateStr(d.licenseExpiry)}
                      </span>
                      {licenseStatus(d)}
                    </td>
                    <td className="table-cell text-xs">{d.assignedVehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-xs">{d.assignedRoute?.routeCode || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${d.status === 'active' ? 'badge-green' : d.status === 'on-leave' ? 'badge-yellow' : 'badge-gray'}`}>{d.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500"><FaEdit size={13} /></button>
                        <button onClick={() => setDelId(d._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><FaTrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="drivers" />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Driver' : 'Add Driver'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Full Name *</label><input className="field" value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">Employee ID</label><input className="field" value={form.employeeId} onChange={e => f('employeeId', e.target.value)} /></div>
          <div><label className="label">Phone *</label><input className="field" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">Emergency Contact</label><input className="field" value={form.emergencyContact} onChange={e => f('emergencyContact', e.target.value)} /></div>
          <div><label className="label">License Number *</label><input className="field" value={form.licenseNumber} onChange={e => f('licenseNumber', e.target.value)} /></div>
          <div><label className="label">License Category</label><input className="field" value={form.licenseCategory} onChange={e => f('licenseCategory', e.target.value)} placeholder="e.g. A, B, C" /></div>
          <div><label className="label">License Issue Date</label><input type="date" className="field" value={form.licenseIssueDate} onChange={e => f('licenseIssueDate', e.target.value)} /></div>
          <div><label className="label">License Expiry Date</label><input type="date" className="field" value={form.licenseExpiry} onChange={e => f('licenseExpiry', e.target.value)} /></div>
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
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Driver' : 'Add Driver'}
          </button>
        </div>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Driver" message="Are you sure you want to delete this driver?" />
    </div>
  )
}
