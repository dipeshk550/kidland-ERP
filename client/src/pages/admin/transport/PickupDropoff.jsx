import { useState, useEffect, useCallback } from 'react'
import { FaCheckCircle, FaTimesCircle, FaClock, FaSave } from 'react-icons/fa'
import { EmptyState, Spinner } from '../../../components/ui/index'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['present','absent','late','not-required']
const STATUS_COLORS  = { present:'text-green-600 bg-green-50', absent:'text-red-600 bg-red-50', late:'text-amber-600 bg-amber-50', 'not-required':'text-gray-500 bg-gray-50' }

export default function PickupDropoff() {
  const [routes, setRoutes]     = useState([])
  const [routeId, setRouteId]   = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [attendance, setAttendance] = useState(null)
  const [records, setRecords]   = useState([])

  useEffect(() => {
    api.get('/transport/routes', { params: { limit: 100, status: 'active' } })
      .then(r => setRoutes(r.data || [])).catch(() => {})
  }, [])

  const loadAttendance = useCallback(async () => {
    if (!routeId || !date) return
    setLoading(true)
    try {
      const r = await api.get('/transport/attendance', { params: { date, routeId } })
      setAttendance(r)
      setRecords((r.students || []).map(s => ({
        studentId:    s.studentId,
        studentName:  s.studentName,
        class:        s.class,
        pickupStop:   s.pickupStop,
        dropoffStop:  s.dropoffStop,
        pickupStatus:  s.pickupStatus  || 'present',
        dropoffStatus: s.dropoffStatus || 'present',
        remarks:      s.remarks || '',
      })))
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }, [routeId, date])

  const markAll = (field, status) => {
    setRecords(r => r.map(s => ({ ...s, [field]: status })))
  }

  const updateRecord = (idx, field, value) => {
    setRecords(r => r.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const save = async () => {
    if (!routeId || !date) return toast.error('Select route and date first')
    if (records.length === 0) return toast.error('No students to save')
    setSaving(true)
    try {
      const route = routes.find(r => r._id === routeId)
      await api.post('/transport/attendance', {
        date,
        routeId,
        vehicleId: attendance?.route?.vehicle?._id || '',
        driverId:  attendance?.route?.driver?._id  || '',
        records,
      })
      toast.success(`Attendance saved for ${records.length} student(s)`)
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const counts = {
    pickup:  { present: records.filter(r => r.pickupStatus  === 'present').length, absent: records.filter(r => r.pickupStatus  === 'absent').length, late: records.filter(r => r.pickupStatus  === 'late').length },
    dropoff: { present: records.filter(r => r.dropoffStatus === 'present').length, absent: records.filter(r => r.dropoffStatus === 'absent').length, late: records.filter(r => r.dropoffStatus === 'late').length },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pickup / Drop-off Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Mark daily student transport attendance</p>
        </div>
        {records.length > 0 && (
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaSave size={12} /> Save Attendance</>}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="label">Date</label>
          <input type="date" className="field" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">Route</label>
          <select className="field" value={routeId} onChange={e => setRouteId(e.target.value)}>
            <option value="">— Select Route —</option>
            {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={loadAttendance} disabled={!routeId || !date || loading}>
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Load Attendance'}
        </button>
      </div>

      {/* Route Info */}
      {attendance?.route && (
        <div className="card p-4 flex flex-wrap gap-4 text-sm">
          <div><span className="text-gray-500">Route: </span><span className="font-semibold">{attendance.route.routeName}</span></div>
          {attendance.route.vehicle && <div><span className="text-gray-500">Vehicle: </span><span className="font-semibold">{attendance.route.vehicle.vehicleNumber}</span></div>}
          {attendance.route.driver && <div><span className="text-gray-500">Driver: </span><span className="font-semibold">{attendance.route.driver.name}</span></div>}
        </div>
      )}

      {!routeId ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <FaCheckCircle size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500">Select a route and date, then click "Load Attendance"</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : records.length === 0 ? (
        <div className="py-6"><EmptyState title="No students on this route" sub="Assign students to this route first from Student Transport page" /></div>
      ) : (
        <>
          {/* Bulk actions */}
          <div className="card p-3 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium mr-1">Pickup:</span>
            <button onClick={() => markAll('pickupStatus', 'present')} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium">All Present</button>
            <button onClick={() => markAll('pickupStatus', 'absent')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium">All Absent</button>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium mr-1">Drop-off:</span>
            <button onClick={() => markAll('dropoffStatus', 'present')} className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium">All Present</button>
            <button onClick={() => markAll('dropoffStatus', 'absent')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium">All Absent</button>
          </div>

          {/* Attendance Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="table-head">
                  <th className="table-cell text-left w-6">#</th>
                  <th className="table-cell text-left">Student</th>
                  <th className="table-cell text-left">Class</th>
                  <th className="table-cell text-left">Pickup Stop</th>
                  <th className="table-cell text-center">Pickup Status</th>
                  <th className="table-cell text-left">Drop-off Stop</th>
                  <th className="table-cell text-center">Drop-off Status</th>
                  <th className="table-cell text-left">Remarks</th>
                </tr></thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.studentId} className="table-row">
                      <td className="table-cell text-gray-400">{idx + 1}</td>
                      <td className="table-cell font-medium">{r.studentName}</td>
                      <td className="table-cell text-xs">{r.class}</td>
                      <td className="table-cell text-xs">{r.pickupStop || '—'}</td>
                      <td className="table-cell">
                        <select
                          value={r.pickupStatus}
                          onChange={e => updateRecord(idx, 'pickupStatus', e.target.value)}
                          className={`text-xs rounded-lg px-2 py-1 border-0 font-semibold ${STATUS_COLORS[r.pickupStatus] || ''}`}>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="table-cell text-xs">{r.dropoffStop || '—'}</td>
                      <td className="table-cell">
                        <select
                          value={r.dropoffStatus}
                          onChange={e => updateRecord(idx, 'dropoffStatus', e.target.value)}
                          className={`text-xs rounded-lg px-2 py-1 border-0 font-semibold ${STATUS_COLORS[r.dropoffStatus] || ''}`}>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="table-cell">
                        <input className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent w-24" value={r.remarks} onChange={e => updateRecord(idx, 'remarks', e.target.value)} placeholder="Remark…" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-4 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Pickup — </span>
              <span className="text-green-600 font-semibold">Present: {counts.pickup.present}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-red-600 font-semibold">Absent: {counts.pickup.absent}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-amber-600 font-semibold">Late: {counts.pickup.late}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Drop-off — </span>
              <span className="text-green-600 font-semibold">Present: {counts.dropoff.present}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-red-600 font-semibold">Absent: {counts.dropoff.absent}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-amber-600 font-semibold">Late: {counts.dropoff.late}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
