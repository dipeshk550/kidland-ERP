import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaTools } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const TYPES = ['regular-service','oil-change','repair','tyre-replacement','engine','brake','electrical','body-work','other']
const TYPE_COLORS = {
  'regular-service': 'badge-green',
  'oil-change':      'badge-yellow',
  'repair':          'badge-red',
  'tyre-replacement':'badge-yellow',
  'engine':          'badge-red',
  'brake':           'badge-yellow',
  'electrical':      'badge-yellow',
  'body-work':       'badge-gray',
  'other':           'badge-gray',
}
const toInput = d => d ? new Date(d).toISOString().split('T')[0] : ''

const EMPTY = { vehicle:'', serviceDate:'', maintenanceType:'regular-service', description:'', garage:'', mileage:'', cost:'', nextServiceDate:'', invoiceNumber:'', vehicleStatus:'', remarks:'' }

export default function VehicleMaintenance() {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [page, setPage]         = useState(1)
  const [vehicleF, setVehicleF] = useState('')
  const [typeF, setTypeF]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [delId, setDelId]       = useState(null)
  const [vehicles, setVehicles] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/maintenance', { params: { page, limit: 20, vehicleId: vehicleF, type: typeF } })
      setRows(r.data || []); setTotal(r.total || 0); setTotalCost(r.totalCost || 0)
    } catch { toast.error('Failed to load maintenance records') }
    finally { setLoading(false) }
  }, [page, vehicleF, typeF])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/transport/vehicles', { params: { limit: 100 } })
      .then(r => setVehicles(r.data || [])).catch(() => {})
  }, [])

  const openAdd  = () => { setForm({ ...EMPTY, serviceDate: new Date().toISOString().split('T')[0] }); setEditId(null); setModal(true) }
  const openEdit = r => {
    setForm({ ...EMPTY, ...r, vehicle: r.vehicle?._id || r.vehicle || '', serviceDate: toInput(r.serviceDate), nextServiceDate: toInput(r.nextServiceDate) })
    setEditId(r._id); setModal(true)
  }

  const save = async () => {
    if (!form.vehicle)      return toast.error('Vehicle is required')
    if (!form.serviceDate)  return toast.error('Service date is required')
    if (!form.cost || form.cost < 0) return toast.error('Cost must be a valid number')
    setSaving(true)
    try {
      if (editId) { await api.put(`/transport/maintenance/${editId}`, form); toast.success('Record updated') }
      else        { await api.post('/transport/maintenance', form);           toast.success('Maintenance record added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/transport/maintenance/${delId}`); toast.success('Record deleted'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Cannot delete') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Summary cards
  const thisMonth = rows.filter(r => {
    const d = new Date(r.serviceDate)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, r) => s + r.cost, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} maintenance records</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Record</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600"><FaTools size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">{total}</div><div className="text-xs text-gray-500">Total Records</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600"><FaTools size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {totalCost.toLocaleString()}</div><div className="text-xs text-gray-500">Total Maintenance Cost</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600"><FaTools size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {thisMonth.toLocaleString()}</div><div className="text-xs text-gray-500">This Month</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select className="field flex-1" value={vehicleF} onChange={e => { setVehicleF(e.target.value); setPage(1) }}>
          <option value="">All Vehicles</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.vehicleType})</option>)}
        </select>
        <select className="field w-auto" value={typeF} onChange={e => { setTypeF(e.target.value); setPage(1) }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No maintenance records" sub="Track vehicle maintenance using the button above" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Service Date</th>
                <th className="table-cell text-left">Type</th>
                <th className="table-cell text-left">Description</th>
                <th className="table-cell text-left">Garage</th>
                <th className="table-cell text-right">Cost (Rs.)</th>
                <th className="table-cell text-left">Next Service</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-semibold font-mono">{r.vehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-xs">{new Date(r.serviceDate).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <span className={`badge ${TYPE_COLORS[r.maintenanceType] || 'badge-gray'} text-xs capitalize`}>{r.maintenanceType?.replace(/-/g,' ')}</span>
                    </td>
                    <td className="table-cell text-xs max-w-[150px] truncate">{r.description || '—'}</td>
                    <td className="table-cell text-xs">{r.garage || '—'}</td>
                    <td className="table-cell text-right font-semibold text-red-600">{r.cost?.toLocaleString()}</td>
                    <td className="table-cell text-xs">{r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
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
      <Pagination page={page} total={total} perPage={20} onChange={setPage} label="records" />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Maintenance Record' : 'Add Maintenance Record'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Vehicle *</label>
            <select className="field" value={form.vehicle} onChange={e => f('vehicle', e.target.value)}>
              <option value="">— Select Vehicle —</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} — {v.vehicleType}</option>)}
            </select>
          </div>
          <div><label className="label">Service Date *</label><input type="date" className="field" value={form.serviceDate} onChange={e => f('serviceDate', e.target.value)} /></div>
          <div><label className="label">Maintenance Type</label>
            <select className="field" value={form.maintenanceType} onChange={e => f('maintenanceType', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g,' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Garage / Vendor</label><input className="field" value={form.garage} onChange={e => f('garage', e.target.value)} /></div>
          <div><label className="label">Mileage at Service</label><input type="number" className="field" value={form.mileage} onChange={e => f('mileage', e.target.value)} /></div>
          <div><label className="label">Cost (Rs.) *</label><input type="number" className="field" value={form.cost} onChange={e => f('cost', e.target.value)} min={0} /></div>
          <div><label className="label">Next Service Date</label><input type="date" className="field" value={form.nextServiceDate} onChange={e => f('nextServiceDate', e.target.value)} /></div>
          <div><label className="label">Invoice Number</label><input className="field" value={form.invoiceNumber} onChange={e => f('invoiceNumber', e.target.value)} /></div>
          <div><label className="label">Update Vehicle Status</label>
            <select className="field" value={form.vehicleStatus} onChange={e => f('vehicleStatus', e.target.value)}>
              <option value="">— Don't change —</option>
              <option value="active">Active (Service Complete)</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea className="field" rows={2} value={form.description} onChange={e => f('description', e.target.value)} /></div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Record" message="Are you sure you want to delete this maintenance record?" />
    </div>
  )
}
