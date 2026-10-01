import { useState, useEffect, useCallback } from 'react'
import { FaPrint, FaChartBar, FaUserGraduate, FaRoute, FaTools, FaGasPump, FaSearch } from 'react-icons/fa'
import { Spinner, EmptyState } from '../../../components/ui/index'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../../services/api'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'summary',     label: 'Summary',     icon: FaChartBar },
  { key: 'students',    label: 'Students',    icon: FaUserGraduate },
  { key: 'route',       label: 'Routes',      icon: FaRoute },
  { key: 'maintenance', label: 'Maintenance', icon: FaTools },
  { key: 'fuel',        label: 'Fuel',        icon: FaGasPump },
]

export default function TransportReports() {
  const [tab, setTab]           = useState('summary')
  const [loading, setLoading]   = useState(false)
  const [data, setData]         = useState(null)
  const [error, setError]       = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes]     = useState([])
  const [vehicleF, setVehicleF] = useState('')
  const [routeF, setRouteF]     = useState('')
  const [fromF, setFromF]       = useState('')
  const [toF, setToF]           = useState('')

  // Load dropdown options once
  useEffect(() => {
    Promise.all([
      api.get('/transport/vehicles', { params: { limit: 100 } }),
      api.get('/transport/routes',   { params: { limit: 100 } }),
    ]).then(([v, r]) => {
      setVehicles(v.data || [])
      setRoutes(r.data || [])
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const params = { type: tab }
      if (vehicleF) params.vehicleId = vehicleF
      if (routeF)   params.routeId   = routeF
      if (fromF)    params.from      = fromF
      if (toF)      params.to        = toF
      const r = await api.get('/transport/reports', { params })
      setData(r)
    } catch (e) {
      setError(e?.message || 'Failed to load report')
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [tab, vehicleF, routeF, fromF, toF])

  // Reload whenever tab or filters change
  useEffect(() => { load() }, [load])

  const print = () => {
    const content = document.getElementById('print-area')?.innerHTML || '<p>No data</p>'
    const win = window.open('', '_blank', 'width=1000,height=700')
    win.document.write(`<!DOCTYPE html><html><head><title>Transport Report — ${tab.toUpperCase()}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; color: #111; }
      h2   { color: #0f6e0d; margin-bottom: 4px; }
      h4   { color: #333; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
      th { background: #f0fdf4; font-weight: 600; }
      tr:nth-child(even) { background: #f9fafb; }
      .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
      .stat-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
      .stat-val  { font-size: 22px; font-weight: bold; }
      .stat-lbl  { font-size: 12px; color: #666; margin-top: 4px; }
      .text-right { text-align: right; }
      .text-green { color: #16a34a; }
      .text-red   { color: #dc2626; }
      .total-row  { font-weight: bold; background: #f0fdf4; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head>
    <body>
      <h2>Kidland School — Transport Report</h2>
      <p style="color:#666;font-size:12px">Type: ${tab.toUpperCase()} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
      <hr style="margin:12px 0;border:none;border-top:1px solid #ddd"/>
      ${content}
    </body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  // ── helpers ─────────────────────────────────────────────────────────────────
  const fmt   = n => (n || 0).toLocaleString()
  const date  = d => d ? new Date(d).toLocaleDateString() : '—'
  const rows  = data?.data  || []
  const total = data?.total || rows.length

  const TabBtn = ({ t }) => (
    <button onClick={() => setTab(t.key)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        tab === t.key
          ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}>
      <t.icon size={12} /> {t.label}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transport Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Comprehensive transport data reports</p>
        </div>
        <button onClick={print} className="btn-ghost text-sm flex items-center gap-2">
          <FaPrint size={12} /> Print Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => <TabBtn key={t.key} t={t} />)}
      </div>

      {/* ── Filters (contextual) ─────────────────────────────────────────── */}
      {tab === 'students' && (
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Filter by Route</label>
            <select className="field w-auto" value={routeF} onChange={e => setRouteF(e.target.value)}>
              <option value="">All Routes</option>
              {routes.map(r => <option key={r._id} value={r._id}>{r.routeCode} — {r.routeName}</option>)}
            </select>
          </div>
        </div>
      )}

      {(tab === 'maintenance' || tab === 'fuel') && (
        <div className="card p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Vehicle</label>
            <select className="field w-auto" value={vehicleF} onChange={e => setVehicleF(e.target.value)}>
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" className="field" value={fromF} onChange={e => setFromF(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="field" value={toF} onChange={e => setToF(e.target.value)} />
          </div>
          <button className="btn-ghost" onClick={() => { setVehicleF(''); setFromF(''); setToF('') }}>Clear</button>
        </div>
      )}

      {/* ── Report Content ───────────────────────────────────────────────── */}
      <div id="print-area">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="card p-10 text-center text-red-500">{error}</div>
        ) : !data ? null : (

          <>
            {/* ════ SUMMARY ════ */}
            {tab === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Vehicles',        value: data.totalVehicles,  bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300' },
                    { label: 'Active Routes',          value: data.totalRoutes,    bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
                    { label: 'Transport Students',     value: data.totalStudents,  bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
                    { label: 'Active Drivers',         value: data.totalDrivers,   bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300' },
                    { label: 'Total Maintenance Cost', value: `Rs. ${fmt(data.totalMaintCost)}`, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
                    { label: 'Total Fuel Cost',        value: `Rs. ${fmt(data.totalFuelCost)}`,  bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
                  ].map(c => (
                    <div key={c.label} className={`card p-6 rounded-xl ${c.bg}`}>
                      <div className={`text-2xl font-bold ${c.text}`}>{c.value ?? '—'}</div>
                      <div className={`text-sm font-medium mt-1 ${c.text} opacity-80`}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ STUDENTS ════ */}
            {tab === 'students' && (
              rows.length === 0
                ? <div className="py-6"><EmptyState title="No student transport records found" sub="Assign students to routes from the Student Transport page" /></div>
                : <div className="card overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total: {total} student(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="table-head">
                          <th className="table-cell text-center w-8">#</th>
                          <th className="table-cell text-left">Student</th>
                          <th className="table-cell text-left">Class</th>
                          <th className="table-cell text-left">Route</th>
                          <th className="table-cell text-left">Pickup Stop</th>
                          <th className="table-cell text-left">Drop-off Stop</th>
                          <th className="table-cell text-left">Vehicle</th>
                          <th className="table-cell text-right">Fee (Rs./mo)</th>
                          <th className="table-cell text-left">Effective From</th>
                          <th className="table-cell text-left">Status</th>
                        </tr></thead>
                        <tbody>
                          {rows.map((s, i) => (
                            <tr key={s._id} className="table-row">
                              <td className="table-cell text-center text-gray-400 text-xs">{i + 1}</td>
                              <td className="table-cell font-medium">{s.student?.studentName || '—'}</td>
                              <td className="table-cell text-xs">{s.student?.classApplying || '—'}</td>
                              <td className="table-cell text-xs">{s.route?.routeCode || '—'}</td>
                              <td className="table-cell text-xs">{s.pickupStop?.stopName  || '—'}</td>
                              <td className="table-cell text-xs">{s.dropoffStop?.stopName || '—'}</td>
                              <td className="table-cell text-xs">{s.vehicle?.vehicleNumber || '—'}</td>
                              <td className="table-cell text-right font-semibold text-green-600">{fmt(s.transportFee)}</td>
                              <td className="table-cell text-xs">{date(s.effectiveFrom)}</td>
                              <td className="table-cell">
                                <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'suspended' ? 'badge-yellow' : 'badge-gray'}`}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 dark:bg-gray-800 font-semibold text-sm">
                            <td className="table-cell" colSpan={7}>Total Monthly Fees</td>
                            <td className="table-cell text-right text-green-600">
                              Rs. {fmt(rows.reduce((s, r) => s + (r.transportFee || 0), 0))}
                            </td>
                            <td className="table-cell" colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
            )}

            {/* ════ ROUTES ════ */}
            {tab === 'route' && (
              rows.length === 0
                ? <div className="py-6"><EmptyState title="No routes found" sub="Add routes from the Routes page" /></div>
                : <div className="card overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total: {total} route(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="table-head">
                          <th className="table-cell text-left">Code</th>
                          <th className="table-cell text-left">Route Name</th>
                          <th className="table-cell text-left">Start → End</th>
                          <th className="table-cell text-left">Morning</th>
                          <th className="table-cell text-left">Return</th>
                          <th className="table-cell text-left">Vehicle</th>
                          <th className="table-cell text-left">Driver</th>
                          <th className="table-cell text-center">Stops</th>
                          <th className="table-cell text-center">Students</th>
                          <th className="table-cell text-left">Status</th>
                        </tr></thead>
                        <tbody>
                          {rows.map(r => (
                            <tr key={r._id} className="table-row">
                              <td className="table-cell font-mono font-semibold text-primary-600">{r.routeCode}</td>
                              <td className="table-cell font-medium">{r.routeName}</td>
                              <td className="table-cell text-xs">{r.startPoint} → {r.endPoint}</td>
                              <td className="table-cell text-xs">{r.morningStartTime || '—'}</td>
                              <td className="table-cell text-xs">{r.returnStartTime  || '—'}</td>
                              <td className="table-cell text-xs">{r.vehicle?.vehicleNumber || '—'}</td>
                              <td className="table-cell text-xs">{r.driver?.name || '—'}</td>
                              <td className="table-cell text-center font-semibold">{r.stops ?? 0}</td>
                              <td className="table-cell text-center font-semibold text-primary-600">{r.students ?? 0}</td>
                              <td className="table-cell">
                                <span className={`badge ${r.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{r.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
            )}

            {/* ════ MAINTENANCE ════ */}
            {tab === 'maintenance' && (
              rows.length === 0
                ? <div className="py-6"><EmptyState title="No maintenance records found" sub="Add records from the Vehicle Maintenance page" /></div>
                : <>
                    <div className="card p-4 flex flex-wrap gap-6 text-sm mb-2">
                      <span>Records: <strong>{total}</strong></span>
                      <span>Total Cost: <strong className="text-red-600">Rs. {fmt(data.totalCost)}</strong></span>
                    </div>
                    <div className="card overflow-hidden">
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
                            <th className="table-cell text-left">Invoice</th>
                          </tr></thead>
                          <tbody>
                            {rows.map(r => (
                              <tr key={r._id} className="table-row">
                                <td className="table-cell font-mono font-semibold">{r.vehicle?.vehicleNumber || '—'}</td>
                                <td className="table-cell text-xs">{date(r.serviceDate)}</td>
                                <td className="table-cell text-xs capitalize">{r.maintenanceType?.replace(/-/g, ' ') || '—'}</td>
                                <td className="table-cell text-xs max-w-[160px] truncate">{r.description || '—'}</td>
                                <td className="table-cell text-xs">{r.garage || '—'}</td>
                                <td className="table-cell text-right font-semibold text-red-600">{fmt(r.cost)}</td>
                                <td className="table-cell text-xs">{date(r.nextServiceDate)}</td>
                                <td className="table-cell text-xs">{r.invoiceNumber || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 dark:bg-gray-800 font-semibold text-sm">
                              <td className="table-cell" colSpan={5}>Total</td>
                              <td className="table-cell text-right text-red-600">Rs. {fmt(data.totalCost)}</td>
                              <td className="table-cell" colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
            )}

            {/* ════ FUEL ════ */}
            {tab === 'fuel' && (
              rows.length === 0
                ? <div className="py-6"><EmptyState title="No fuel records found" sub="Add fuel records from the Fuel Management page" /></div>
                : <>
                    <div className="card p-4 flex flex-wrap gap-6 text-sm mb-2">
                      <span>Records: <strong>{total}</strong></span>
                      <span>Total Qty: <strong>{(data.totalQty || 0).toFixed(1)} L</strong></span>
                      <span>Total Cost: <strong className="text-red-600">Rs. {fmt(data.totalCost)}</strong></span>
                      {data.totalQty > 0 && (
                        <span>Avg Rate: <strong>Rs. {(data.totalCost / data.totalQty).toFixed(2)}/L</strong></span>
                      )}
                    </div>
                    <div className="card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="table-head">
                            <th className="table-cell text-left">Date</th>
                            <th className="table-cell text-left">Vehicle</th>
                            <th className="table-cell text-left">Fuel Type</th>
                            <th className="table-cell text-right">Qty (L)</th>
                            <th className="table-cell text-right">Rate/L (Rs.)</th>
                            <th className="table-cell text-right">Total (Rs.)</th>
                            <th className="table-cell text-right">Mileage</th>
                            <th className="table-cell text-left">Station</th>
                            <th className="table-cell text-left">Driver</th>
                          </tr></thead>
                          <tbody>
                            {rows.map(r => (
                              <tr key={r._id} className="table-row">
                                <td className="table-cell text-xs">{date(r.date)}</td>
                                <td className="table-cell font-mono font-semibold">{r.vehicle?.vehicleNumber || '—'}</td>
                                <td className="table-cell text-xs capitalize">{r.fuelType}</td>
                                <td className="table-cell text-right">{r.quantity}</td>
                                <td className="table-cell text-right">{r.ratePerUnit}</td>
                                <td className="table-cell text-right font-semibold text-red-600">{fmt(r.totalCost)}</td>
                                <td className="table-cell text-right text-xs">{r.currentMileage ? `${r.currentMileage} km` : '—'}</td>
                                <td className="table-cell text-xs">{r.fuelStation || '—'}</td>
                                <td className="table-cell text-xs">{r.driver?.name || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 dark:bg-gray-800 font-semibold text-sm">
                              <td className="table-cell" colSpan={3}>Total</td>
                              <td className="table-cell text-right">{(data.totalQty || 0).toFixed(1)} L</td>
                              <td className="table-cell" />
                              <td className="table-cell text-right text-red-600">Rs. {fmt(data.totalCost)}</td>
                              <td className="table-cell" colSpan={3} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    {/* Monthly chart */}
                    {rows.length > 0 && (() => {
                      const monthMap = {}
                      rows.forEach(r => {
                        const d = new Date(r.date)
                        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                        monthMap[k] = (monthMap[k] || 0) + (r.totalCost || 0)
                      })
                      const chartData = Object.entries(monthMap).sort().map(([k, v]) => ({
                        month: k, cost: v
                      }))
                      return chartData.length > 1 ? (
                        <div className="card p-5 mt-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Fuel Cost by Month (Rs.)</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={v => [`Rs. ${v.toLocaleString()}`, 'Cost']} />
                              <Bar dataKey="cost" fill="#54B435" radius={[4,4,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : null
                    })()}
                  </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
