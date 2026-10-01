import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaEdit, FaTrash, FaGasPump } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm, Pagination } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { vehicle:'', date: new Date().toISOString().split('T')[0], fuelType:'diesel', quantity:'', ratePerUnit:'', currentMileage:'', fuelStation:'', driver:'', remarks:'' }
const toInput = d => d ? new Date(d).toISOString().split('T')[0] : ''

export default function FuelManagement() {
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [totalQty, setTotalQty]   = useState(0)
  const [page, setPage]           = useState(1)
  const [vehicleF, setVehicleF]   = useState('')
  const [fromF, setFromF]         = useState('')
  const [toF, setToF]             = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [delId, setDelId]         = useState(null)
  const [vehicles, setVehicles]   = useState([])
  const [drivers, setDrivers]     = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/transport/fuel', { params: { page, limit: 20, vehicleId: vehicleF, from: fromF, to: toF } })
      setRows(r.data || []); setTotal(r.total || 0); setTotalCost(r.totalCost || 0); setTotalQty(r.totalQty || 0)
    } catch { toast.error('Failed to load fuel records') }
    finally { setLoading(false) }
  }, [page, vehicleF, fromF, toF])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([
      api.get('/transport/vehicles', { params: { limit: 100 } }),
      api.get('/transport/drivers',  { params: { limit: 100, status: 'active' } }),
    ]).then(([v, d]) => { setVehicles(v.data || []); setDrivers(d.data || []) }).catch(() => {})
  }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = r => {
    setForm({ ...EMPTY, ...r, vehicle: r.vehicle?._id || r.vehicle || '', driver: r.driver?._id || r.driver || '', date: toInput(r.date) })
    setEditId(r._id); setModal(true)
  }

  const save = async () => {
    if (!form.vehicle)    return toast.error('Vehicle is required')
    if (!form.quantity || form.quantity <= 0)   return toast.error('Quantity must be valid')
    if (!form.ratePerUnit || form.ratePerUnit <= 0) return toast.error('Rate per unit must be valid')
    setSaving(true)
    try {
      if (editId) { await api.put(`/transport/fuel/${editId}`, form); toast.success('Record updated') }
      else        { await api.post('/transport/fuel', form);           toast.success('Fuel record added') }
      setModal(false); load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/transport/fuel/${delId}`); toast.success('Record deleted'); setDelId(null); load() }
    catch (e) { toast.error(e.message || 'Cannot delete') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const calcTotal = (qty, rate) => {
    const q = parseFloat(qty) || 0
    const r = parseFloat(rate) || 0
    return (q * r).toFixed(2)
  }

  const avgRate = totalQty > 0 ? (totalCost / totalQty).toFixed(2) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fuel Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} fuel records</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Record</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600"><FaGasPump size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">{total}</div><div className="text-xs text-gray-500">Total Records</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600"><FaGasPump size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {totalCost.toLocaleString()}</div><div className="text-xs text-gray-500">Total Fuel Cost</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600"><FaGasPump size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">{totalQty.toFixed(1)} L</div><div className="text-xs text-gray-500">Total Quantity</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600"><FaGasPump size={16} /></div>
          <div><div className="text-xl font-bold text-gray-900 dark:text-white">Rs. {avgRate}</div><div className="text-xs text-gray-500">Avg Cost/Liter</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select className="field flex-1" value={vehicleF} onChange={e => { setVehicleF(e.target.value); setPage(1) }}>
          <option value="">All Vehicles</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
        </select>
        <div>
          <label className="label">From</label>
          <input type="date" className="field" value={fromF} onChange={e => { setFromF(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="field" value={toF} onChange={e => { setToF(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
         rows.length === 0 ? <div className="py-10"><EmptyState title="No fuel records" sub="Track vehicle fuel fill-ups using the button above" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Date</th>
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Fuel Type</th>
                <th className="table-cell text-right">Qty (L)</th>
                <th className="table-cell text-right">Rate/L</th>
                <th className="table-cell text-right">Total (Rs.)</th>
                <th className="table-cell text-right">Mileage</th>
                <th className="table-cell text-left">Station</th>
                <th className="table-cell text-left">Driver</th>
                <th className="table-cell text-center">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell text-xs">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="table-cell font-semibold font-mono">{r.vehicle?.vehicleNumber || '—'}</td>
                    <td className="table-cell text-xs capitalize">{r.fuelType}</td>
                    <td className="table-cell text-right">{r.quantity}</td>
                    <td className="table-cell text-right">{r.ratePerUnit}</td>
                    <td className="table-cell text-right font-semibold text-red-600">{r.totalCost?.toLocaleString()}</td>
                    <td className="table-cell text-right text-xs">{r.currentMileage ? `${r.currentMileage} km` : '—'}</td>
                    <td className="table-cell text-xs">{r.fuelStation || '—'}</td>
                    <td className="table-cell text-xs">{r.driver?.name || '—'}</td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Fuel Record' : 'Add Fuel Record'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Vehicle *</label>
            <select className="field" value={form.vehicle} onChange={e => f('vehicle', e.target.value)}>
              <option value="">— Select Vehicle —</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div><label className="label">Date *</label><input type="date" className="field" value={form.date} onChange={e => f('date', e.target.value)} /></div>
          <div><label className="label">Fuel Type</label>
            <select className="field" value={form.fuelType} onChange={e => f('fuelType', e.target.value)}>
              {['diesel','petrol','electric','cng','other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Fuel Station</label><input className="field" value={form.fuelStation} onChange={e => f('fuelStation', e.target.value)} /></div>
          <div><label className="label">Quantity (Liters) *</label><input type="number" className="field" value={form.quantity} onChange={e => f('quantity', e.target.value)} min={0} step={0.1} /></div>
          <div><label className="label">Rate Per Liter (Rs.) *</label><input type="number" className="field" value={form.ratePerUnit} onChange={e => f('ratePerUnit', e.target.value)} min={0} /></div>
          <div className="md:col-span-2">
            <label className="label">Total Cost (Auto-calculated)</label>
            <div className="field bg-gray-50 dark:bg-gray-800 font-bold text-green-600 text-lg">
              Rs. {calcTotal(form.quantity, form.ratePerUnit)}
            </div>
          </div>
          <div><label className="label">Current Mileage (km)</label><input type="number" className="field" value={form.currentMileage} onChange={e => f('currentMileage', e.target.value)} /></div>
          <div><label className="label">Driver</label>
            <select className="field" value={form.driver} onChange={e => f('driver', e.target.value)}>
              <option value="">— None —</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Record' : 'Add Fuel Record'}
          </button>
        </div>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Record" message="Are you sure you want to delete this fuel record?" />
    </div>
  )
}
