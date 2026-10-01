import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaMoneyBillWave, FaUserGraduate, FaRoute, FaArrowRight,
         FaLayerGroup, FaTags, FaFileAlt, FaSearch, FaChartLine, FaExclamationTriangle } from 'react-icons/fa'
import { Spinner } from '../../../components/ui/index'
import api from '../../../services/api'

export default function TransportFees() {
  const [summary, setSummary]     = useState(null)
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/transport/fees-summary'),
      api.get('/transport/students', { params: { status: 'active', limit: 100 } }),
    ]).then(([s, st]) => {
      setSummary(s)
      setStudents(st.data || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transport Fees</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Transport fees are managed through the Fees Management module</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
            <FaUserGraduate size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.totalStudents || 0}</div>
            <div className="text-xs text-gray-500">Active Transport Students</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
            <FaMoneyBillWave size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {(summary?.totalMonthlyFees || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Monthly Transport Fees</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
            <FaRoute size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {(summary?.avgFee || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Average Fee per Student</div>
          </div>
        </div>
      </div>

      {/* Info Guide */}
      <div className="card p-6 border-l-4 border-primary-400 bg-primary-50/50 dark:bg-primary-900/10">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FaMoneyBillWave className="text-primary-500" /> How Transport Fee Collection Works
        </h3>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Go to <strong>Fee Types</strong> → Add a fee type named <em>"Transportation Fee"</em> under the Transportation fee group</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Go to <strong>Fee Master</strong> → Set the monthly transport fee amount for each class/grade</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Go to <strong>Collect Fees</strong> → Search for the student → The transportation fee will appear automatically in the bill</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span>The receipt will be generated automatically. <strong>Fees Due</strong> will show overdue transport fees.</span>
          </li>
        </ol>
      </div>

      {/* Quick Action Buttons */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Quick Actions — Fees Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Fee Groups',      to: '/admin/fees/groups',    icon: FaLayerGroup,   desc: 'Manage fee groups' },
            { label: 'Fee Types',       to: '/admin/fees/types',     icon: FaTags,         desc: 'Add Transportation Fee type' },
            { label: 'Fee Master',      to: '/admin/fees/master',    icon: FaFileAlt,      desc: 'Set fees per class' },
            { label: 'Collect Fees',    to: '/admin/fees/collect',   icon: FaMoneyBillWave,desc: 'Collect transport fees' },
            { label: 'Fees Due',        to: '/admin/fees/due',       icon: FaExclamationTriangle, desc: 'View overdue fees' },
            { label: 'Search Payments', to: '/admin/fees/payments',  icon: FaSearch,       desc: 'Find payment records' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600">
                  <a.icon size={14} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">{a.label}</div>
                  <div className="text-xs text-gray-500">{a.desc}</div>
                </div>
              </div>
              <FaArrowRight size={11} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Active Students with Transport Fee */}
      {students.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">Active Transport Students & Fees</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-head">
                <th className="table-cell text-left">Student</th>
                <th className="table-cell text-left">Class</th>
                <th className="table-cell text-left">Route</th>
                <th className="table-cell text-left">Pickup Stop</th>
                <th className="table-cell text-right">Fee (Rs./month)</th>
                <th className="table-cell text-left">Status</th>
              </tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="table-row">
                    <td className="table-cell font-medium">{s.student?.studentName}</td>
                    <td className="table-cell text-xs">{s.student?.classApplying}</td>
                    <td className="table-cell text-xs">{s.route?.routeCode} — {s.route?.routeName}</td>
                    <td className="table-cell text-xs">{s.pickupStop?.stopName || '—'}</td>
                    <td className="table-cell text-right font-semibold text-green-600">{(s.transportFee || 0).toLocaleString()}</td>
                    <td className="table-cell"><span className="badge badge-green">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
