import { useState, useEffect } from 'react'
import { FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import { Spinner } from '../../../components/ui/index'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['#54B435','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']
const METHOD_COLORS = { cash:'#54B435', bank:'#3b82f6', esewa:'#7c3aed', khalti:'#8b5cf6', fonepay:'#0891b2', cheque:'#d97706', other:'#6b7280' }

const CY = new Date().getFullYear()

function StatCard({ label, value, sub, tc, bg, icon }) {
  return (
    <div className={`card p-4 ${bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{label}</div>
          <div className={`text-2xl font-black ${tc}`}>{value}</div>
          {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
        {icon && <div className="text-3xl opacity-10">{icon}</div>}
      </div>
    </div>
  )
}

export default function FeesReports() {
  const [summary, setSummary]       = useState(null)
  const [loadingSum, setLoadingSum] = useState(false)

  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10))
  const [daily, setDaily]           = useState(null)
  const [loadingDay, setLoadingDay] = useState(false)

  const [month, setMonth]           = useState(new Date().getMonth() + 1)
  const [year, setYear]             = useState(CY)
  const [monthly, setMonthly]       = useState(null)
  const [loadingMon, setLoadingMon] = useState(false)

  // Trend: last 6 months collection
  const [trend, setTrend]           = useState([])
  const [loadingTrend, setLoadingTrend] = useState(false)

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadSummary()
    loadTrend()
    loadDailyAuto()
  }, [])

  const loadSummary = async () => {
    setLoadingSum(true)
    try { const r = await api.get('/fees/reports/summary'); setSummary(r) }
    catch (e) { toast.error(e.message) } finally { setLoadingSum(false) }
  }

  const loadDailyAuto = async () => {
    setLoadingDay(true)
    try { const r = await api.get(`/fees/reports/daily?date=${new Date().toISOString().slice(0,10)}`); setDaily(r) }
    catch { } finally { setLoadingDay(false) }
  }

  const loadDaily = async () => {
    setLoadingDay(true)
    try { const r = await api.get(`/fees/reports/daily?date=${date}`); setDaily(r) }
    catch (e) { toast.error(e.message) } finally { setLoadingDay(false) }
  }

  const loadMonthly = async () => {
    setLoadingMon(true)
    try { const r = await api.get(`/fees/reports/monthly?year=${year}&month=${month}`); setMonthly(r) }
    catch (e) { toast.error(e.message) } finally { setLoadingMon(false) }
  }

  const loadTrend = async () => {
    setLoadingTrend(true)
    try {
      const rows = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const m = d.getMonth() + 1
        const y = d.getFullYear()
        const r = await api.get(`/fees/reports/monthly?year=${y}&month=${m}`)
        rows.push({
          name:   `${MONTHS[m - 1]} ${String(y).slice(-2)}`,
          amount: r.summary?.totalCollection || 0,
          txns:   r.summary?.totalTransactions || 0,
        })
      }
      setTrend(rows)
    } catch { } finally { setLoadingTrend(false) }
  }

  // Method chart data from daily
  const methodData = daily?.summary?.byMethod
    ? Object.entries(daily.summary.byMethod).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1), amount: v, fill: METHOD_COLORS[k] || '#6b7280',
      }))
    : []

  const pieTotalAmount = methodData.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <span className="text-violet-500 font-black text-lg">₹</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fee Reports</h1>
            <p className="text-xs text-gray-400">Financial overview & collection analytics</p>
          </div>
        </div>
        <button onClick={loadSummary} className="btn-ghost text-xs">↻ Refresh</button>
      </div>

      {/* ── Summary Cards ── */}
      {loadingSum ? (
        <div className="flex justify-center py-8"><Spinner/></div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Today's Collection" value={`Rs. ${Number(summary.todayCollection || 0).toLocaleString()}`}
            sub={`${summary.todayTransactions || 0} transaction${summary.todayTransactions !== 1 ? 's' : ''}`}
            tc="text-green-600" bg="bg-green-50 dark:bg-green-900/20"/>
          <StatCard label="This Month" value={`Rs. ${Number(summary.monthCollection || 0).toLocaleString()}`}
            sub="Current month"
            tc="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20"/>
          <StatCard label="Total Collected" value={`Rs. ${Number(summary.totalCollection || 0).toLocaleString()}`}
            sub="All time"
            tc="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20"/>
          <StatCard label="Total Transactions" value={Number(summary.totalTransactions || 0).toLocaleString()}
            sub="All receipts"
            tc="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20"/>
        </div>
      )}

      {/* ── Trend Chart ── */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Collection Trend — Last 6 Months</h2>
          {loadingTrend && <Spinner size="sm"/>}
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
              <Tooltip
                formatter={v => [`Rs. ${Number(v).toLocaleString()}`, 'Collected']}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}/>
              <Line type="monotone" dataKey="amount" stroke="#54B435" strokeWidth={2.5}
                dot={{ fill: '#54B435', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#54B435' }}/>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center py-10"><Spinner size="sm"/></div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* ── Daily Report ── */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">Daily Report</h2>
          <div className="flex gap-2 mb-4">
            <input type="date" className="field flex-1 text-sm" value={date} onChange={e => setDate(e.target.value)}/>
            <button onClick={loadDaily} disabled={loadingDay} className="btn-primary px-4">
              {loadingDay ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaSearch size={12}/>}
            </button>
          </div>
          {loadingDay ? <div className="flex justify-center py-6"><Spinner size="sm"/></div>
          : daily ? (
            <>
              <div className="space-y-2.5 mb-4">
                {[
                  ['Transactions',       daily.summary?.totalTransactions, 'font-bold text-gray-700 dark:text-gray-200'],
                  ['Total Collected',    `Rs. ${Number(daily.summary?.totalCollection || 0).toLocaleString()}`, 'font-bold text-green-600'],
                  ['Total Discount',     `Rs. ${Number(daily.summary?.totalDiscount || 0).toLocaleString()}`,  'text-blue-500'],
                ].map(([l, v, tc]) => (
                  <div key={l} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{l}</span>
                    <span className={tc}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Payment method pie chart */}
              {pieTotalAmount > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Collection by Method</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={methodData} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65}
                        paddingAngle={2}
                        label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                        {methodData.map((d, i) => <Cell key={i} fill={d.fill}/>)}
                      </Pie>
                      <Tooltip formatter={v => [`Rs. ${Number(v).toLocaleString()}`, '']}/>
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
              {pieTotalAmount === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">No transactions on this date</div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Select a date and click search</div>
          )}
        </div>

        {/* ── Monthly Report ── */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">Monthly Report</h2>
          <div className="flex gap-2 mb-4">
            <select className="field text-sm flex-1" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" className="field w-20 text-sm" value={year}
              onChange={e => setYear(e.target.value)} min="2000" max="2100"/>
            <button onClick={loadMonthly} disabled={loadingMon} className="btn-primary px-4">
              {loadingMon ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaSearch size={12}/>}
            </button>
          </div>
          {loadingMon ? <div className="flex justify-center py-6"><Spinner size="sm"/></div>
          : monthly ? (
            <>
              <div className="space-y-3 mb-4">
                {[
                  ['Total Transactions', monthly.summary?.totalTransactions, 'text-gray-700 dark:text-gray-200 text-xl'],
                  ['Total Collected',    `Rs. ${Number(monthly.summary?.totalCollection || 0).toLocaleString()}`, 'text-green-600 text-2xl'],
                  ['Total Discount',     `Rs. ${Number(monthly.summary?.totalDiscount || 0).toLocaleString()}`,  'text-blue-500 text-lg'],
                ].map(([l, v, tc]) => (
                  <div key={l} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-500">{l}</span>
                    <span className={`font-black font-mono ${tc}`}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Day-wise bar chart if available */}
              {monthly.byDay?.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Daily Breakdown</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={monthly.byDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
                      <YAxis hide/>
                      <Tooltip formatter={v => [`Rs. ${Number(v).toLocaleString()}`, 'Collected']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}/>
                      <Bar dataKey="amount" fill="#54B435" radius={[3, 3, 0, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">Select month/year and click search</div>
          )}
        </div>
      </div>

      {/* ── Bar: Trend amounts ── */}
      {trend.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-4">Monthly Collection Bar — Last 6 Months</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
              <Tooltip
                formatter={v => [`Rs. ${Number(v).toLocaleString()}`, 'Collected']}
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}/>
              <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                {trend.map((_, i) => <Cell key={i} fill={i === trend.length - 1 ? '#54B435' : '#a3e88b'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
