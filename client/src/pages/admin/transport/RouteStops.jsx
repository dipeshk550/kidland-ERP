import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaMapMarkerAlt } from 'react-icons/fa'
import { EmptyState, Spinner, Modal, Confirm } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const EMPTY_STOP = {
  stopName:'', location:'', stopOrder:1, pickupTime:'', dropoffTime:'',
  landmark:'', contactPerson:'', contactNumber:'', status:'active', remarks:''
}

export default function RouteStops() {
  const [routes, setRoutes]     = useState([])
  const [routeId, setRouteId]   = useState('')
  const [stops, setStops]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY_STOP)
  const [editId, setEditId]     = useState(null)
  const [delId, setDelId]       = useState(null)

  useEffect(() => {
    api.get('/transport/routes', { params: { limit: 100, status: 'active' } })
      .then(r => setRoutes(r.data || [])).catch(() => {})
  }, [])

  const loadStops = useCallback(async () => {
    if (!routeId) return
    setLoading(true)
    try {
      const r = await api.get('/transport/stops', { params: { routeId } })
      setStops(r.data || [])
    } catch { toast.error('Failed to load stops') }
    finally { setLoading(false) }
  }, [routeId])

  useEffect(() => { loadStops() }, [loadStops])

  const openAdd = () => {
    setForm({ ...EMPTY_STOP, stopOrder: stops.length + 1, route: routeId })
    setEditId(null); setModal(true)
  }
  const openEdit = s => {
    setForm({ ...s, route: s.route?._id || s.route || routeId })
    setEditId(s._id); setModal(true)
  }

  const save = async () => {
    if (!form.stopName.trim()) return toast.error('Stop name is required')
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/transport/stops/${editId}`, form)
        toast.success('Stop updated')
      } else {
        await api.post('/transport/stops', { ...form, route: routeId })
        toast.success('Stop added')
      }
      setModal(false); loadStops()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try {
      await api.delete(`/transport/stops/${delId}`)
      toast.success('Stop deleted'); setDelId(null); loadStops()
    } catch (e) { toast.error(e.message || 'Cannot delete') }
  }

  const move = async (idx, dir) => {
    const arr = [...stops]
    const other = idx + dir
    if (other < 0 || other >= arr.length) return
    const updated = arr.map((s, i) => {
      if (i === idx)   return { ...s, stopOrder: arr[other].stopOrder }
      if (i === other) return { ...s, stopOrder: arr[idx].stopOrder }
      return s
    }).sort((a, b) => a.stopOrder - b.stopOrder)
    setStops(updated)
    try {
      await api.put('/transport/stops/reorder', {
        stops: updated.map((s, i) => ({ _id: s._id, stopOrder: i + 1 }))
      })
    } catch { toast.error('Failed to reorder') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Route Stops</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage stops for each route</p>
        </div>
        {routeId && (
          <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> Add Stop</button>
        )}
      </div>

      {/* Route Selector */}
      <div className="card p-4">
        <label className="label">Select Route</label>
        <select className="field max-w-sm" value={routeId} onChange={e => setRouteId(e.target.value)}>
          <option value="">— Choose a route to manage stops —</option>
          {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
        </select>
      </div>

      {/* Stops */}
      {!routeId ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <FaMapMarkerAlt size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">Select a route above to view and manage its stops</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : stops.length === 0 ? (
        <div className="py-6"><EmptyState title="No stops yet" sub="Add stops for this route using the button above" /></div>
      ) : (
        <div className="space-y-3">
          {stops.map((s, idx) => (
            <div key={s._id} className="card p-4 flex items-start gap-4">
              <div className="w-9 h-9 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">{s.stopName}</span>
                  <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-3">
                  {s.location && <span>📍 {s.location}</span>}
                  {s.pickupTime && <span>🚌 Pickup: {s.pickupTime}</span>}
                  {s.dropoffTime && <span>🏠 Drop-off: {s.dropoffTime}</span>}
                  {s.landmark && <span>🏛 {s.landmark}</span>}
                  {s.contactPerson && <span>👤 {s.contactPerson} {s.contactNumber}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30" title="Move Up">
                  <FaArrowUp size={12} />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === stops.length - 1}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30" title="Move Down">
                  <FaArrowDown size={12} />
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-amber-50 text-amber-500" title="Edit">
                  <FaEdit size={13} />
                </button>
                <button onClick={() => setDelId(s._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete">
                  <FaTrash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Stop' : 'Add Stop'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label">Stop Name *</label><input className="field" value={form.stopName} onChange={e => f('stopName', e.target.value)} placeholder="e.g. Baneshwor Chowk" /></div>
          <div><label className="label">Location / Address</label><input className="field" value={form.location} onChange={e => f('location', e.target.value)} /></div>
          <div><label className="label">Landmark</label><input className="field" value={form.landmark} onChange={e => f('landmark', e.target.value)} /></div>
          <div><label className="label">Pickup Time</label><input type="time" className="field" value={form.pickupTime} onChange={e => f('pickupTime', e.target.value)} /></div>
          <div><label className="label">Drop-off Time</label><input type="time" className="field" value={form.dropoffTime} onChange={e => f('dropoffTime', e.target.value)} /></div>
          <div><label className="label">Contact Person</label><input className="field" value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} /></div>
          <div><label className="label">Contact Number</label><input className="field" value={form.contactNumber} onChange={e => f('contactNumber', e.target.value)} /></div>
          <div><label className="label">Status</label>
            <select className="field" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div><label className="label">Stop Order</label><input type="number" className="field" value={form.stopOrder} onChange={e => f('stopOrder', +e.target.value)} min={1} /></div>
          <div className="md:col-span-2"><label className="label">Remarks</label><textarea className="field" rows={2} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t dark:border-gray-700">
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editId ? 'Update Stop' : 'Add Stop'}
          </button>
        </div>
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={del}
        title="Delete Stop" message="Are you sure you want to delete this stop?" />
    </div>
  )
}
