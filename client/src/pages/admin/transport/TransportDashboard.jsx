import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaBus, FaRoute, FaUserGraduate, FaIdCard, FaTools, FaGasPump,
         FaExclamationTriangle, FaPlus, FaArrowRight, FaCheckCircle } from 'react-icons/fa'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer } from 'recharts'
import { Spinner } from '../../../components/ui/index'
import api from '../../../services/api'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatCard({ icon: Icon, label, value, color = 'green', sub }) {
  const colors = {
    green:  'bg-green-50 dark:bg-green-900/20 text-green-600',
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  }
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function TransportDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/transport/dashboard')
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fuelChart = (data?.monthlyFuel || []).map(m => ({
    month: `${MONTHS[m._id.m - 1]} ${m._id.y}`,
    amount: m.total,
  }))
  const maintChart = (data?.monthlyMaintenance || []).map(m => ({
    month: `${MONTHS[m._id.m - 1]} ${m._id.y}`,
    amount: m.total,
  }))
  const routeChart = (data?.studentsByRoute || []).map(r => ({
    route: r.routeName?.slice(0, 12) || 'Unknown',
    students: r.count,
  }))

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const s = data?.stats || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transport Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of school transportation</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/transport/routes" className="btn-primary text-sm">
            <FaPlus size={12} /> Add Route
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FaBus}          label="Total Vehicles"       value={s.totalVehicles}   color="blue" sub={`${s.activeVehicles} active`} />
        <StatCard icon={FaRoute}        label="Total Routes"         value={s.totalRoutes}     color="green" sub={`${s.activeRoutes} active`} />
        <StatCard icon={FaUserGraduate} label="Transport Students"   value={s.activeStudents}  color="purple" />
        <StatCard icon={FaIdCard}       label="Active Drivers"       value={s.totalDrivers}    color="blue" />
        <StatCard icon={FaBus}          label="Today's Pickup"       value={s.todayPickup}     color="green" />
        <StatCard icon={FaBus}          label="Today's Drop-off"     value={s.todayDropoff}    color="green" />
        <StatCard icon={FaTools}        label="Pending Maintenance"  value={s.pendingMaintenance} color="yellow" />
        <StatCard icon={FaGasPump}      label="Total Fuel Cost"      value={`Rs. ${(s.totalFuelCost||0).toLocaleString()}`} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students by Route */}
        {routeChart.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Students by Route</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={routeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="route" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#54B435" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Fuel */}
        {fuelChart.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Monthly Fuel Expenses (Rs.)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fuelChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#54B435" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Maintenance */}
        {maintChart.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Monthly Maintenance Cost (Rs.)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={maintChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Expiry Warnings */}
      {data?.expiryWarnings?.length > 0 && (
        <div className="card p-5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <FaExclamationTriangle className="text-amber-500" />
            <h3 className="font-semibold text-amber-700 dark:text-amber-400">Document Expiry Warnings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Vehicle</th>
                <th className="table-cell text-left">Insurance Expiry</th>
                <th className="table-cell text-left">Tax Expiry</th>
                <th className="table-cell text-left">Fitness Expiry</th>
              </tr></thead>
              <tbody>
                {data.expiryWarnings.map(v => (
                  <tr key={v._id} className="table-row">
                    <td className="table-cell font-semibold">{v.vehicleNumber}</td>
                    <td className="table-cell">{v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">{v.taxExpiry ? new Date(v.taxExpiry).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">{v.fitnessExpiry ? new Date(v.fitnessExpiry).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Add Route',       to: '/admin/transport/routes',    icon: FaRoute },
            { label: 'Add Vehicle',     to: '/admin/transport/vehicles',  icon: FaBus },
            { label: 'Add Driver',      to: '/admin/transport/drivers',   icon: FaIdCard },
            { label: 'Assign Student',  to: '/admin/transport/students',  icon: FaUserGraduate },
            { label: 'Pickup/Drop-off', to: '/admin/transport/attendance',icon: FaCheckCircle },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-sm text-gray-700 dark:text-gray-300 group">
              <div className="flex items-center gap-2">
                <a.icon size={14} className="text-primary-500" />
                <span className="font-medium">{a.label}</span>
              </div>
              <FaArrowRight size={10} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
