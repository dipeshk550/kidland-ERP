import { useState, useEffect } from 'react'
import { FaChartBar, FaBook, FaExclamationTriangle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#54B435','#3b82f6','#ef4444','#f59e0b']

export default function LibraryReports() {
  const [summary, setSummary] = useState(null)
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/library/reports/summary'),
      api.get('/library/reports/overdue?limit=20'),
    ]).then(([s, o]) => {
      setSummary(s)
      setOverdue(o.data || [])
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false))
  }, [])

  const pieData = summary ? [
    { name: 'Available',  value: summary.availableBooks },
    { name: 'Issued',     value: summary.issuedBooks    },
  ].filter(d => d.value > 0) : []

  const fineBarData = summary ? [
    { name: 'Total Fines',  amount: summary.totalFines  },
    { name: 'Unpaid Fines', amount: summary.unpaidFines },
  ] : []

  if (loading) return <div className="flex justify-center py-24"><Spinner/></div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
          <FaChartBar size={16} className="text-teal-500"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Library Reports</h1>
          <p className="text-xs text-gray-400">Inventory overview and fine statistics</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            ['Total Book Titles',  summary.totalBooks,      'text-gray-700',   'bg-gray-50 dark:bg-gray-800/50'],
            ['Available Copies',   summary.availableBooks,  'text-green-600',  'bg-green-50 dark:bg-green-900/20'],
            ['Issued Copies',      summary.issuedBooks,     'text-blue-600',   'bg-blue-50 dark:bg-blue-900/20'],
            ['Overdue Issues',     summary.overdueIssues,   'text-red-600',    'bg-red-50 dark:bg-red-900/20'],
            [`Total Fines (Rs.)`,  Number(summary.totalFines||0).toLocaleString(),  'text-orange-600', 'bg-orange-50 dark:bg-orange-900/20'],
            [`Unpaid Fines (Rs.)`, Number(summary.unpaidFines||0).toLocaleString(), 'text-red-600',    'bg-red-50 dark:bg-red-900/20'],
          ].map(([l, v, tc, bg]) => (
            <div key={l} className={`card p-4 ${bg}`}>
              <div className={`text-2xl font-black ${tc}`}>{typeof v === 'number' ? v : v}</div>
              <div className="text-xs text-gray-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Inventory Pie */}
        {pieData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm">Book Inventory Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Fine Bar */}
        {fineBarData.some(d => d.amount > 0) && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm">Fine Summary (Rs.)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fineBarData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip formatter={v => [`Rs. ${Number(v).toLocaleString()}`, 'Amount']}/>
                <Bar dataKey="amount" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Overdue Books Table */}
      {overdue.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" size={14}/>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Overdue Books ({overdue.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-head">Issue No</th>
              <th className="table-head">Borrower</th>
              <th className="table-head">Book</th>
              <th className="table-head">Due Date</th>
              <th className="table-head text-center">Late Days</th>
              <th className="table-head text-right">Est. Fine</th>
            </tr></thead>
            <tbody>
              {overdue.map(row => (
                <tr key={row._id} className="table-row bg-red-50/50 dark:bg-red-900/5">
                  <td className="table-cell font-mono text-xs text-primary-600 dark:text-primary-400">{row.issueNo}</td>
                  <td className="table-cell font-medium text-gray-800 dark:text-gray-100">{row.borrowerName}</td>
                  <td className="table-cell text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.book?.title}</td>
                  <td className="table-cell text-red-500 text-xs font-semibold">{new Date(row.dueDate).toLocaleDateString()}</td>
                  <td className="table-cell text-center">
                    <span className="font-black text-red-500">{row.lateDays}</span>
                  </td>
                  <td className="table-cell text-right font-mono font-bold text-red-500">Rs. {(row.lateDays * 10).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
